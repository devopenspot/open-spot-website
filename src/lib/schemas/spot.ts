import { z } from "zod";
import { SportDisciplineSchema } from "./event";

/**
 * Spot category identifier. The set of valid values lives in the
 * `spot_types` DB table — the runtime server action validates the
 * incoming string against that set. This schema only enforces "non-empty".
 */
export const SpotTypeSchema = z.string().min(1);

export const SpotLocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const SpotSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  city: z.string(),
  citySlug: z.string(),
  address: z.string(),
  type: SpotTypeSchema,
  sports: z.array(SportDisciplineSchema),
  image: z.string(),
  crowdLevel: z.number().int().min(0).max(100),
  country: z.string(),
  countryCode: z.string(),
  location: SpotLocationSchema,
  createdBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const NewSpotSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().min(1),
    city: z.string().min(1),
    citySlug: z.string().min(1).optional(),
    address: z.string(),
    type: SpotTypeSchema,
    sports: z.array(SportDisciplineSchema).default([]),
    image: z.string(),
    imagePath: z.string().nullable().optional(),
    crowdLevel: z.number().int().min(0).max(100).default(0),
    country: z.string().default(""),
    countryCode: z
      .string()
      .regex(/^[A-Z]{2}$/, "countryCode must be a 2-letter ISO code")
      .optional(),
    location: SpotLocationSchema,
    createdBy: z.string().nullable().default(null),
  })
  .strict();

export const SpotPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    citySlug: z.string().optional(),
    address: z.string().optional(),
    type: SpotTypeSchema.optional(),
    sports: z.array(SportDisciplineSchema).optional(),
    image: z.string().optional(),
    crowdLevel: z.number().int().min(0).max(100).optional(),
    country: z.string().optional(),
    countryCode: z
      .string()
      .regex(/^[A-Z]{2}$/, "countryCode must be a 2-letter ISO code")
      .optional(),
    location: SpotLocationSchema.optional(),
  })
  .strict();

export const SpotQuerySchema = z
  .object({
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
  })
  .strict();
