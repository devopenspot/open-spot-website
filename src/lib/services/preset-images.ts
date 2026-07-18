import { cacheLife, cacheTag } from "next/cache"
import { getPresetImagesRepositoryAsync } from "@/lib/repositories"
import type { PresetImageEntity } from "@/lib/repositories/preset-images-repository"

const LIST_CACHE_LIFE = {
  revalidate: 60,
  stale: 300,
  expire: 3600,
} as const

export async function runListPresetImages(): Promise<readonly PresetImageEntity[]> {
  const repo = await getPresetImagesRepositoryAsync()
  return repo.list()
}

export async function listPresetImages(): Promise<readonly PresetImageEntity[]> {
  "use cache"
  cacheTag("preset-images:all")
  cacheLife(LIST_CACHE_LIFE)
  return runListPresetImages()
}
