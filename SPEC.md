---
spec: Admin Dashboard
status: Approved (plan), pending implementation
owner: TBD
target release: TBD
last updated: 2026-07-03
---

# SPEC — Admin Dashboard (CRUD for Spots & Sport Events)

This spec is the implementation plan for the admin dashboard of Open Spot. It
covers (a) the new admin surface for reading, adding, updating, and deleting
`spots` and `sport_events` records, and (b) the redesigned create-spot flow
that uses a pasted latitude/longitude as the seed and reverse-geocodes it
through Nominatim before allowing the operator to edit the result.

> **Scope reminder.** The public app stays unchanged: the `/post` page becomes
> a stub that links to the admin dashboard. The community / saved-spots
> flow is not affected. The Map, Sport Events, Explore, Saved, Account, and
> Login pages keep their current behaviour.

---

## 0. Glossary

| Term | Meaning |
| --- | --- |
| Admin | A signed-in user whose email is in the `ADMIN_EMAILS` allow-list, or the dev placeholder user `DEV_USER_ID = "dev"` when Supabase is unconfigured. |
| JSON mode | Runtime mode when `SPOTS_DATA_SOURCE=json` (the default). Reads from `src/data/*.json`. Writes are intentionally unsupported on the event repository in this mode. |
| DB mode | Runtime mode when `SPOTS_DATA_SOURCE=db`. Reads and writes go through the Drizzle repositories to Postgres + PostGIS. |
| Reverse geocode | A call to Nominatim's `GET /reverse?lat=…&lon=…&format=jsonv2&addressdetails=1` that returns a structured address for a coordinate. |
| Lookup panel | The first step of the new create-spot flow: two numeric inputs + a `Look up` button + a result preview. |

---

## 1. Goals

1. Provide a single admin surface (`/admin/*`) for managing `spots` and `sport_events`.
2. Replace the manual text-entry create-spot flow with a lat/lon → reverse-geocode → edit → save flow.
3. Keep the create-spot code path unified: one Zod schema, one repository method, one action.
4. Surface the new flow as a curated tool the admin uses to bootstrap and curate the catalogue.
5. Preserve the existing monochrome design system and a11y rules (`eslint-plugin-jsx-a11y`).

## 2. Non-goals

- Per-row audit log, soft delete, restore.
- Bulk import / export (CSV/JSON).
- A role management UI (admins are configured via env, not via in-app UI).
- A multi-image gallery per spot (the schema supports one image; the new form keeps that contract).
- An in-app map editor (drag-to-edit pins). The existing `/map` page stays read-only.
- Modifying the public `SpotCard`, `SpotDetailsContent`, `SportEventsTab`, or `AppShell` views.
- Soft delete and trash view (deletes are hard and immediate).

## 3. Roles & access

### 3.1 Identity model

There is currently no admin concept in the codebase. We introduce **email allow-list** as the only admin gate, with the dev placeholder as an automatic fallback.

- New env var: `ADMIN_EMAILS` (CSV, case-insensitive, default `""`).
- `src/lib/user.ts` `User.email` (already populated from Supabase `auth.getClaims()` via `userFromClaims`) is the comparison key.
- When Supabase is **unconfigured**, the dev placeholder user `DEV_USER_ID = "dev"` (email `devopenspot@gmail.com`) is treated as admin unconditionally. This matches the existing dev-mode conventions (`useSignOut` already returns `isSignedIn: user.id !== DEV_USER_ID`).
- When Supabase **is** configured, only users whose email is in `ADMIN_EMAILS` are admin. The dev user does not exist in that mode.

### 3.2 New helpers

`src/lib/admin.ts` (new):

```ts
import { env } from "@/lib/env";
import { DEV_USER_ID, type User } from "@/lib/user";

function parseAdminEmails(raw: string): readonly string[] {
  return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function getAdminEmails(): readonly string[] {
  return parseAdminEmails(env.ADMIN_EMAILS);
}

export function isAdminUser(
  user: User,
  adminEmails: readonly string[] = getAdminEmails(),
): boolean {
  if (user.id === DEV_USER_ID) return true;
  return adminEmails.includes(user.email.toLowerCase());
}
```

`src/lib/auth.ts` `getServerUserFromCookies` spreads `isAdmin: isAdminUser(fromClaims)` over the result of `userFromClaims` so the `User` returned to the client always carries the correct `isAdmin` flag.

