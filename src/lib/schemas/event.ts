import { z } from "zod";

export const SportDisciplineSchema = z.enum([
  "Skateboard",
  "BMX",
  "Scooter",
  "Rollerblade",
]);

export const SportEventTierSchema = z.enum([
  "world-tour",
  "championship",
  "festival",
  "federation",
]);

export const SportEventLocationSchema = z.object({
  city: z.string(),
  country: z.string(),
  countryCode: z.string().optional(),
  venue: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const SportEventSchema = z
  .object({
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
  })
  .transform((raw) => ({
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
  }));

export const SportEventQuerySchema = z
  .object({
    q: z.string().optional(),
    country: z.string().optional(),
    tier: SportEventTierSchema.optional(),
    discipline: SportDisciplineSchema.optional(),
    featured: z.boolean().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.number().int().positive().max(200).default(50),
  })
  .strict();

/**
 * Fields a client supplies when creating a sport event. `slug`, `id`,
 * `createdAt`, and `updatedAt` are server-derived and not part of the
 * input contract.
 */
export const NewSportEventSchema = z
  .object({
    name: z.string().min(1),
    shortName: z.string().optional(),
    url: z.string().url(),
    image: z.string().min(1),
    description: z.string().default(""),
    sports: z.array(SportDisciplineSchema).default([]),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    city: z.string().min(1),
    country: z.string().min(1),
    countryCode: z.string().optional(),
    venue: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    tier: SportEventTierSchema,
    featured: z.boolean().default(false),
  })
  .strict();

/**
 * Patch payload for editing a sport event. All fields are optional; only
 * the keys present in the input are updated.
 *
 * `latitude` and `longitude` must both be set or both be omitted so the
 * repository can decide whether to replace the geometry column.
 */
export const SportEventPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    shortName: z.string().optional(),
    url: z.string().url().optional(),
    image: z.string().min(1).optional(),
    description: z.string().optional(),
    sports: z.array(SportDisciplineSchema).optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().optional(),
    city: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    countryCode: z.string().optional(),
    venue: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    tier: SportEventTierSchema.optional(),
    featured: z.boolean().optional(),
  })
  .strict()
  .refine((p) => (p.latitude === undefined) === (p.longitude === undefined), {
    message: "latitude and longitude must both be set or both be omitted",
    path: ["latitude"],
  });
