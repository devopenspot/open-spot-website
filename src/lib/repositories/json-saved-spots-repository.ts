import type { SavedSpot, SavedSpotWithDetails } from "@/types/saved-spot"
import type {
  SavedSpotsListResult,
  SavedSpotsRepository,
} from "./saved-spots-repository"

export class JsonSavedSpotsRepository implements SavedSpotsRepository {
  private saved: SavedSpot[] = []

  async list(
    _userId: string,
    opts?: { cursor?: string; limit?: number },
  ): Promise<SavedSpotsListResult> {
    void opts
    const items: SavedSpotWithDetails[] = []
    return { items, nextCursor: null }
  }

  async isSaved(userId: string, spotId: string): Promise<boolean> {
    return this.saved.some((s) => s.userId === userId && s.spotId === spotId)
  }

  async save(userId: string, spotId: string): Promise<void> {
    if (await this.isSaved(userId, spotId)) return
    this.saved = [
      ...this.saved,
      { userId, spotId, createdAt: new Date().toISOString() },
    ]
  }

  async unsave(userId: string, spotId: string): Promise<void> {
    this.saved = this.saved.filter(
      (s) => !(s.userId === userId && s.spotId === spotId),
    )
  }

  async countForSpot(spotId: string): Promise<number> {
    return this.saved.filter((s) => s.spotId === spotId).length
  }
}