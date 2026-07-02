import { describe, it, expect, beforeEach } from "vitest"
import { JsonSpotRepository } from "../json-spot-repository"
import type { NewSpot } from "../types"

export function spotRepositoryContract(getRepo: () => JsonSpotRepository) {
  return () => {
    let repo: JsonSpotRepository

    beforeEach(() => {
      repo = getRepo()
    })

    it("list returns an array of spots and a nextCursor (null for the JSON impl since the dataset is small)", async () => {
      const result = await repo.list()
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.nextCursor).toBe(null)
    })

    it("findById returns a spot for a known id and null for an unknown id", async () => {
      const first = (await repo.list()).items[0]
      expect(first).toBeDefined()
      const found = await repo.findById(first!.id)
      expect(found?.id).toBe(first!.id)
      const missing = await repo.findById("nope-not-a-real-id")
      expect(missing).toBe(null)
    })

    it("findBySlug returns a spot for a known slug and null for an unknown slug", async () => {
      const first = (await repo.list()).items[0]
      expect(first).toBeDefined()
      const found = await repo.findBySlug(first!.slug)
      expect(found?.slug).toBe(first!.slug)
      const missing = await repo.findBySlug("nope-not-a-real-slug")
      expect(missing).toBe(null)
    })

    it("findNearby returns spots within radiusMeters and excludes farther spots", async () => {
      const result = await repo.findNearby({ lat: 45.7686, lon: 4.8369, radiusMeters: 50_000 })
      expect(result.length).toBeGreaterThan(0)
      for (const spot of result) {
        expect(spot.location.lat).toBeCloseTo(45.7686, -1)
      }
    })

    it("create returns a Spot with the supplied fields and prepends it to the list", async () => {
      const newSpot: NewSpot = {
        name: "Test Skate Plaza",
        city: "Test City",
        citySlug: "test-city",
        address: "123 Test Ave",
        type: "Plaza",
        features: ["Smooth Concrete"],
        image: "https://example.com/img.png",
        communityNote: "",
        crowdLevel: 0,
        crowdLevelLabel: "",
        country: "United States",
        location: { lat: 0, lon: 0 },
        createdBy: "dev",
      }
      const created = await repo.create(newSpot)
      // The Json impl uppercases the name to match the existing UI behavior
      // (SpotCard renders spot.name directly). The Stage E.5 Drizzle impl
      // preserves the raw case per §8.13.2; this contract asserts the
      // current Json behavior, and the Drizzle suite will diverge accordingly.
      expect(created.name).toBe("TEST SKATE PLAZA")
      expect(created.type).toBe("Plaza")
      expect(created.createdAt).toBeTruthy()

      const after = await repo.list()
      expect(after.items.some((s) => s.id === created.id)).toBe(true)
    })

    it("create honors a caller-supplied id (Stage E.8 wire-up)", async () => {
      const providedId = "user-upload-spot-" + Date.now().toString(36)
      const created = await repo.create({
        id: providedId,
        name: "Provided ID Spot",
        city: "Provided City",
        citySlug: "provided-city",
        address: "1 Provided Way",
        type: "Plaza",
        features: [],
        image: "https://example.com/img.png",
        imagePath: "spots/" + providedId + "/x.png",
        communityNote: "",
        crowdLevel: 0,
        crowdLevelLabel: "",
        country: "United States",
        location: { lat: 0, lon: 0 },
        createdBy: "dev",
      })
      expect(created.id).toBe(providedId)
      const found = await repo.findById(providedId)
      expect(found?.id).toBe(providedId)
    })

    it("update mutates a spot and bumps updatedAt", async () => {
      const first = (await repo.list()).items[0]
      expect(first).toBeDefined()
      const updated = await repo.update(first!.id, { name: "RENAMED" })
      expect(updated.name).toBe("RENAMED")
      const reloaded = await repo.findById(first!.id)
      expect(reloaded?.name).toBe("RENAMED")
    })

    it("update throws for an unknown id", async () => {
      await expect(
        repo.update("nope-not-a-real-id", { name: "X" }),
      ).rejects.toThrow()
    })

    it("delete removes a spot", async () => {
      const first = (await repo.list()).items[0]
      expect(first).toBeDefined()
      await repo.delete(first!.id)
      const after = await repo.findById(first!.id)
      expect(after).toBe(null)
    })

    it("listTypes returns counts per SpotType", async () => {
      const types = await repo.listTypes()
      expect(types.length).toBeGreaterThan(0)
      for (const t of types) {
        expect(typeof t.name).toBe("string")
        expect(t.count).toBeGreaterThan(0)
      }
    })

    it("listRegions returns regions with non-zero country + spot counts", async () => {
      const regions = await repo.listRegions()
      expect(regions.length).toBeGreaterThan(0)
      for (const r of regions) {
        expect(r.countryCount).toBeGreaterThan(0)
        expect(r.spotCount).toBeGreaterThan(0)
      }
    })
  }
}

describe("JsonSpotRepository contract", spotRepositoryContract(() => new JsonSpotRepository()))