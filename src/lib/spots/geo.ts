import type { Spot } from "@/lib/types"

const EARTH_RADIUS_KM = 6371
const KM_TO_MILES = 0.621371
const MILES_TO_METERS = 1609.344

export interface LatLon {
  lat: number
  lon: number
}

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

export function getSpotDistanceLabel(spot: Spot, origin?: LatLon | null): string {
  const useOrigin =
    origin !== null && origin !== undefined && Number.isFinite(origin.lat) && Number.isFinite(origin.lon)
  const lat = useOrigin ? origin.lat : REFERENCE_LAT
  const lon = useOrigin ? origin.lon : REFERENCE_LON
  const miles = haversineMiles(lat, lon, spot.location.lat, spot.location.lon)
  return formatDistanceMiles(miles)
}

export function milesToMeters(miles: number): number {
  return miles * MILES_TO_METERS
}

export function hashToUnitInterval(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return (Math.abs(h) % 1000) / 1000
}
