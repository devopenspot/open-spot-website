import "server-only"
import { createSupabaseServerClient } from "./server"

const BUCKET = "spot-images"

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
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function getSpotImageUrl(path: string): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)
  if (error) throw new Error(`Storage signed URL failed: ${error.message}`)
  return data.signedUrl
}