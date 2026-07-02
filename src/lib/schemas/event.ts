import { z } from "zod"

export const SportDisciplineSchema = z.enum([
  "Skateboard",
  "BMX",
  "Inline",
  "Scooter",
  "Rollerblade",
  "Wakeboard",
  "Snowboard",
  "Ski",
])

export const SportEventTierSchema = z.enum([
  "world-tour",
  "championship",
  "festival",
  "federation",
])

export const SportEventLocationSchema = z.object({
  city: z.string(),
  country: z.string(),
  countryCode: z.string().optional(),
  venue: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const SportEventSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  name: z.string(),
  shortName: z.string().optional(),
  url: z.string().url(),
  image: z.string(),
  description: z.string(),
  sports: z.array(SportDisciplineSchema),
  startDate: z.string(),
  endDate: z.string().optional(),
  location: SportEventLocationSchema,
  tier: SportEventTierSchema,
  featured: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).transform((raw) => ({
  id: raw.id,
  slug: raw.slug ?? raw.id,
  name: raw.name,
  shortName: raw.shortName,
  url: raw.url,
  image: raw.image,
  description: raw.description,
  sports: raw.sports,
  startDate: raw.startDate,
  endDate: raw.endDate,
  location: raw.location,
  tier: raw.tier,
  featured: raw.featured,
  createdAt: raw.createdAt ?? "2024-01-01T00:00:00.000Z",
  updatedAt: raw.updatedAt ?? "2024-01-01T00:00:00.000Z",
}))

export const SportEventQuerySchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  tier: SportEventTierSchema.optional(),
  discipline: SportDisciplineSchema.optional(),
  featured: z.boolean().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(200).default(50),
}).strict()