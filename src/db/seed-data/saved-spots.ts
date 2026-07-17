import type { NewSavedSpotRow } from "@/db/schema"

// All 23 base spots are seeded as saved for the dev placeholder user.
// `userId` is "dev" (text) — the `saved_spots.user_id` column is text,
// not uuid, so the dev placeholder is representable. See
// `supabase/migrations/0000_fresh.sql` and `src/db/schema.ts`.

export const DEV_SAVED_SPOTS: readonly NewSavedSpotRow[] = [
  { userId: "dev", spotId: "viga-skatepark" },
  { userId: "dev", spotId: "dogshit-spot" },
  { userId: "dev", spotId: "place-louis-pradel" },
  { userId: "dev", spotId: "bercy-skatepark" },
  { userId: "dev", spotId: "skatepark-de-la-4-sur" },
  { userId: "dev", spotId: "skatepark-carrera-52-unidad-deportiva-alberto-galindo-plaza-de-toros" },
  { userId: "dev", spotId: "skatepark-zipaquira" },
  { userId: "dev", spotId: "skatepark-ponte-della-musica" },
  { userId: "dev", spotId: "skatepark-tep-emile-lepeu-rue-emile-lepeu" },
  { userId: "dev", spotId: "tokio-1783647692990" },
  { userId: "dev", spotId: "amparo-1783651438900" },
  { userId: "dev", spotId: "amparo-1783651224198" },
  { userId: "dev", spotId: "bogot-1783698730232" },
  { userId: "dev", spotId: "pineda-de-mar-1783651067022" },
  { userId: "dev", spotId: "bogot-1783698595636" },
  { userId: "dev", spotId: "skatepark-parque-de-las-ruedas-san-antonio-de-prado" },
  { userId: "dev", spotId: "barcelona-1783650621395" },
  { userId: "dev", spotId: "barcelona-1783650881587" },
  { userId: "dev", spotId: "yokohama-1783649567195" },
  { userId: "dev", spotId: "seoul-1783649672401" },
  { userId: "dev", spotId: "barcelona-1784052632111" },
  { userId: "dev", spotId: "skatepark-sopo" },
  { userId: "dev", spotId: "helsinki-1783876353196" },
]
