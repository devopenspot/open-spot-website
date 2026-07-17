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
  { slug: "skatepark", name: "skatepark", sortOrder: 4 },
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
