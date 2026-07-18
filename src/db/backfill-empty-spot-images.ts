import "./load-env"
import postgres from "postgres"
import { getDatabaseUrl } from "../lib/env"
import { getPresetImagesRepositoryAsync } from "../lib/repositories"
import { pickFallbackImage } from "../lib/spot-fallback"

async function main() {
  const url = getDatabaseUrl()
  if (!url) throw new Error("SUPABASE_DATABASE_URL is not configured")
  const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 10 })
  try {
    const broken = await sql<{ id: string }[]>`
      select id from spots
      where image_url = '' and image_path is null
    `
    if (broken.length === 0) {
      console.log("✓ no spots with empty image_url; nothing to backfill")
      return
    }
    const presetRepo = await getPresetImagesRepositoryAsync()
    const presets = (await presetRepo.list()).map((p) => ({ url: p.url }))
    if (presets.length === 0) {
      console.warn("! no preset images available; skipping backfill")
      return
    }
    console.log(`→ backfilling ${broken.length} spot(s)`)
    let count = 0
    for (const { id } of broken) {
      const fallback = pickFallbackImage(id, presets)
      if (!fallback) {
        console.warn(`  ! skipping ${id}: no preset images available`)
        continue
      }
      await sql`
        update spots set image_url = ${fallback} where id = ${id}
      `
      count++
    }
    console.log(`✓ backfilled ${count} spot(s)`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error("db:health crashed:", e instanceof Error ? e.message : e)
  process.exit(1)
})
