import { and, asc, eq, inArray, sql, type SQL } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/postgres-js";
import {
  countries,
  regions,
  spotSpotTypes,
  spotSports,
  spotTypes,
  spots,
  type NewSpotRow,
  type SpotRow,
} from "@/db/schema";
import type { SportDiscipline } from "@/types/sport-events";
import type { Spot } from "@/lib/types";
import type { NewSpot, SpotListResult, SpotPatch, SpotQuery } from "./types";
import type { SpotRepository } from "./spot-repository";
// `withImageUrls` lives in `@/lib/supabase/storage` which imports
// `server-only`. We dynamic-import it inside the read methods that
// actually need it so the static import chain does not pull the
// `server-only` module into CLI scripts (e.g. `pnpm db:seed`) that
// never call a read method.
import {
  joinedSpotSelect,
  rowToSpotWithImagePath,
  type JoinedSpotRow,
} from "./spot-query";

const EARTH_RADIUS_METERS = 6_371_000;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

function sportDisciplineTitleToSlug(title: string): string {
  return title.toLowerCase();
}

export class DrizzleSpotRepository implements SpotRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async list(query?: SpotQuery): Promise<SpotListResult> {
    const limit = query?.limit ?? 50;
    const conditions: SQL[] = [];
    if (query?.types && query.types.length > 0) {
      // OR semantics: a spot matches if any of its types is in the
      // filter set. Single EXISTS subquery against the join table.
      const typeList = [...query.types];
      conditions.push(sql`exists (
        select 1 from ${spotSpotTypes} sst
        where sst.spot_id = ${spots.id}
          and sst.type_slug in ${typeList}
      )`);
    }
    if (query?.country) conditions.push(eq(countries.name, query.country));
    if (query?.city) conditions.push(eq(spots.citySlug, query.city));
    if (query?.ids && query.ids.length > 0)
      conditions.push(inArray(spots.id, [...query.ids]));
    if (query?.q) {
      const like = `%${query.q.toLowerCase()}%`;
      conditions.push(sql`(
        lower(coalesce(${spots.name}, '')) like ${like}
        or lower(coalesce(${spots.city}, '')) like ${like}
        or lower(coalesce(${spots.address}, '')) like ${like}
      )`);
    }
    const where =
      conditions.length > 0
        ? and(
            ...(conditions
              .map((c) => c as SQL | undefined)
              .filter(Boolean) as SQL[]),
          )
        : undefined;

    let baseQuery = joinedSpotSelect(this.db);
    if (query?.near) {
      const point = sql`ST_SetSRID(ST_MakePoint(${query.near.lon}, ${query.near.lat}), 4326)`;
      baseQuery = baseQuery.where(
        sql`ST_DWithin(${spots.location}, ${point}, ${query.near.radiusMeters})`,
      );
    }
    const rows = await (where ? baseQuery.where(where) : baseQuery)
      .orderBy(asc(spots.slug))
      .limit(limit + 1);

