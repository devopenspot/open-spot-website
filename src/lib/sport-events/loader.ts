import { cache } from "react";
import { connection } from "next/server";
import { getEventRepositoryAsync } from "@/lib/repositories";
import { deriveStatus } from "./status";
import type { SportEvent, SportEventEnriched, SportEventStatus } from "@/types/sport-events";

const STATUS_PRIORITY: Record<SportEventStatus, number> = {
  live: 0,
  upcoming: 1,
  completed: 2,
};

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function formatDateRange(event: SportEvent): string {
  const start = toUTCDate(event.startDate);
  const startLabel = MONTH_FORMAT.format(start).toUpperCase();

  if (!event.endDate) {
    return MONTH_YEAR_FORMAT.format(start).toUpperCase();
  }

  const end = toUTCDate(event.endDate);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const endLabelBase = sameYear
    ? MONTH_FORMAT.format(end).toUpperCase()
    : MONTH_YEAR_FORMAT.format(end).toUpperCase();

  const year = start.getUTCFullYear();
  if (startLabel.split(" ")[0] === endLabelBase.split(" ")[0]) {
    const startDay = start.getUTCDate();
    const endDay = end.getUTCDate();
    return `${startLabel.split(" ")[0]} ${startDay}–${endDay}, ${year}`.toUpperCase();
  }
  return `${startLabel} – ${endLabelBase}, ${year}`.toUpperCase();
}

function enrich(event: SportEvent, now: Date): SportEventEnriched {
  return {
    ...event,
    status: deriveStatus(event, now),
    dateRangeLabel: formatDateRange(event),
  };
}

function sortEvents(events: readonly SportEventEnriched[]): readonly SportEventEnriched[] {
  return [...events].sort((a, b) => {
    const aFeatured = a.featured ? 0 : 1;
    const bFeatured = b.featured ? 0 : 1;
    if (aFeatured !== bFeatured) return aFeatured - bFeatured;

    const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (statusDiff !== 0) return statusDiff;

    const aDate = toUTCDate(a.startDate).getTime();
    const bDate = toUTCDate(b.startDate).getTime();
    if (a.status === "completed") return bDate - aDate;
    return aDate - bDate;
  });
}

async function loadSportEvents(): Promise<readonly SportEventEnriched[]> {
  await connection();
  const now = new Date();
  const repo = await getEventRepositoryAsync();
  const { items } = await repo.list();
  const enriched = items.map(event => enrich(event, now));
  return Object.freeze(sortEvents(enriched));
}

export const getSportEvents = cache(
  async (): Promise<readonly SportEventEnriched[]> => loadSportEvents(),
);

export async function getFeaturedSportEvent(): Promise<SportEventEnriched | undefined> {
  const events = await getSportEvents();
  return events.find(event => event.featured && event.status !== "completed") ?? events[0];
}