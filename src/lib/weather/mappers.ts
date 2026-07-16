import type { WeatherItem } from "@/types/weather";
import type { ForecastSlot, SpotForecast, WeatherIconName } from "@/lib/types";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

const FALLBACK_ICON: WeatherIconName = "sunny";
const FALLBACK_TEMP = 22;
const FALLBACK_DAY = "TUE";
const FALLBACK_DESCRIPTION = "Clear sky";

const SLOT_TARGET_HOURS: Record<ForecastSlot, number> = {
  morning: 9,
  afternoon: 15,
  night: 21,
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function localDayKey(dt: number): string {
  const d = new Date(dt * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayNameFromKey(key: string): string {
  const [yRaw, mRaw, dRaw] = key.split("-").map(Number);
  if (yRaw === undefined || mRaw === undefined || dRaw === undefined) {
    return FALLBACK_DAY;
  }
  const dayIndex = new Date(yRaw, mRaw - 1, dRaw).getDay();
  return DAY_NAMES[dayIndex] ?? FALLBACK_DAY;
}

function pickItemForSlot(
  items: WeatherItem[],
  slot: ForecastSlot,
): WeatherItem | undefined {
  if (items.length === 0) return undefined;
  const target = SLOT_TARGET_HOURS[slot];
  let best: WeatherItem | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const hour = new Date(item.dt * 1000).getHours();
    const delta = Math.abs(hour - target);
    if (delta < bestDelta) {
      best = item;
      bestDelta = delta;
    }
  }
  return best;
}

export function mapIconName(icon: string | undefined): WeatherIconName {
  if (!icon) return "sunny";
  switch (icon.slice(0, 2)) {
    case "01":
      return "sunny";
    case "02":
      return "partly_cloudy_day";
    case "03":
    case "04":
      return "cloudy";
    case "09":
    case "10":
      return "rain";
    case "13":
      return "snow";
    default:
      return "sunny";
  }
}

export interface MappedCurrentWeather {
  temp: number;
  description: string;
  humidity: number | null;
  precipitationMm: number | null;
}

export function mapCurrentWeather(
  item: WeatherItem | null,
): MappedCurrentWeather {
  if (!item) {
    return {
      temp: FALLBACK_TEMP,
      description: FALLBACK_DESCRIPTION,
      humidity: null,
      precipitationMm: null,
    };
  }
  return {
    temp: Math.round(item.main.temp),
    description: item.weather[0]?.description ?? FALLBACK_DESCRIPTION,
    humidity: item.main.humidity ?? null,
    precipitationMm:
      item.rain?.["1h"] ??
      item.rain?.["3h"] ??
      item.snow?.["1h"] ??
      item.snow?.["3h"] ??
      null,
  };
}

export function mapForecast(
  items: WeatherItem[],
  seed: string,
): SpotForecast[] {
  if (items.length === 0) return fallbackForecastForSeed(seed);

  const byDay = new Map<string, WeatherItem[]>();
  for (const item of items) {
    const key = localDayKey(item.dt);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(item);
    else byDay.set(key, [item]);
  }

  const dayKeys = [...byDay.keys()].sort().slice(0, 2);
  const slots: ForecastSlot[] = ["morning", "afternoon", "night"];

  const result: SpotForecast[] = [];
  for (const key of dayKeys) {
    const dayItems = byDay.get(key) ?? [];
    const dayName = dayNameFromKey(key);
    for (const slot of slots) {
      const rep = pickItemForSlot(dayItems, slot);
      if (!rep) {
        result.push(makeFallbackSlot(dayName, slot));
        continue;
      }
      const condition = rep.weather[0];
      result.push({
        day: dayName,
        slot,
        icon: mapIconName(condition?.icon),
        temp: Math.round(rep.main.temp),
        description: condition?.description ?? FALLBACK_DESCRIPTION,
      });
    }
  }

  while (result.length < 6) {
    const day = result[result.length - 1]?.day ?? FALLBACK_DAY;
    const slot = slots[result.length % 3] ?? "morning";
    result.push(makeFallbackSlot(day, slot));
  }
  return result;
}

function makeFallbackSlot(
  day: string,
  slot: ForecastSlot,
): SpotForecast {
  return {
    day,
    slot,
    icon: FALLBACK_ICON,
    temp: FALLBACK_TEMP,
    description: FALLBACK_DESCRIPTION,
  };
}

function fallbackForecastForSeed(seed: string): SpotForecast[] {
  const h = hash(seed);
  const base = 18 + (h % 14);
  const day1 = FALLBACK_DAY;
  const day2 = DAY_NAMES[(DAY_NAMES.indexOf(day1 as never) + 1) % 7] ?? FALLBACK_DAY;
  return [
    { day: day1, slot: "morning", icon: "sunny", temp: base - 2, description: "Clear sky" },
    { day: day1, slot: "afternoon", icon: "sunny", temp: base, description: "Clear sky" },
    { day: day1, slot: "night", icon: h % 2 === 0 ? "partly_cloudy_day" : "sunny", temp: base - 4, description: "Partly cloudy" },
    { day: day2, slot: "morning", icon: "sunny", temp: base - 1, description: "Clear sky" },
    { day: day2, slot: "afternoon", icon: h % 2 === 0 ? "sunny" : "partly_cloudy_day", temp: base + 1, description: "Sunny" },
    { day: day2, slot: "night", icon: "cloudy", temp: base - 3, description: "Cloudy" },
  ];
}
