import { asc, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { presetImages } from "@/db/schema"
import type {
  PresetImageEntity,
  PresetImagesRepository,
} from "./preset-images-repository"

export class DrizzlePresetImagesRepository implements PresetImagesRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async list(): Promise<readonly PresetImageEntity[]> {
    const rows = await this.db
      .select()
      .from(presetImages)
      .orderBy(asc(presetImages.sortOrder), asc(presetImages.name))
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      url: r.url,
      sortOrder: r.sortOrder,
      createdBy: r.createdBy,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  }

  async create(input: {
    slug: string
    name: string
    url: string
    sortOrder?: number
    createdBy?: string | null
  }): Promise<PresetImageEntity> {
    const [row] = await this.db
      .insert(presetImages)
      .values({
        slug: input.slug,
        name: input.name,
        url: input.url,
        sortOrder: input.sortOrder ?? 0,
        createdBy: input.createdBy ?? null,
      })
      .returning()
    if (!row) throw new Error("preset_images insert returned no row")
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      url: row.url,
      sortOrder: row.sortOrder,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  async update(
    id: string,
    patch: Partial<{
      slug: string
      name: string
      url: string
      sortOrder: number
    }>,
  ): Promise<PresetImageEntity> {
    const [row] = await this.db
      .update(presetImages)
      .set(patch)
      .where(eq(presetImages.id, id))
      .returning()
    if (!row) throw new Error(`preset_images update returned no row for id ${id}`)
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      url: row.url,
      sortOrder: row.sortOrder,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(presetImages).where(eq(presetImages.id, id))
  }
}
