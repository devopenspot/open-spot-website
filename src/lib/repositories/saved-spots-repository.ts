import type { SavedSpotWithDetails } from "@/types/saved-spot"

export interface SavedSpotsListResult {
  items: readonly SavedSpotWithDetails[]
  nextCursor: string | null
}

export interface SavedSpotsRepository {
  list(
    userId: string,
    opts?: { cursor?: string; limit?: number },
  ): Promise<SavedSpotsListResult>
  isSaved(userId: string, spotId: string): Promise<boolean>
  save(userId: string, spotId: string): Promise<void>
  unsave(userId: string, spotId: string): Promise<void>
  countForSpot(spotId: string): Promise<number>
}