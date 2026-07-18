// Thin re-export shim. The actual implementations live in
// `@/lib/services/events` where the cache directives (`"use cache"`,
// `cacheTag`, `cacheLife`) are owned. Existing callers
// (`src/app/page.tsx`, `src/app/explore/page.tsx`,
// `src/app/sport-events/page.tsx`) keep importing from here so the
// public loader name stays stable.
export {
  listEvents as getSportEvents,
  findFeaturedEvent as getFeaturedSportEvent,
  findEventById,
  listEventsRaw,
} from "@/lib/services/events"
