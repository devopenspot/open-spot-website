"use server"

import { revalidateTag } from "next/cache"
import { NewSpotSchema } from "@/lib/schemas/spot"
import { getSpotRepository } from "@/lib/repositories"
import type { NewSpot } from "@/lib/repositories"
import type { Spot } from "@/lib/types"

export async function createSpotAction(input: NewSpot): Promise<Spot> {
  const parsed = NewSpotSchema.parse(input)
  const spot = await getSpotRepository().create(parsed)
  revalidateTag("spots", "max")
  return spot
}