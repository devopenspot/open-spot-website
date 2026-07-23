import { z } from "zod";
import { SportDisciplineSchema } from "./event";

/**
 * A single spot type slug. The set of valid values lives in the
 * `spot_types` DB table — the runtime server action validates the
 * incoming string against that set. This schema only enforces
 * "non-empty". Note: a spot carries *zero or more* of these (see
 * `SpotTypeListSchema`), and the canonical `Spot.types` is the
 * denormalized `{slug, name}[]` shape (`SpotTypeRefSchema`).
 */
export const SpotTypeSlugSchema = z.string().min(1);

export const SpotTypeRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export const SpotTypeListSchema = z.array(SpotTypeSlugSchema).default([]);

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
  types: z.array(SpotTypeRefSchema).default([]),
  sports: z.array(SportDisciplineSchema),
  image: z.string(),
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
    slug: z.string().min(1).optional(),
    name: z.string().min(1),
    city: z.string().min(1),
    citySlug: z.string().min(1).optional(),
    address: z.string(),
    types: SpotTypeListSchema,
    sports: z.array(SportDisciplineSchema).default([]),
    image: z.string(),
    imagePath: z.string().nullable().optional(),
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
    types: SpotTypeListSchema.optional(),
    sports: z.array(SportDisciplineSchema).optional(),
    image: z.string().optional(),
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
    /**
     * Filter to spots that have at least one of the given type slugs
     * (OR semantics). A spot with `types: ["skatepark", "bowl"]` matches
     * `types: ["bowl"]` (and `types: ["skatepark", "rails"]`).
     */
    types: z.array(SpotTypeSlugSchema).optional(),
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
