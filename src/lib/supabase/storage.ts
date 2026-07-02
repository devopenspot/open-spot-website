import "server-only"
import { cache } from "react"
import type { Spot } from "@/lib/types"
import { getSpotImagesBucket } from "@/lib/env"
import { createSupabaseServerClient } from "./server"

const getBucket = (): string => getSpotImagesBucket()

export interface UploadedImage {
  path: string
  url: string
}

export async function uploadSpotImage(
  file: File,
  spotId: string,
): Promise<UploadedImage> {
  const supabase = await createSupabaseServerClient()
  const path = `spots/${spotId}/${crypto.randomUUID()}`
  const { error } = await supabase.storage
    .from(getBucket())
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from(getBucket()).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function getSpotImageUrl(path: string): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.storage
    .from(getBucket())
    .createSignedUrl(path, 3600)
  if (error) throw new Error(`Storage signed URL failed: ${error.message}`)
  return data.signedUrl
}

export const getSpotImageUrls = cache(
  async (paths: readonly string[]): Promise<Map<string, string>> => {
    if (paths.length === 0) return new Map()
    const unique = Array.from(new Set(paths))
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.storage
      .from(getBucket())
      .createSignedUrls(unique, 3600)
    if (error) {
      throw new Error(`Storage signed URLs failed: ${error.message}`)
    }
    const out = new Map<string, string>()
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) {
        out.set(row.path, row.signedUrl)
      }
    }
    return out
  },
)

export interface SpotWithImagePath {
  spot: Spot
  imagePath: string | null
}

export async function withImageUrls(
  entries: readonly SpotWithImagePath[],
): Promise<Spot[]> {
  const paths = entries
    .map((e) => e.imagePath)
    .filter((p): p is string => p !== null)
  const urlMap = await getSpotImageUrls(paths)
  return entries.map(({ spot, imagePath }) => {
    if (imagePath && urlMap.has(imagePath)) {
      return { ...spot, image: urlMap.get(imagePath)! }
    }
    return spot
  })
}

