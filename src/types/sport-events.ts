export type SportDiscipline =
  | "Skateboard"
  | "BMX"
  | "Inline"
  | "Scooter"
  | "Rollerblade"
  | "Wakeboard"
  | "Snowboard"
  | "Ski";

export const SPORT_DISCIPLINES: readonly SportDiscipline[] = [
  "Skateboard",
  "BMX",
  "Inline",
  "Scooter",
  "Rollerblade",
  "Wakeboard",
  "Snowboard",
  "Ski",
] as const;

export type SportEventStatus = "upcoming" | "live" | "completed";

export type SportEventTier =
  | "world-tour"
  | "championship"
  | "festival"
  | "federation";

export interface SportEventLocation {
  city: string;
  country: string;
  countryCode?: string;
  venue?: string;
  latitude?: number;
  longitude?: number;
}

export interface SportEvent {
  id: string;
  name: string;
  shortName?: string;
  url: string;
  image: string;
  description: string;
  sports: readonly SportDiscipline[];
  startDate: string;
  endDate?: string;
  location: SportEventLocation;
  tier: SportEventTier;
  featured?: boolean;
}

export interface SportEventEnriched extends SportEvent {
  status: SportEventStatus;
  dateRangeLabel: string;
}
