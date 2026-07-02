import type { Spot } from "@/lib/types"

export interface SavedSpot {
  userId: string
  spotId: string
  createdAt: string
}

export interface SavedSpotWithDetails extends SavedSpot {
  spot: Spot
}