import { describe, it, expect } from "vitest"
import { haversineMiles, projectToGrid, formatDistanceMiles, bboxOf } from "./geo"

describe("haversineMiles", () => {
  it("returns ~2475 miles for LAX (33.9425,-118.4081) to JFK (40.6413,-73.7781)", () => {
    const d = haversineMiles(33.9425, -118.4081, 40.6413, -73.7781)
    expect(d).toBeGreaterThan(2400)
    expect(d).toBeLessThan(2550)
  })

  it("returns 0 for the same coordinate", () => {
    expect(haversineMiles(34.0522, -118.2437, 34.0522, -118.2437)).toBe(0)
  })
})

describe("formatDistanceMiles", () => {
  it("uses one decimal under 10 miles", () => {
    expect(formatDistanceMiles(3.4)).toBe("3.4 MILES AWAY")
  })

  it("rounds to integer between 10 and 100 miles", () => {
    expect(formatDistanceMiles(42.7)).toBe("43 MILES AWAY")
  })

  it("rounds to tens over 100 miles", () => {
    expect(formatDistanceMiles(173)).toBe("170 MILES AWAY")
  })
})

describe("projectToGrid", () => {
  const bbox = bboxOf([
    { lat: 0, lon: 0 },
    { lat: 10, lon: 10 },
  ])

  it("clamps to 5% minimum (off-south)", () => {
    const { x, y } = projectToGrid(-100, -100, bbox)
    expect(x).toBe(5)
    expect(y).toBe(95)
  })

  it("clamps to 95% maximum (off-north)", () => {
    const { x, y } = projectToGrid(100, 100, bbox)
    expect(x).toBe(95)
    expect(y).toBe(5)
  })

  it("puts the center of the bbox near (50, 50)", () => {
    const { x, y } = projectToGrid(5, 5, bbox)
    expect(x).toBeCloseTo(50, 0)
    expect(y).toBeCloseTo(50, 0)
  })
})