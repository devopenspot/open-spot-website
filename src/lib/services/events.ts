import { cacheLife, cacheTag } from "next/cache"
import { getEventRepositoryAsync } from "@/lib/repositories"
import type {
  SportEvent,
  SportEventEnriched,
} from "@/types/sport-events"
import type {
  SportEventListResult,
  SportEventQuery,
} from "@/lib/repositories/event-repository"
import { deriveStatus } from "@/lib/sport-events/status"

const STATUS_PRIORITY: Record<
  "live" | "upcoming" | "completed",
  number
> = {
  live: 0,
  upcoming: 1,
  completed: 2,
}

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
})
const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function formatDateRange(event: SportEvent): string {
  const start = toUTCDate(event.startDate)
  const startLabel = MONTH_FORMAT.format(start).toUpperCase()

  if (!event.endDate) {
    return MONTH_YEAR_FORMAT.format(start).toUpperCase()
  }

  const end = toUTCDate(event.endDate)
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const endLabelBase = sameYear
    ? MONTH_FORMAT.format(end).toUpperCase()
    : MONTH_YEAR_FORMAT.format(end).toUpperCase()

  const year = start.getUTCFullYear()
  if (startLabel.split(" ")[0] === endLabelBase.split(" ")[0]) {
    const startDay = start.getUTCDate()
    const endDay = end.getUTCDate()
    return `${startLabel.split(" ")[0]} ${startDay}–${endDay}, ${year}`.toUpperCase()
  }
  return `${startLabel} – ${endLabelBase}, ${year}`.toUpperCase()
}

function enrich(event: SportEvent, now: Date): SportEventEnriched {
  return {
    ...event,
    status: deriveStatus(event, now),
    dateRangeLabel: formatDateRange(event),
  }
}

function sortEvents(
  events: readonly SportEventEnriched[],
): readonly SportEventEnriched[] {
  return [...events].sort((a, b) => {
    const aFeatured = a.featured ? 0 : 1
    const bFeatured = b.featured ? 0 : 1
    if (aFeatured !== bFeatured) return aFeatured - bFeatured

    const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (statusDiff !== 0) return statusDiff

    const aDate = toUTCDate(a.startDate).getTime()
    const bDate = toUTCDate(b.startDate).getTime()
    if (a.status === "completed") return bDate - aDate
    return aDate - bDate
  })
}

function enrichAll(
  items: readonly SportEvent[],
  now: Date,
): readonly SportEventEnriched[] {
  return Object.freeze(sortEvents(items.map((e) => enrich(e, now))))
}

// `listEvents` is the second-heaviest read on the home page (after
// `listSpots`). The repository's `list()` runs a left-join to
// `eventTiers` + `countries` plus a correlated `array_agg` subquery
// for `sports`. Caching it for 60s/revalidate, 300s/stale,
// 3600s/expire keeps warm home pages off the DB entirely.
// Mutations in Phase 5 call `revalidateTag("events:list")` so writes
// propagate.
//
// `connection()` is intentionally NOT called here: `"use cache"`
// functions must be producible outside a request lifecycle.
const LIST_CACHE_LIFE = {
  revalidate: 60,
  stale: 300,
  expire: 3600,
} as const

const ITEM_CACHE_LIFE = {
  revalidate: 60,
  stale: 300,
  expire: 3600,
} as const

// ---------- list ----------

export async function runListEvents(
  query?: SportEventQuery,
): Promise<readonly SportEventEnriched[]> {
  const repo = await getEventRepositoryAsync()
  const { items } = await repo.list(query)
  return enrichAll(items, new Date())
}

export async function listEvents(
  query?: SportEventQuery,
): Promise<readonly SportEventEnriched[]> {
  "use cache"
  cacheTag("events:list")
  cacheLife(LIST_CACHE_LIFE)
  return runListEvents(query)
}

export async function runListEventsRaw(
  query?: SportEventQuery,
): Promise<SportEventListResult> {
  const repo = await getEventRepositoryAsync()
  return repo.list(query)
}

export async function listEventsRaw(
  query?: SportEventQuery,
): Promise<SportEventListResult> {
  "use cache"
  cacheTag("events:list")
  cacheLife(LIST_CACHE_LIFE)
  return runListEventsRaw(query)
}

// ---------- featured ----------
// Derives the featured event from the cached list (no separate DB
// call). Mutations that touch `featured` revalidate the
// `events:list` tag, which transitively invalidates this function.

export async function runFindFeaturedEvent(): Promise<
  SportEventEnriched | undefined
> {
  const events = await runListEvents()
  return (
    events.find((e) => e.featured && e.status !== "completed") ?? events[0]
  )
}

export async function findFeaturedEvent(): Promise<
  SportEventEnriched | undefined
> {
  "use cache"
  cacheTag("events:list")
  cacheLife(ITEM_CACHE_LIFE)
  return runFindFeaturedEvent()
}

// ---------- findById ----------

export async function runFindEventById(
  id: string,
): Promise<SportEventEnriched | null> {
  const repo = await getEventRepositoryAsync()
  const event = await repo.findById(id)
  if (!event) return null
  const events = enrichAll([event], new Date())
  return events[0] ?? null
}

export async function findEventById(
  id: string,
): Promise<SportEventEnriched | null> {
  "use cache"
  cacheTag(`events:item:${id}`)
  cacheLife(ITEM_CACHE_LIFE)
  return runFindEventById(id)
}
