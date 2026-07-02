import { describe, it, expect, beforeEach } from "vitest"
import { useMapFilterStore } from "./map-filter-store"

describe("useMapFilterStore", () => {
  beforeEach(() => {
    useMapFilterStore.setState({ region: null, country: null })
  })

  it("sets region and country independently", () => {
    useMapFilterStore.getState().setRegion("Europe")
    expect(useMapFilterStore.getState().region).toBe("Europe")
    useMapFilterStore.getState().setCountry("France")
    expect(useMapFilterStore.getState().country).toBe("France")
  })

  it("clears the country when region is set to null", () => {
    useMapFilterStore.setState({ region: "Europe", country: "France" })
    useMapFilterStore.getState().setRegion(null)
    expect(useMapFilterStore.getState().region).toBe(null)
    expect(useMapFilterStore.getState().country).toBe(null)
  })

  it("clearMapFilter resets both", () => {
    useMapFilterStore.setState({ region: "Asia", country: "Japan" })
    useMapFilterStore.getState().clearMapFilter()
    expect(useMapFilterStore.getState().region).toBe(null)
    expect(useMapFilterStore.getState().country).toBe(null)
  })
})