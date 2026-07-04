import { and, count, desc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { savedSpots, spots } from "@/db/schema"
import type { SportDiscipline } from "@/types/sport-events"
import type { Spot } from "@/lib/types"
import type { SavedSpotWithDetails } from "@/types/saved-spot"
import type { SavedSpotsListResult, SavedSpotsRepository } from "./saved-spots-repository"

export class DrizzleSavedSpotsRepository implements SavedSpotsRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async list(
    userId: string,
    opts?: { cursor?: string; limit?: number },
  ): Promise<SavedSpotsListResult> {
    const limit = opts?.limit ?? 50
    const conditions = [eq(savedSpots.userId, userId)]
    if (opts?.cursor) {
      conditions.push(sql`${savedSpots.createdAt} < ${opts.cursor}`)
    }
    const rows = await this.db
      .select({
        ss: savedSpots,
        spot: spots,
      })
      .from(savedSpots)
      .innerJoin(spots, eq(savedSpots.spotId, spots.id))
      .where(and(...conditions))
      .orderBy(desc(savedSpots.createdAt))
      .limit(limit + 1)
    const slice = rows.slice(0, limit)
    const items: SavedSpotWithDetails[] = slice.map((r) => ({
      userId: r.ss.userId,
      spotId: r.ss.spotId,
      createdAt: r.ss.createdAt.toISOString(),
      spot: rowToSpot(r.spot),
    }))
    const nextCursor =
      rows.length > limit
        ? (items[items.length - 1]?.createdAt ?? null)
        : null
    return { items, nextCursor }
  }

  async isSaved(userId: string, spotId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ x: count() })
      .from(savedSpots)
      .where(and(eq(savedSpots.userId, userId), eq(savedSpots.spotId, spotId)))
      .limit(1)
    return Number(row?.x ?? 0) > 0
  }

  async save(userId: string, spotId: string): Promise<void> {
    await this.db
      .insert(savedSpots)
      .values({ userId, spotId })
      .onConflictDoNothing()
  }

  async unsave(userId: string, spotId: string): Promise<void> {
    await this.db
      .delete(savedSpots)
      .where(
        and(eq(savedSpots.userId, userId), eq(savedSpots.spotId, spotId)),
      )
  }

  async countForSpot(spotId: string): Promise<number> {
    const [row] = await this.db
      .select({ x: count() })
      .from(savedSpots)
      .where(eq(savedSpots.spotId, spotId))
    return Number(row?.x ?? 0)
  }
}

type SpotRow = typeof spots.$inferSelect

function rowToSpot(row: SpotRow): Spot {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    citySlug: row.citySlug,
    address: row.address,
    type: row.type as Spot["type"],
    features: row.features as readonly string[],
    sports: row.sports as readonly SportDiscipline[],
    image: row.imagePath ? row.imagePath : row.imageUrl,
    communityNote: row.communityNote,
    crowdLevel: row.crowdLevel,
    crowdLevelLabel: row.crowdLevelLabel,
    country: row.country,
    location: row.location as Spot["location"],
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}