    const raws = (rows as unknown as JoinedSpotRow[])
      .slice(0, limit)
      .map(rowToSpotWithImagePath);
    const { withImageUrls } = await import("@/lib/supabase/storage");
    let items = await withImageUrls(raws);
    if (query?.near) {
      items = items
        .map((s) => ({
          spot: s,
          d: haversineMeters(
            query.near!.lat,
            query.near!.lon,
            s.location.lat,
            s.location.lon,
          ),
        }))
        .sort((a, b) => a.d - b.d)
        .map((x) => x.spot);
    }
    const nextCursor =
      rows.length > limit ? (items[items.length - 1]?.slug ?? null) : null;
    return { items, nextCursor };
  }

  async findById(id: string): Promise<Spot | null> {
    const rows = await joinedSpotSelect(this.db)
      .where(eq(spots.id, id))
      .limit(1);
    const row = (rows as unknown as JoinedSpotRow[])[0];
    if (!row) return null;
    const { withImageUrls } = await import("@/lib/supabase/storage");
    const [spot] = await withImageUrls([rowToSpotWithImagePath(row)]);
    return spot ?? null;
  }

  async findBySlug(slug: string): Promise<Spot | null> {
    const rows = await joinedSpotSelect(this.db)
      .where(eq(spots.slug, slug))
      .limit(1);
    const row = (rows as unknown as JoinedSpotRow[])[0];
    if (!row) return null;
    const { withImageUrls } = await import("@/lib/supabase/storage");
    const [spot] = await withImageUrls([rowToSpotWithImagePath(row)]);
    return spot ?? null;
  }

  async findNearby(params: {
    lat: number;
    lon: number;
    radiusMeters: number;
  }): Promise<readonly Spot[]> {
    const point = sql`ST_SetSRID(ST_MakePoint(${params.lon}, ${params.lat}), 4326)`;
    const rows = await joinedSpotSelect(this.db)
      .where(
        sql`ST_DWithin(${spots.location}, ${point}, ${params.radiusMeters})`,
      )
      .limit(200);
    const { withImageUrls } = await import("@/lib/supabase/storage");
    return withImageUrls(
      (rows as unknown as JoinedSpotRow[]).map(rowToSpotWithImagePath),
    );
  }

  async listCountries(): Promise<
    readonly { name: string; region: string; count: number }[]
  > {
    const rows = await this.db.execute<{
      country: string;
      region: string;
      count: string;
    }>(sql`
      select c.name as country, r.name as region, count(*)::int as count
      from ${spots} s
      join ${countries} c on c.iso2 = s.country_code
      join ${regions} r on r.id = c.region_id
      where s.country <> ''
      group by c.name, r.name
      order by c.name
    `);
    return rows.map((r) => ({
      name: r.country,
      region: r.region,
      count: Number(r.count),
    }));
  }

  async listCountriesForRegion(
    region: string,
  ): Promise<readonly { name: string; count: number }[]> {
    const all = await this.listCountries();
    return all
      .filter((c) => c.region === region)
      .map((c) => ({ name: c.name, count: c.count }));
  }

  async listTypes(): Promise<readonly { name: string; count: number }[]> {
    // Group by type via the join table. A spot with two types
    // contributes one count to each of its type rows. We constrain
    // to the `spot_types.sort_order` ordering by joining the
    // dimension table.
    const rows = await this.db.execute<{ type: string; count: string }>(sql`
      select st.name as type, count(*)::int as count
      from ${spotSpotTypes} sst
      join ${spotTypes} st on st.slug = sst.type_slug
      group by st.name, st.sort_order
      order by st.sort_order, st.name
    `);
    return rows.map((r) => ({
      name: r.type,
      count: Number(r.count),
    }));
  }

  async listAllSpotTypes(): Promise<
    readonly { slug: string; name: string; sortOrder: number }[]
  > {
    const rows = await this.db
      .select({
        slug: spotTypes.slug,
        name: spotTypes.name,
        sortOrder: spotTypes.sortOrder,
      })
      .from(spotTypes)
      .orderBy(asc(spotTypes.sortOrder), asc(spotTypes.name));
    return rows;
  }

  async listAllCountries(): Promise<
    readonly { iso2: string; name: string; region: string }[]
  > {
    const rows = await this.db
      .select({
        iso2: countries.iso2,
        name: countries.name,
        region: regions.name,
      })
      .from(countries)
      .innerJoin(regions, eq(regions.id, countries.regionId))
      .orderBy(asc(countries.name));
    return rows;
  }

  async listRegions(): Promise<
    readonly { name: string; countryCount: number; spotCount: number }[]
  > {
    const rows = await this.db.execute<{
      region: string;
      country_count: string;
      spot_count: string;
    }>(sql`
      select
        r.name as region,
        count(distinct c.iso2)::int as country_count,
        count(s.id)::int as spot_count
      from ${regions} r
      join ${countries} c on c.region_id = r.id
      left join ${spots} s on s.country_code = c.iso2
      group by r.name
    `);
    return rows.map((r) => ({
      name: r.region,
      countryCount: Number(r.country_count),
      spotCount: Number(r.spot_count),
    }));
  }

  private async syncSpotSports(
    spotId: string,
    disciplines: readonly SportDiscipline[],
  ): Promise<void> {
    await this.db.delete(spotSports).where(eq(spotSports.spotId, spotId));
    if (disciplines.length === 0) return;
    const slugs = disciplines.map(sportDisciplineTitleToSlug);
    await this.db
      .insert(spotSports)
      .values(slugs.map((disciplineSlug) => ({ spotId, disciplineSlug })));
  }

  private async syncSpotTypes(
    spotId: string,
    typeSlugs: readonly string[],
  ): Promise<void> {
    await this.db.delete(spotSpotTypes).where(eq(spotSpotTypes.spotId, spotId));
    if (typeSlugs.length === 0) return;
    const normalized = typeSlugs
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    const unique = Array.from(new Set(normalized));
    if (unique.length === 0) return;
    await this.db
      .insert(spotSpotTypes)
      .values(unique.map((typeSlug) => ({ spotId, typeSlug })));
  }

  /**
   * Inserts (or updates on slug conflict) the spot row, then syncs
   * the sport- and type-join tables. Returns the row's real `id` —
   * on a re-seed the freshly-generated `id` in `insertValues` is
   * discarded by the upsert, so we read it back from `.returning()`.
   * Shared by `create` (which then reloads) and `upsertBySlug` (which
   * returns the id without reloading).
   */
  private async upsertAndSync(
    input: NewSpot,
    insertValues: NewSpotRow,
  ): Promise<string> {
    const [row] = await this.db
      .insert(spots)
      .values(insertValues)
      .onConflictDoUpdate({
        target: spots.slug,
        set: {
          name: insertValues.name,
          city: insertValues.city,
          citySlug: insertValues.citySlug,
          address: insertValues.address,
          imageUrl: insertValues.imageUrl,
          imagePath: insertValues.imagePath,
          countryCode: insertValues.countryCode as unknown as NewSpotRow["countryCode"],
          location: insertValues.location,
          createdBy: insertValues.createdBy,
          updatedAt: new Date(),
        },
      })
      .returning({ id: spots.id });
    const rowId = row?.id;
    if (!rowId) throw new Error("Insert returned no row");
    await this.syncSpotSports(rowId, input.sports);
    await this.syncSpotTypes(rowId, input.types);
    return rowId;
  }

  /**
   * Builds the `insertValues` for a spot from a `NewSpot` input. The
   * slug defaults to `citySlug-<timestamp>` (each call gets a unique
   * slug, used by the user-facing create flow); pass `input.slug` to
   * pin it (used by the seed, which needs a stable upsert key across
   * re-seeds).
   */
  private buildInsertValues(input: NewSpot): NewSpotRow {
    return {
      id: input.id ?? crypto.randomUUID(),
      slug: input.slug ?? `${input.citySlug}-${Date.now()}`,
      name: input.name.toUpperCase(),
      city: input.city,
      citySlug:
        input.citySlug ?? input.city.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      address: input.address,
      imageUrl: input.imagePath ? input.image : input.image,
      imagePath: input.imagePath ?? null,
      countryCode: input.countryCode
        ? input.countryCode
        : (sql<
            string | null
          >`(select iso2 from ${countries} where name = ${input.country} limit 1)` as unknown as string),
      location: input.location as unknown as SpotRow["location"],
      createdBy: input.createdBy,
    };
  }

  async create(input: NewSpot): Promise<Spot> {
    const insertValues = this.buildInsertValues(input);
    const rowId = await this.upsertAndSync(input, insertValues);
    const reloaded = await this.findById(rowId);
    if (!reloaded) throw new Error("Spot not found after insert");
    return reloaded;
  }

  /**
   * Upsert a spot by slug and sync its join tables. Returns the row
   * id without reloading the full Spot (no storage / image-URL
   * round-trip). Used by the seed, which doesn't consume the joined
   * data — it only needs the row to exist.
   */
  async upsertBySlug(input: NewSpot): Promise<{ id: string }> {
    if (!input.slug) {
      throw new Error("upsertBySlug requires input.slug");
    }
    const insertValues = this.buildInsertValues(input);
    const id = await this.upsertAndSync(input, insertValues);
    return { id };
  }

  async update(id: string, patch: SpotPatch): Promise<Spot> {
    const setValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (patch.name !== undefined) setValues.name = patch.name.toUpperCase();
    if (patch.city !== undefined) setValues.city = patch.city;
    if (patch.citySlug !== undefined) setValues.citySlug = patch.citySlug;
    if (patch.address !== undefined) setValues.address = patch.address;
    if (patch.image !== undefined) {
      setValues.imageUrl = patch.image;
    }
    if (patch.countryCode !== undefined) {
      setValues.countryCode = patch.countryCode;
    } else if (patch.country !== undefined) {
      setValues.countryCode = sql<
        string | null
      >`(select iso2 from ${countries} where name = ${patch.country} limit 1)` as unknown as string;
    }
    if (patch.location !== undefined)
      setValues.location = patch.location as unknown as SpotRow["location"];

    const [row] = await this.db
      .update(spots)
      .set(setValues as Partial<NewSpotRow>)
      .where(eq(spots.id, id))
      .returning();
    if (!row) throw new Error(`Spot not found: ${id}`);
    if (patch.sports !== undefined) {
      await this.syncSpotSports(id, patch.sports);
    }
    if (patch.types !== undefined) {
      await this.syncSpotTypes(id, patch.types);
    }
    const reloaded = await this.findById(id);
    if (!reloaded) throw new Error(`Spot not found: ${id}`);
    return reloaded;
  }

  async delete(id: string): Promise<void> {
    const result = await this.db
      .delete(spots)
      .where(eq(spots.id, id))
      .returning({ id: spots.id });
    if (result.length === 0) throw new Error(`Spot not found: ${id}`);
  }
}
