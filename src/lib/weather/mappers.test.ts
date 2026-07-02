import { describe, it, expect } from "vitest"
import { mapIconName, mapCurrentWeather, mapForecast } from "./mappers"
import type { WeatherItem } from "@/types/weather"

describe("mapIconName", () => {
  it("maps clear sky", () => {
    expect(mapIconName("01d")).toBe("sunny")
    expect(mapIconName("01n")).toBe("sunny")
  })

  it("maps few clouds", () => {
    expect(mapIconName("02d")).toBe("partly_cloudy_day")
  })

  it("maps scattered/broken clouds", () => {
    expect(mapIconName("03d")).toBe("cloudy")
    expect(mapIconName("04d")).toBe("cloudy")
  })

  it("maps rain (09 + 10)", () => {
    expect(mapIconName("09d")).toBe("rain")
    expect(mapIconName("10n")).toBe("rain")
  })

  it("maps snow", () => {
    expect(mapIconName("13d")).toBe("snow")
  })

  it("falls back to sunny for unknown codes", () => {
    expect(mapIconName("50d")).toBe("sunny")
    expect(mapIconName(undefined)).toBe("sunny")
  })
})

describe("mapCurrentWeather", () => {
  it("returns the rounded temp for a known item", () => {
    const item = { main: { temp: 18.6 } } as unknown as WeatherItem
    expect(mapCurrentWeather(item)).toBe(19)
  })

  it("returns fallback for null", () => {
    expect(mapCurrentWeather(null)).toBe(22)
  })
})

describe("mapForecast", () => {
  it("returns a 3-day forecast for an empty list (fallback)", () => {
    const forecast = mapForecast([], "spot-a")
    expect(forecast).toHaveLength(3)
    expect(forecast[0]?.day).toBe("TUE")
  })

  it("groups items by day and caps at 3 days", () => {
    const items: WeatherItem[] = [
      { dt: 1700000000, weather: [{ icon: "01d" }], main: { temp: 10 } } as unknown as WeatherItem,
      { dt: 1700086400, weather: [{ icon: "02d" }], main: { temp: 12 } } as unknown as WeatherItem,
      { dt: 1700172800, weather: [{ icon: "09d" }], main: { temp: 9 } } as unknown as WeatherItem,
      { dt: 1700259200, weather: [{ icon: "10d" }], main: { temp: 8 } } as unknown as WeatherItem,
      { dt: 1700345600, weather: [{ icon: "13d" }], main: { temp: 0 } } as unknown as WeatherItem,
    ]
    const forecast = mapForecast(items, "spot-b")
    expect(forecast).toHaveLength(3)
    expect(forecast.map((f) => f.icon)).toEqual(["sunny", "partly_cloudy_day", "rain"])
  })
})