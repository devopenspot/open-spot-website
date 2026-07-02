import { describe, it, expect } from "vitest"
import { deriveStatus } from "./status"
import type { SportEvent } from "@/types/sport-events"

function event(over: Partial<SportEvent> = {}): SportEvent {
  return {
    id: "e1",
    slug: "e1",
    name: "Test",
    url: "https://example.com",
    image: "https://example.com/img.png",
    description: "",
    sports: ["Skateboard"],
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    location: { city: "LA", country: "USA" },
    tier: "world-tour",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...over,
  }
}

describe("deriveStatus", () => {
  it("returns 'upcoming' when now is before the start date", () => {
    expect(deriveStatus(event(), new Date("2026-08-13T23:59:59Z"))).toBe("upcoming")
  })

  it("returns 'live' when now is within the start..end range", () => {
    expect(deriveStatus(event(), new Date("2026-08-15T12:00:00Z"))).toBe("live")
  })

  it("returns 'live' on the end date before 23:59:59 UTC", () => {
    expect(deriveStatus(event(), new Date("2026-08-16T23:59:58Z"))).toBe("live")
  })

  it("returns 'completed' when now is after the end date", () => {
    expect(deriveStatus(event(), new Date("2026-08-17T00:00:00Z"))).toBe("completed")
  })

  it("treats a single-day event as live on that day", () => {
    const single = event({ startDate: "2026-08-14", endDate: undefined })
    expect(deriveStatus(single, new Date("2026-08-14T12:00:00Z"))).toBe("live")
    expect(deriveStatus(single, new Date("2026-08-14T23:59:58Z"))).toBe("live")
    expect(deriveStatus(single, new Date("2026-08-15T00:00:00Z"))).toBe("completed")
  })
})