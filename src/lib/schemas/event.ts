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
})

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