import spotsJson from "@/data/spots.json"
import type { Spot } from "@/lib/types"

export interface BBox {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
}

export type BBoxEntry = {
  lat: string | number
  lon: string | number
}

export function bboxOf(entries: ReadonlyArray<BBoxEntry>): BBox {
  if (entries.length === 0) {
    return { minLat: -90, maxLat: 90, minLon: -180, maxLon: 180 }
  }
  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const e of entries) {
    const lat = Number(e.lat)
    const lon = Number(e.lon)
    if (Number.isFinite(lat)) {
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
    if (Number.isFinite(lon)) {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
    }
  }
  if (
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLat) ||
    !Number.isFinite(minLon) ||
    !Number.isFinite(maxLon)
  ) {
    return { minLat: -90, maxLat: 90, minLon: -180, maxLon: 180 }
  }
  return { minLat, maxLat, minLon, maxLon }
}

export function projectToGrid(
  lat: number,
  lon: number,
  bbox: BBox,
): { x: number; y: number } {
  const { minLat, maxLat, minLon, maxLon } = bbox
  const latSpan = maxLat - minLat || 1
  const lonSpan = maxLon - minLon || 1
  const xPct = ((lon - minLon) / lonSpan) * 100
  const yPct = ((maxLat - lat) / latSpan) * 100
  return {
    x: clampPct(xPct, 5, 95),
    y: clampPct(yPct, 5, 95),
  }
}

function clampPct(v: number, min: number, max: number): number {
  if (v < min) return min
  if (v > max) return max
  return v
}

const EARTH_RADIUS_KM = 6371
const KM_TO_MILES = 0.621371

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c * KM_TO_MILES
}

export const REFERENCE_LAT = 34.0522
export const REFERENCE_LON = -118.2437

export function formatDistanceMiles(miles: number): string {
  if (miles < 10) return `${miles.toFixed(1)} MILES AWAY`
  if (miles < 100) return `${Math.round(miles)} MILES AWAY`
  return `${Math.round(miles / 10) * 10} MILES AWAY`
}

export function hashToUnitInterval(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return (Math.abs(h) % 1000) / 1000
}

const RAW_SPOT_ENTRIES = spotsJson as ReadonlyArray<{ lat: string | number; lon: string | number }>

const GRID_BBOX: BBox = bboxOf(RAW_SPOT_ENTRIES)

export function getSpotDistanceLabel(spot: Spot): string {
  const miles = haversineMiles(
    REFERENCE_LAT,
    REFERENCE_LON,
    spot.location.lat,
    spot.location.lon,
  )
  return formatDistanceMiles(miles)
}

export function getSpotGridCoordinates(spot: Spot): { x: number; y: number } {
  return projectToGrid(spot.location.lat, spot.location.lon, GRID_BBOX)
}
