import { z } from "zod"

export const SpotTypeSchema = z.enum([
  "Plaza",
  "DIY",
  "Stair",
  "Bowl",
  "Park",
  "Ledges",
  "Pools",
])

export const SpotLocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
})

export const SpotSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  city: z.string(),
  citySlug: z.string(),
  address: z.string(),
  type: SpotTypeSchema,
  features: z.array(z.string()),
  image: z.string(),
  communityNote: z.string(),
  crowdLevel: z.number().int().min(0).max(100),
  crowdLevelLabel: z.string(),
  country: z.string(),
  location: SpotLocationSchema,
  createdBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const NewSpotSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  city: z.string().min(1),
  citySlug: z.string().min(1).optional(),
  address: z.string(),
  type: SpotTypeSchema,
  features: z.array(z.string()).default([]),
  image: z.string(),
  imagePath: z.string().nullable().optional(),
  communityNote: z.string().default(""),
  crowdLevel: z.number().int().min(0).max(100).default(0),
  crowdLevelLabel: z.string().default(""),
  country: z.string().default(""),
  location: SpotLocationSchema,
  createdBy: z.string().nullable().default(null),
}).strict()

export const SpotPatchSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  citySlug: z.string().optional(),
  address: z.string().optional(),
  type: SpotTypeSchema.optional(),
  features: z.array(z.string()).optional(),
  image: z.string().optional(),
  communityNote: z.string().optional(),
  crowdLevel: z.number().int().min(0).max(100).optional(),
  crowdLevelLabel: z.string().optional(),
  country: z.string().optional(),
  location: SpotLocationSchema.optional(),
}).strict()

export const SpotQuerySchema = z.object({
  q: z.string().optional(),
  type: SpotTypeSchema.optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  ids: z.array(z.string()).optional(),
  near: z
    .object({
      lat: z.number(),
      lon: z.number(),
      radiusMeters: z.number().positive(),
    })
    .optional(),
  savedBy: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(200).default(50),
}).strict()