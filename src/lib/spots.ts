import { cache } from "react";
import {
  DEFAULT_PRESET_IMAGES,
} from "@/data";
import type { PresetImage } from "@/lib/types";

export const getPresetImages = cache(() => DEFAULT_PRESET_IMAGES);

/**
 * Pick a deterministic preset image URL for a spot that has no image. Used
 * at the data boundary so `Spot.image` is never an empty string at the
 * render layer (which would make `next/image` warn). A given seed always
 * resolves to the same fallback.
 */
export function pickFallbackImage(seed: string): string {
  const presets: readonly PresetImage[] = getPresetImages();
  if (presets.length === 0) return "";
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return presets[Math.abs(h) % presets.length]!.url;
}
