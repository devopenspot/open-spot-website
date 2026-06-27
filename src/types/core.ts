import type { WeatherItem } from "@/types/weather"

export interface NominatimAddress {
	amenity?: string
	leisure?: string
	road?: string
	neighbourhood?: string
	suburb?: string
	city_district?: string
	city?: string
	town?: string
	village?: string
	hamlet?: string
	municipality?: string
	county?: string
	state_district?: string
	state?: string
	"ISO3166-2-lvl4"?: string
	region?: string
	postcode?: string
	country?: string
	country_code?: string
	[key: string]: string | undefined
}

export interface Spot {
	place_id: number
	licence?: string
	osm_type?: string
	osm_id?: number
	lat: string
	lon: string
	category?: string
	type?: string
	place_rank?: number
	importance?: number
	addresstype?: string
	name: string
	display_name: string
	address?: NominatimAddress
	boundingbox?: string[]
	weather?: WeatherItem
	lang?: string
	spot_types?: string[]
	country_slug?: string
	state_slug?: string | null
	city_slug?: string | null
	slug?: string
}

export type SpotResponse = { data: Spot[] }
