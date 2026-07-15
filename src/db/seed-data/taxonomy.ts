export interface TaxonomyEntry {
  slug: string;
  name: string;
  sortOrder: number;
}

export const SPOT_TYPE_SEED: readonly TaxonomyEntry[] = [
  { slug: "plaza", name: "Plaza", sortOrder: 0 },
  { slug: "diy", name: "DIY", sortOrder: 1 },
  { slug: "stair", name: "Stair", sortOrder: 2 },
  { slug: "bowl", name: "Bowl", sortOrder: 3 },
  { slug: "park", name: "Park", sortOrder: 4 },
  { slug: "ledges", name: "Ledges", sortOrder: 5 },
];

export const SPORT_DISCIPLINE_SEED: readonly TaxonomyEntry[] = [
  { slug: "skateboard", name: "Skateboard", sortOrder: 0 },
  { slug: "bmx", name: "BMX", sortOrder: 1 },
  { slug: "scooter", name: "Scooter", sortOrder: 2 },
  { slug: "rollerblade", name: "Rollerblade", sortOrder: 3 },
];

export const EVENT_TIER_SEED: readonly TaxonomyEntry[] = [
  { slug: "world-tour", name: "World Tour", sortOrder: 0 },
  { slug: "championship", name: "Championship", sortOrder: 1 },
  { slug: "festival", name: "Festival", sortOrder: 2 },
  { slug: "federation", name: "Federation", sortOrder: 3 },
];

export const SPOT_FEATURE_SEED: readonly { slug: string; name: string }[] = [
  { slug: "ledge", name: "Ledge" },
  { slug: "rail", name: "Rail" },
  { slug: "down-rail", name: "Down rail" },
  { slug: "up-rail", name: "Up rail" },
  { slug: "stairs", name: "Stairs" },
  { slug: "hubba", name: "Hubba" },
  { slug: "manual-pad", name: "Manual pad" },
  { slug: "flat-bar", name: "Flat bar" },
  { slug: "gap", name: "Gap" },
  { slug: "pyramid", name: "Pyramid" },
  { slug: "bank", name: "Bank" },
  { slug: "wallride", name: "Wallride" },
  { slug: "pole-jam", name: "Pole jam" },
  { slug: "quarter-pipe", name: "Quarter pipe" },
  { slug: "mini-ramp", name: "Mini ramp" },
  { slug: "bowl", name: "Bowl" },
  { slug: "pool", name: "Pool" },
  { slug: "smooth-concrete", name: "Smooth Concrete" },
  { slug: "street", name: "Street" },
  { slug: "slidebox", name: "Slidebox" },
];

// Valid feature slugs the seed will actually link to. Derived from the
// lookup table above so any future edit to SPOT_FEATURE_SEED flows
// through automatically.
export const FEATURE_SLUG_SET: ReadonlySet<string> = new Set(
  SPOT_FEATURE_SEED.map((f) => f.slug),
);
