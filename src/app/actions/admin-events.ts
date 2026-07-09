"use server"

import { revalidatePath } from "next/cache"
import { log } from "@/lib/log"
import { requireAdmin } from "@/lib/auth/server"
import { getEventRepositoryAsync } from "@/lib/repositories"
import { NewSportEventSchema, SportEventPatchSchema } from "@/lib/schemas/event"
import type { SportEvent } from "@/types/sport-events"
import type { SportDiscipline } from "@/types/sport-events"

function strField(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === "string" ? v : ""
}

function numberField(form: FormData, key: string): number | undefined {
  const raw = strField(form, key)
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function readSports(form: FormData): SportDiscipline[] {
  return form
    .getAll("sports")
    .filter((v): v is string => typeof v === "string" && v.length > 0) as SportDiscipline[]
}

function boolField(form: FormData, key: string): boolean {
  const v = form.get(key)
  return v === "on" || v === "true"
}

export async function createEventAction(formData: FormData): Promise<SportEvent> {
  await requireAdmin()

  const input = {
    name: strField(formData, "name"),
    shortName: strField(formData, "shortName") || undefined,
    url: strField(formData, "url"),
    image: strField(formData, "image"),
    description: strField(formData, "description"),
    sports: readSports(formData),
    startDate: strField(formData, "startDate"),
    endDate: strField(formData, "endDate") || undefined,
    city: strField(formData, "city"),
    country: strField(formData, "country"),
    countryCode: strField(formData, "countryCode") || undefined,
    venue: strField(formData, "venue") || undefined,
    latitude: numberField(formData, "latitude"),
    longitude: numberField(formData, "longitude"),
    tier: strField(formData, "tier") as SportEvent["tier"],
    featured: boolField(formData, "featured"),
  }

  const parsed = NewSportEventSchema.parse(input)
  const repo = await getEventRepositoryAsync()
  const event = await repo.create(parsed)
  revalidatePath("/sport-events")
  revalidatePath("/admin/events")
  return event
}

export async function updateEventAction(
  id: string,
  formData: FormData,
): Promise<SportEvent> {
  await requireAdmin()

  const patch: Record<string, unknown> = {}
  const text = (k: string) => strField(formData, k)
  if (text("name")) patch.name = text("name")
  if (formData.has("shortName")) patch.shortName = text("shortName") || undefined
  if (text("url")) patch.url = text("url")
  if (text("image")) patch.image = text("image")
  if (formData.has("description"))
    patch.description = text("description")
  if (formData.has("sports")) patch.sports = readSports(formData)
  if (text("startDate")) patch.startDate = text("startDate")
  if (formData.has("endDate")) patch.endDate = text("endDate") || undefined
  if (text("city")) patch.city = text("city")
  if (text("country")) patch.country = text("country")
  if (formData.has("countryCode"))
    patch.countryCode = text("countryCode") || undefined
  if (formData.has("venue")) patch.venue = text("venue") || undefined
  if (formData.has("latitude") || formData.has("longitude")) {
    patch.latitude = numberField(formData, "latitude")
    patch.longitude = numberField(formData, "longitude")
  }
  if (text("tier")) patch.tier = text("tier") as SportEvent["tier"]
  if (formData.has("featured")) patch.featured = boolField(formData, "featured")

  const parsed = SportEventPatchSchema.parse(patch)
  const repo = await getEventRepositoryAsync()
  const event = await repo.update(id, parsed)
  revalidatePath("/sport-events")
  revalidatePath("/admin/events")
  return event
}

export async function deleteEventAction(id: string): Promise<void> {
  await requireAdmin()
  const repo = await getEventRepositoryAsync()
  await repo.delete(id)
  revalidatePath("/sport-events")
  revalidatePath("/admin/events")
}

void log
