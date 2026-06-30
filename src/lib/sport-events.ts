import { cache } from "react";
import { SPORT_DISCIPLINES } from "@/types/sport-events";
import type { SportDiscipline } from "@/types/sport-events";

export const getSportDisciplines = cache(
  (): readonly SportDiscipline[] => SPORT_DISCIPLINES,
);

export const TIER_DISPLAY = {
  "world-tour": "World Tour",
  championship: "Championship",
  festival: "Festival",
  federation: "Federation",
} as const;

export const STATUS_LABELS = {
  upcoming: "Upcoming",
  live: "Live Now",
  completed: "Completed",
} as const;
