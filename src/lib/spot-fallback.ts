/**
 * Pick a deterministic preset image URL for a spot that has no image.
 * Used at the data boundary so `Spot.image` is never an empty string at
 * the render layer (which would make `next/image` warn). A given seed
 * always resolves to the same fallback.
 *
 * The preset list is now DB-backed (`preset_images` table). Callers
 * fetch it via the preset images repo and pass it in explicitly.
 */
export function pickFallbackImage(
  seed: string,
  presets: readonly { url: string }[],
): string {
  if (presets.length === 0) return ""
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return presets[Math.abs(h) % presets.length]!.url
}
