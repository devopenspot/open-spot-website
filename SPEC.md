# Auth Module — Simple Supabase (Google OAuth)

Strategy: Google (Gmail) OAuth only. The browser never calls Supabase directly;
all auth I/O goes through Next.js API routes. Session is cookie-based via
`@supabase/ssr` (refresh handled by `src/proxy.ts`). Identity is mirrored to
`public.profiles` during the OAuth callback so the rest of the app can read a
stable `User { id, name, email, initials, avatarUrl }` from a server context.

## Constraints
- No server actions for auth.
- No direct `@supabase/supabase-js` calls from client components.
- Only `src/app/api/auth/*` touches the Supabase server client for auth flows.
- Existing magic-link login is removed; Google OAuth is the single path.
- Post-login redirect: `?next=` from `/login` (sanitized, same-origin), else `/`.
- Header/drawer avatar: Google photo when present, initials fallback otherwise.

## Endpoints

| Method | Path                    | Purpose                                  |
|--------|-------------------------|------------------------------------------|
| POST   | /api/auth/signin/google | Returns Google OAuth URL                 |
| POST   | /api/auth/signout       | Server-side sign-out, clears cookies     |
| GET    | /api/auth/session       | Current `User` or 401                    |
| GET    | /auth/callback          | OAuth code → session, ensures profile    |

## Stages

| # | Stage                                       | Status |
|---|---------------------------------------------|--------|
| 1 | Auth API routes (signin/signout/session)    | done    |
| 2 | Identity model + `profiles.avatar_url`      | done    |
| 3 | UI: login, account, header avatar, callback | done    |
| 4 | Cleanup (drop magic link + server action)   | done    |

## Header sign-in entry

A `SignInLink` is rendered in the header (and the mobile drawer footer) when
the visitor has no real session (`user.id === "dev"`). It points to `/login`
and forwards the current path as `?next=` so the OAuth callback returns the
user to where they started. The link carries `id="nav-btn-login"`, satisfying
the existing `aria-labelledby` reference on the login panel.

### Sign-in link stages

| # | Stage                                       | Status |
|---|---------------------------------------------|--------|
| 1 | Add `SignInLink` component                  | done    |
| 2 | Wire into `Header` + `MobileDrawer`         | done    |
| 3 | Honor `?next=` on `/login`                  | done    |

## Protected pages

`/saved` and `/post` are always visible in the nav. When a guest navigates
to either path, the page server-component calls `requireUserOrRedirect` from
`src/lib/auth/server.ts`. If Supabase is configured and the visitor has no
real session, the helper calls `redirect("/login?next=<path>")` before any
HTML is rendered. The existing `?next=` machinery in `/login`, the sign-in
API, the OAuth provider redirect, and `/auth/callback` returns the user to
the original page after a successful sign-in. In dev (Supabase not
configured) the helper is a no-op and the dev user can browse freely.

### Protected pages stages

| # | Stage                                                              | Status |
|---|--------------------------------------------------------------------|--------|
| 1 | Add `requireUserOrRedirect` helper in `src/lib/auth/server.ts`      | done    |
| 2 | Guard `src/app/saved/page.tsx` and `src/app/post/page.tsx` (async)  | done    |
