"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { getCurrentUser } from "@/lib/user"
import { getSavedSpotsRepositoryAsync, getSpotRepositoryAsync } from "@/lib/repositories"
import { log } from "@/lib/log"

export async function toggleSavedAction(spotId: string): Promise<boolean> {
  const user = await getCurrentUser()
  const repo = await getSavedSpotsRepositoryAsync()
  const spotRepo = await getSpotRepositoryAsync()
  const spot = await spotRepo.findById(spotId)
  if (!spot) throw new Error(`Spot not found: ${spotId}`)
  const isSaved = await repo.isSaved(user.id, spotId)
  if (isSaved) {
    await repo.unsave(user.id, spotId)
  } else {
    await repo.save(user.id, spotId)
  }
  revalidateTag(`saved-spots:${user.id}`, "max")
  revalidatePath("/saved")
  return !isSaved
}

export async function listSavedSpotsAction() {
  const user = await getCurrentUser()
  const repo = await getSavedSpotsRepositoryAsync()
  return repo.list(user.id, { limit: 200 })
}

void log