`src/lib/auth/server.ts` gains two siblings that mirror the existing `requireUser` / `requireUserOrRedirect`:

- `requireAdminOrRedirect(nextPath: string): Promise<User>` — for Server Components; throws `redirect("/")` on failure.
- `requireAdmin(): Promise<User>` — for server actions and route handlers; throws `Error("Admin only")` on failure. Callers handle the throw.

The two new guards live in `auth/server.ts` (alongside `requireUser`) rather than `admin.ts` to keep the dependency graph acyclic: `auth.ts` ↔ `admin.ts` would otherwise be a cycle. `admin.ts` stays a pure module with no auth imports and is therefore safe to import from client components.

`src/lib/user-context.tsx` and `useUser()` expose `isAdmin: boolean` on the `User` so client components can hide/show admin UI without a server round trip.

`src/hooks/useUser.ts` re-exports the new field.

### 3.3 Threat model

- An attacker who can read `ADMIN_EMAILS` from `.env.local` and guess a Supabase auth email gets admin. Mitigation: keep `.env` files git-ignored (already the case per `.gitignore`) and never log `ADMIN_EMAILS` (the singleton `log` is the only logger; do not add an `ADMIN_EMAILS` log line anywhere).
- The reverse-geocode API route is admin-gated so anonymous traffic does not pollute the Nominatim quota.
- Server actions validate input via Zod; repository methods do not trust caller-provided `createdBy` (the new admin actions do not set `createdBy`; the creator of record is the admin's `user.id` if the column is non-null, else `null` — see §6.3).

---

## 4. Routes & navigation

### 4.1 URL map

```
src/app/
  admin/
    layout.tsx                  # requireAdminOrRedirect("/admin"); renders AdminShell
    page.tsx                    # overview cards: counts of spots, events, saved_spots
    spots/
      page.tsx                  # paginated list + search/filter
      new/page.tsx              # new create-spot flow (lat/lon → reverse → edit → save)
      [id]/page.tsx             # edit (server-rendered initial values)
    events/
      page.tsx                  # paginated list
      new/page.tsx
      [id]/page.tsx
  api/
    geocode/
      reverse/route.ts          # GET ?lat=&lon= → Nominatim /reverse (proxied)
```

### 4.2 `/post` becomes a stub

`src/app/post/page.tsx` is replaced with a Server Component that:
1. Calls `await requireUserOrRedirect("/post")` (keeps today's gating).
2. Renders a new `<PostClosedNotice />` client component: monochrome panel with one `Go to admin dashboard` button linking to `/admin/spots/new` (or `/admin` if not admin) and a `Back to directory` link.

After the migration, these files are deleted:
- `src/components/post/PostForm.tsx`
- `src/components/post/PostTab.tsx`
- `src/components/post/PostSuccessScreen.tsx`

### 4.3 Navigation

`src/lib/types.ts` — extend `TabType`:
```ts
export type TabType = "explore" | "saved" | "map" | "post" | "events" | "admin";
```

`src/lib/nav.ts` — add a new `NAV_ITEMS` entry:
```ts
{
  id: "admin",
  path: "/admin",
  label: "Admin",
  shortLabel: "Admin",
  drawerLabel: "Admin",
  Icon: Shield,
}
```

`NAV_ITEMS` itself stays the full list, but the public header / mobile drawer hide the entry unless `useUser().isAdmin` is true. This matches the existing "show Sign in only when dev" pattern in `SignInLink.tsx`.

### 4.4 Sitemap

`src/app/sitemap.ts` explicitly excludes `/admin/*` so search engines do not index admin pages.

---

## 5. Data layer changes

### 5.1 Schema migration

`supabase/migrations/0004_spot_sports.sql` (new):
```sql
ALTER TABLE "public"."spots" ADD COLUMN "sports" text[] NOT NULL DEFAULT '{}';
```

`src/db/schema.ts`:
```ts
sports: text("sports").array().notNull().default([]),
```

`src/lib/schemas/spot.ts`:
- `NewSpotSchema` gains `sports: z.array(SportDisciplineSchema).default([])`.
- `SpotPatchSchema` gains `sports: z.array(SportDisciplineSchema).optional()`.

`src/lib/types.ts` re-exports `SportDiscipline` from `@/types/sport-events` for convenience.

No other schema changes. All existing fields are reused.

### 5.2 Repository changes

`SpotRepository` (`src/lib/repositories/spot-repository.ts`) already exposes `create`, `update`, `delete`. No interface change is needed.

`EventRepository` (`src/lib/repositories/event-repository.ts`) gains three members:
```ts
create(input: NewSportEvent): Promise<SportEvent>
update(id: string, patch: SportEventPatch): Promise<SportEvent>
delete(id: string): Promise<void>
```

`JsonEventRepository` (`src/lib/repositories/json-event-repository.ts`) implements the new members by throwing a clear `Error("sport_events writes are not supported in JSON mode")`. This matches the "JSON is the read-only fallback" philosophy in `src/lib/repositories/index.ts`.

`DrizzleEventRepository` (`src/lib/repositories/drizzle-event-repository.ts`) implements the new members using the same patterns as `DrizzleSpotRepository.create/update/delete` (Drizzle `insert().values().returning()`, `update().set().where().returning()`, `delete().where().returning({ id })`).

`src/lib/schemas/event.ts` adds:
```ts
export const NewSportEventSchema = z
  .object({ /* mirrors SportEvent fields */ })
  .strict();

export const SportEventPatchSchema = z
  .object({ /* same fields, all optional */ })
  .strict();
```

`src/lib/repositories/types.ts` exports `NewSportEvent`, `SportEventPatch`.

`DrizzleSpotRepository.create` and `update` (`src/lib/repositories/drizzle-spot-repository.ts`) thread the new `sports` field through. The Drizzle spot schema's `sports` is a `text[]`; the JSON impl converts `SportDiscipline[]` ↔ `string[]` (the existing code already does this for `features`).

---

## 6. Admin shell & components

### 6.1 New files

```
src/components/admin/
  AdminShell.tsx                # mirrors AppShell, but renders AdminSidebar
  AdminSidebar.tsx              # vertical nav: Overview / Spots / Events
  AdminOverviewCards.tsx        # 3 cards: total spots, total events, saved_spots
  DataModeNotice.tsx            # persistent banner when SPOTS_DATA_SOURCE=json
  common/
    DeleteConfirmDialog.tsx     # wraps Overlay (role="alertdialog")
    FormSection.tsx             # collapsible section card (sharp edges, no shadow)
    KeyValueGrid.tsx            # read-only display of id / createdAt / updatedAt / createdBy
  spots/
    SpotTable.tsx
    SpotTableFilters.tsx
    SpotFormFields.tsx          # shared form fields (used by new + edit)
    SpotFormSubmit.tsx          # action call + toast + redirect
    LatLonLookupPanel.tsx       # the "paste lat/lon → Look up" step
    NominatimAddressPreview.tsx # shows the projected address result
    ImageSourceField.tsx        # lifted out of the old PostForm
  events/
    EventTable.tsx
    EventTableFilters.tsx
    EventFormFields.tsx
    EventFormSubmit.tsx

src/components/post/
  PostClosedNotice.tsx          # the new stub content for /post
```

### 6.2 AdminShell

The admin shell lives **outside** the public `AppShell` so the public nav, search overlay, and header are not double-rendered. The header still shows the `BrandLogo` so the operator knows they are still in the same site. The admin shell reuses:

- `ToastViewport` (from `@/components/feedback/Toast`)
- The `Overlay` primitive (from `@/components/feedback/Overlay`) for modals
- The `SurfaceCard` / `Eyebrow` / `PrimaryButton` / `UserAvatar` primitives
- The `cn` helper and the `log` singleton

The admin shell is **not** wrapped by `SpotsProvider` (admin pages do not need the global spots store; they fetch the lists they need).

### 6.3 `createdBy` semantics

Today, `spots.created_by` is set to the signed-in user's UUID (per the public `/post` form). When an admin creates or edits a spot, the existing `createSpotAction` continues to set `createdBy = user.id` where `user` is the admin. The new admin actions (`createSpotFromLookupAction`, `updateSpotAction`) follow the same rule. There is no separate "admin created this" marker; the admin's `user.id` is the marker.

### 6.4 `DataModeNotice`

When `getSpotsDataSource() === "json"`, render a persistent yellow-bordered banner at the top of every admin page:

> "JSON mode — writes are disabled. Set `SPOTS_DATA_SOURCE=db` to manage records."

All write buttons become disabled with a `title="DB mode required"` tooltip. This mirrors the philosophy in `src/lib/repositories/index.ts` that JSON is the read-only fallback. The banner never appears in production once `SPOTS_DATA_SOURCE=db` is set.

---

## 7. The new create-spot flow (lat/lon → reverse → edit → save)

The headline behaviour change. The flow lives on a single page (`/admin/spots/new`) with three sequential steps.

### 7.1 Step 1 — Paste lat/lon

`<LatLonLookupPanel>`:
- Two numeric inputs (`lat`, `lon`), client-validated with Zod `z.number().min(-90).max(90)` / `z.number().min(-180).max(180)`.
- A `Look up` button (disabled while pending) that calls `GET /api/geocode/reverse?lat=…&lon=…`.
- While the call is in flight, a skeleton placeholder is shown.
- On error, show an inline error with a `Retry` button. The form is not auto-populated.

### 7.2 Step 2 — Reverse-geocode (server)

`src/app/api/geocode/reverse/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getServerUserFromCookies } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export async function GET(req: NextRequest) {
  const user = await getServerUserFromCookies();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = Query.safeParse({
    lat: url.searchParams.get("lat"),
    lon: url.searchParams.get("lon"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { lat, lon } = parsed.data;
  const nominatim = `${env.NOMINATIM_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`;
  try {
    const r = await fetch(nominatim, {
      headers: {
        "User-Agent": env.NOMINATIM_USER_AGENT,
        "Accept": "application/json",
      },
      // Nominatim enforces a 1 req/sec policy. Do not cache.
      cache: "no-store",
    });
    if (!r.ok) {
      log.warn("geocode.reverse_failed", { status: r.status, lat, lon });
      return NextResponse.json({ error: "Reverse geocode failed" }, { status: 502 });
    }
    const raw = (await r.json()) as NominatimResponse;
    return NextResponse.json({ address: projectAddress(raw) });
  } catch (e) {
    log.error("geocode.reverse_threw", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Reverse geocode unavailable" }, { status: 502 });
  }
}
```

`src/lib/geocode/project.ts` (new) exports:

```ts
export interface ProjectedAddress {
  displayName: string;
  name: string | null;
  road: string | null;
  houseNumber: string | null;
  city: string | null;     // any of city / town / village
  suburb: string | null;
  state: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number;
  lon: number;
}

export function projectAddress(raw: NominatimResponse): ProjectedAddress { /* ... */ }
```

The endpoint **never** returns the raw Nominatim payload (the upstream shape changes; we want a stable contract).

`src/lib/geocode/classify.ts` (new) exports `classifySpotType(raw): SpotType` that mirrors the regex priority list in `json-spot-repository.ts` (Bowl > Pools > Ledges > DIY > Stair > Park > Plaza) but reads from the Nominatim `class` / `type` / `extratags` fields. The result is a default only — the admin can override it on the form.

### 7.3 Step 3 — Edit & save

After the reverse-geocode returns, the form fields below auto-populate but are **fully editable**:

| Field | Auto-filled from | Editable? |
| --- | --- | --- |
| `name` | `displayName` (the spot name; the operator usually hand-tunes) | Yes |
| `city` | `projectedAddress.city` | Yes |
| `address` | composed from `road` + `houseNumber` + `suburb` | Yes |
| `country` | `projectedAddress.country` | Yes |
| `type` | `classifySpotType(raw)` (Plaza / DIY / Stair / …) | Yes |
| `features` | first 5 chips derived from the Nominatim `category` / `type` | Yes |
| `sports` | `[]` (admin picks) | Yes |
| `communityNote` | pre-filled template, blank if not applicable | Yes |
| `crowdLevel` | `35` (sensible default) | Yes (slider 0–100) |
| `image` | preset / URL / file upload — re-uses `<ImageSourceField>` | Yes |

The submit handler calls `createSpotFromLookupAction(formData)`, which is the same code path as the existing `createSpotAction` plus the new `sports` field. After a successful save, the page redirects to `/admin/spots/[id]` so the operator can immediately review / tweak.

### 7.4 Edit flow (`/admin/spots/[id]`)

The same `<SpotFormFields>` renders pre-populated with the existing record. The submit handler calls `updateSpotAction(id, formData)`. Hard delete is available from the table and from the edit page (gated by `<DeleteConfirmDialog>`).

---

## 8. Server actions

All actions live in `src/app/actions/admin-*.ts`, all start with `"use server"`, and all call `requireAdmin()` from `@/lib/auth/server`. They use the `log` singleton from `@/lib/log` for failure paths.

### 8.1 `src/app/actions/admin-spots.ts`

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { getSpotRepositoryAsync } from "@/lib/repositories";
import { NewSpotSchema, SpotPatchSchema } from "@/lib/schemas/spot";
import { log } from "@/lib/log";

export async function createSpotFromLookupAction(formData: FormData): Promise<Spot> {
  const user = await requireAdmin();
  // ... same as createSpotAction: read file (uploadSpotImage), parse, repo.create
  revalidateTag("spots", "max");
  return created;
}

export async function updateSpotAction(id: string, formData: FormData): Promise<Spot> {
  await requireAdmin();
  const parsed = SpotPatchSchema.parse(/* extract from FormData */);
  const repo = await getSpotRepositoryAsync();
  const updated = await repo.update(id, parsed);
  revalidateTag("spots", "max");
  return updated;
}

export async function deleteSpotAction(id: string): Promise<void> {
  await requireAdmin();
  const repo = await getSpotRepositoryAsync();
  await repo.delete(id);
  revalidateTag("spots", "max");
}
```

`createSpotFromLookupAction` mirrors the existing `createSpotAction` (`src/app/actions/spots.ts`) and threads the new `sports` field through `NewSpotSchema.parse(input)`. The existing `createSpotAction` stays in place; the new flow uses the dedicated `createSpotFromLookupAction` so the public-fallback page can still use the simpler text-only path if it is later restored.

### 8.2 `src/app/actions/admin-events.ts`

```ts
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { getEventRepositoryAsync } from "@/lib/repositories";
import { NewSportEventSchema, SportEventPatchSchema } from "@/lib/schemas/event";
import { log } from "@/lib/log";

export async function createEventAction(formData: FormData): Promise<SportEvent> { /* ... */ }
export async function updateEventAction(id: string, formData: FormData): Promise<SportEvent> { /* ... */ }
export async function deleteEventAction(id: string): Promise<void> { /* ... */ }
```

Each event action calls `revalidateTag("sport-events", "max")` and `revalidatePath("/sport-events")`.

### 8.3 Error contract

Per the existing convention, server actions throw plain `Error("Admin only")` on auth failure. The form components wrap the action call in a `try/catch`, surface a `showToast(message, "error")`, and re-enable the submit button. Pages do not `try/catch` around `requireAdminOrRedirect` (the `redirect()` throw is handled by Next.js).

---

## 9. Validation

- `NewSpotSchema` (existing) gains `sports: z.array(SportDisciplineSchema).default([])`.
- `SpotPatchSchema` (existing) gains `sports: z.array(SportDisciplineSchema).optional()`.
- `NewSportEventSchema` (new) mirrors `SportEvent` (Zod transform to coerce `slug` from `id` if missing).
- `SportEventPatchSchema` (new) makes all `SportEvent` fields optional.
- `src/app/api/geocode/reverse/route.ts` uses a thin inline Zod object (see §7.2).

---

## 10. Environment & config

`src/lib/env.ts` — add to `EnvSchema`:
```ts
ADMIN_EMAILS: z.string().default(""),
```

`.env.example`:
```bash
# Comma-separated list of admin emails (case-insensitive). In local dev
# (Supabase unconfigured), the `dev` placeholder user is automatically
# treated as admin.
ADMIN_EMAILS=
```

No new Supabase env, no new external API keys. Nominatim is already configured (`NOMINATIM_URL`, `NOMINATIM_USER_AGENT`).

`src/proxy.ts` — unchanged. The session cookie is already refreshed there.

---

## 11. Testing

The vitest setup already aliases `server-only` → `./test/server-only.ts` and pulls in `@testing-library/jest-dom`. Tests use `happy-dom`. Server actions and route handlers are tested through `vi.mock("@/lib/auth/server", …)`.

### 11.1 New test files

- `src/lib/admin.test.ts` — `isAdminUser` matrix:
  - dev user (`id === "dev"`) → `true` regardless of `ADMIN_EMAILS`
  - email in `ADMIN_EMAILS` (any case) → `true`
  - signed-in user with no email match → `false`
  - empty `ADMIN_EMAILS` env → `false` (only the dev user is admin)
- `src/app/api/geocode/reverse/route.test.ts`:
  - `403` for non-admin
  - `400` for out-of-range coords
  - `200` + projected body for in-range coords (mock `fetch`)
  - `502` on Nominatim upstream error
- `src/app/actions/admin-spots.test.ts`:
  - `requireAdmin` is `vi.mock`-ed per the `route.test.ts` pattern.
  - happy path: action calls `repo.create` / `update` / `delete` and `revalidateTag("spots", "max")`.
  - "Admin only" path: action throws, no repository call, no `revalidateTag`.
- `src/app/actions/admin-events.test.ts` — same shape as above for events.
- `src/components/admin/spots/LatLonLookupPanel.test.tsx`:
  - happy path: types lat/lon, clicks `Look up`, sees preview, sees form populated.
  - `502` path: shows inline error, does not populate the form.

### 11.2 Existing tests

`SpotCard.test.tsx` does not reference `PostForm`; no change required.

---

## 12. Phased implementation

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 1 | **Auth scaffolding.** `src/lib/admin.ts`, `requireAdmin` / `requireAdminOrRedirect`, `ADMIN_EMAILS` env, `useUser().isAdmin` plumbing. No UI yet. | `pnpm typecheck && pnpm lint && pnpm test` pass; `src/lib/admin.test.ts` is green. |
| 2 | **Geocode API route.** `src/app/api/geocode/reverse/route.ts` + test. | `pnpm test` includes the new route test; manual `curl` against `/api/geocode/reverse` with a dev cookie returns a projected address. |
| 3 | **Event repository writes.** New `EventRepository` interface members, `JsonEventRepository` throws, `DrizzleEventRepository` implements, new `NewSportEventSchema` / `SportEventPatchSchema`. | `pnpm typecheck` is green; existing `SportEventsTab` still renders. |
| 4 | **Admin shell + layout.** `/admin` overview, `AdminShell`, `AdminSidebar`, conditional nav entry, `DataModeNotice`. No CRUD yet. | `/admin` renders for an admin; redirects to `/` for a non-admin. |
| 5 | **Spot CRUD + new flow.** `spots` list / new (lat/lon flow) / edit / delete. Includes the `0004_spot_sports.sql` migration, the new `createSpotFromLookupAction` / `updateSpotAction` / `deleteSpotAction`, the new `<LatLonLookupPanel>` / `<NominatimAddressPreview>` / `<ImageSourceField>`. | An admin can paste lat/lon, see a reverse-geocoded preview, edit the fields, save, see the row in the admin list, and edit/delete it. |
| 6 | **Event CRUD.** List / new / edit / delete. Includes the new event actions. | An admin can create / edit / delete a sport event. The public `/sport-events` page reflects changes (via `revalidateTag("sport-events", "max")` + `revalidatePath("/sport-events")`). |
| 7 | **`/post` replacement.** Replace `src/app/post/page.tsx` with a stub. Delete the unused `PostForm` / `PostTab` / `PostSuccessScreen`. | `pnpm typecheck && pnpm lint && pnpm test` green; `git grep PostForm` returns zero hits. |
| 8 | **Cleanup.** Sitemap excludes `/admin/*`; update `AGENTS.md` to mention the dashboard; ensure the `dataMode` banner is wired; ensure the dev env (`SPOTS_DATA_SOURCE=json`) shows the banner. | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all green. |

### 12.1 CI order

`.github/workflows/ci.yml` order is unchanged: `typecheck` → `lint` → `test` → `pnpm db:apply` (the last only if `supabase/migrations/**` changed — which it will, because of `0004_spot_sports.sql`).

### 12.2 Smoke test checklist (manual, before merge)

1. `pnpm dev` with `SPOTS_DATA_SOURCE=json` → `/admin` shows the `DataModeNotice` and disables write buttons.
2. `pnpm dev` with `SPOTS_DATA_SOURCE=db` and a fresh DB → run `pnpm db:apply && pnpm db:seed` → log in as `devopenspot@gmail.com` (or any email in `ADMIN_EMAILS`) → `/admin` renders the overview.
3. Click "Spots" → "New spot" → paste `45.76864173087472, 4.836915452991425` → click `Look up` → confirm the preview matches the canonical example in `nominatim-api.rest` → edit `Name` to `Test Plaza` → click `Save` → confirm the row appears in `/admin/spots`.
4. Click the row → edit `Crowd level` to `90` → click `Save` → confirm the change is reflected in `/spots/[id]`.
5. Click `Delete` → confirm in `<DeleteConfirmDialog>` → confirm the row is gone from `/admin/spots` and from the public `/` listing.
6. Repeat 3–5 for an event under `/admin/events`.
7. Visit `/post` as a signed-in non-admin user → confirm the stub page renders with a "Go to admin dashboard" link that 403s the user (or redirects to `/`).
8. Visit `/post` as an admin user → confirm the link goes to `/admin/spots/new`.

---

## 13. File checklist

### 13.1 New files (~30)

```
src/lib/admin.ts
src/lib/admin.test.ts
src/lib/geocode/project.ts
src/lib/geocode/classify.ts
src/lib/geocode/nominatim-types.ts
src/app/api/geocode/reverse/route.ts
src/app/api/geocode/reverse/route.test.ts
src/app/admin/layout.tsx
src/app/admin/AdminLayoutClient.tsx
src/app/admin/page.tsx
src/app/admin/spots/page.tsx
src/app/admin/spots/new/page.tsx
src/app/admin/spots/[id]/page.tsx
src/app/admin/events/page.tsx
src/app/admin/events/new/page.tsx
src/app/admin/events/[id]/page.tsx
src/app/actions/admin-spots.ts
src/app/actions/admin-spots.test.ts
src/app/actions/admin-events.ts
src/app/actions/admin-events.test.ts
src/components/admin/AdminShell.tsx
src/components/admin/AdminSidebar.tsx
src/components/admin/AdminOverviewCards.tsx
src/components/admin/DataModeNotice.tsx
src/components/admin/common/DeleteConfirmDialog.tsx
src/components/admin/common/FormSection.tsx
src/components/admin/common/KeyValueGrid.tsx
src/components/admin/common/index.ts
src/components/admin/spots/SpotTable.tsx
src/components/admin/spots/SpotTableFilters.tsx
src/components/admin/spots/SpotFormFields.tsx
src/components/admin/spots/SpotFormSubmit.tsx
src/components/admin/spots/LatLonLookupPanel.tsx
src/components/admin/spots/LatLonLookupPanel.test.tsx
src/components/admin/spots/NominatimAddressPreview.tsx
src/components/admin/spots/ImageSourceField.tsx
src/components/admin/events/EventTable.tsx
src/components/admin/events/EventTableFilters.tsx
src/components/admin/events/EventFormFields.tsx
src/components/admin/events/EventFormSubmit.tsx
src/components/post/PostClosedNotice.tsx
supabase/migrations/0004_spot_sports.sql
```

### 13.2 Edited files (~13)

```
src/lib/env.ts                                # + ADMIN_EMAILS
src/lib/auth/server.ts                        # + requireAdmin, requireAdminOrRedirect
src/lib/user.ts                               # no change to User; isAdmin computed in context
src/lib/user-context.tsx                      # + isAdmin field on User + fallback
src/lib/types.ts                              # TabType += "admin"; re-export SportDiscipline
src/lib/nav.ts                                # + admin NAV_ITEMS entry
src/lib/repositories/event-repository.ts      # + create/update/delete
src/lib/repositories/json-event-repository.ts # + throwing implementations
src/lib/repositories/drizzle-event-repository.ts # + Drizzle implementations
src/lib/repositories/types.ts                 # + NewSportEvent, SportEventPatch
src/lib/schemas/event.ts                      # + NewSportEventSchema, SportEventPatchSchema
src/lib/schemas/spot.ts                       # + sports
src/db/schema.ts                              # + spots.sports
src/components/layout/NavList.tsx             # conditionally show admin link
src/components/layout/MobileDrawer.tsx        # same
src/components/layout/Header.tsx              # same (if applicable)
src/hooks/useUser.ts                          # re-export User with isAdmin
src/app/sitemap.ts                            # exclude /admin/*
.env.example                                  # document ADMIN_EMAILS
AGENTS.md                                     # add a one-line note about /admin and the env
```

### 13.3 Deleted files (3)

```
src/components/post/PostForm.tsx
src/components/post/PostTab.tsx
src/components/post/PostSuccessScreen.tsx
```

---

## 14. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Nominatim 1 req/sec rate limit hit during dev | Medium | Low | `cache: "no-store"` + a single in-flight button (the form disables `Look up` while pending). |
| Admin mistakenly deletes a spot with saved_spots | Low | Medium | Hard delete; cascade on `saved_spots.spot_id` (already in place per `0000_0001_initial_schema.sql`). Public re-clone from JSON seed is possible via `pnpm db:seed`. |
| The `admin` nav entry flashes for non-admins before the cookie is read | Low | Low | The nav is rendered from a client component that reads `useUser()`; the entry is conditionally rendered only when `isAdmin` is true. The initial server render uses the same context. |
| An admin's `createdBy` UUID collides with a contributor's UUID | Very low | None | The admin and contributor are both real Supabase auth UIDs; the column is not unique. No change. |
| Hardening: `ADMIN_EMAILS` is a single env var; rotating admins requires a redeploy | Medium | Low | Out of scope for this spec. A future "admin promotion flow" can move this to the `profiles` table (see §2). |
| `getStaticProps` / `generateStaticParams` include admin pages | Low | Medium | `src/app/spots/[id]/page.tsx` already calls `generateStaticParams`; the new `src/app/admin/spots/[id]/page.tsx` and `src/app/admin/events/[id]/page.tsx` will **not** export `generateStaticParams`. Confirmed by the routing model — admin routes are not pre-rendered. |
| `useToast` fires while the admin is mid-form-submit and the user navigates away | Low | Low | `useToast` is a global queue (`src/hooks/useToast.ts`); toasts from a previous page persist for 3.2 s. No new mitigation. |

---

## 15. Decisions log

| # | Decision | Rationale | Alternatives considered |
| --- | --- | --- | --- |
| D1 | Admin identity = email allow-list (`ADMIN_EMAILS`) + dev fallback | Simple, no schema change, no in-app role UI needed | `is_admin` column on `profiles`; service-role cookie only |
| D2 | Dashboard at `/admin/*` (new segment) | Mirrors the public app shell, keeps the nav simple | Add a sixth tab to `NAV_ITEMS`; standalone `/dashboard` |
| D3 | New API route `GET /api/geocode/reverse` | Mirrors the existing `/api/*` style; allows server-controlled User-Agent (Nominatim policy) | Server action; client-side fetch to Nominatim |
| D4 | Replace `/post` with a stub | The new flow is admin-only by design; public contributors are not part of this spec | Keep both flows; two creation paths diverge |
| D5 | Throw in JSON mode for `EventRepository.create/update/delete` | Matches the "JSON is the read-only fallback" philosophy | In-memory CRUD that is lost on restart |
| D6 | Add `spots.sports` column (text[]) | Spec requires "add … sport" on the new form; mirrors the existing `sport_events.sports` | Skip the field, ship without it |
| D7 | One new Drizzle migration `0004_spot_sports.sql` | Idempotent, follows the existing migration style | Two migrations (add column + add RLS) |
| D8 | Reuse `Overlay` for `<DeleteConfirmDialog>` | Already exists, already accessible | New modal primitive |
| D9 | `useUser().isAdmin` computed in context, not fetched | Avoids a per-page server round trip; same pattern as `useUser().id !== DEV_USER_ID` | New `useAdmin` hook that calls `/api/auth/session` |
| D10 | `revalidateTag("spots", "max")` and `revalidateTag("sport-events", "max")` for cache invalidation | Matches the existing `createSpotAction` / `toggleSavedAction` patterns | `revalidatePath` everywhere |

---

## 16. Open questions for follow-up specs

1. Multi-image gallery per spot (deferred — see §2).
2. Admin audit log (deferred — see §2).
3. CSV/JSON bulk import (deferred — see §2).
4. Per-event image upload to the same `spot-images` bucket (today events store an `image` URL string only; the schema does not yet have `image_path` for events).
5. Map editor (deferred — see §2).
6. A "promote to admin" flow inside the dashboard (deferred — see §2).

These are explicitly out of scope for this spec.
