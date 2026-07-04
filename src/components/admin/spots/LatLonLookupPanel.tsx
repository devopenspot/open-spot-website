"use client"

import { useId, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/cn"
import { NominatimAddressPreview } from "./NominatimAddressPreview"
import type { ProjectedAddress } from "@/lib/geocode/project"

export interface LatLonLookupResult {
  address: ProjectedAddress
  raw: unknown
}

interface LatLonLookupPanelProps {
  initialLat?: number
  initialLon?: number
  onResult: (result: LatLonLookupResult) => void
  onError?: (message: string) => void
  disabled?: boolean
}

interface LookupState {
  status: "idle" | "loading" | "success" | "error"
  address: ProjectedAddress | null
  raw: unknown
  error: string | null
}

/**
 * Step 1 of the new-spot flow. Two numeric inputs + a `Look up` button
 * that calls `GET /api/geocode/reverse?lat=…&lon=…`. The result is
 * projected and forwarded to the parent via `onResult` so the form
 * fields below can auto-populate.
 */
export function LatLonLookupPanel({
  initialLat,
  initialLon,
  onResult,
  onError,
  disabled = false,
}: LatLonLookupPanelProps) {
  const latId = useId()
  const lonId = useId()
  const [lat, setLat] = useState<string>(
    initialLat !== undefined ? String(initialLat) : "",
  )
  const [lon, setLon] = useState<string>(
    initialLon !== undefined ? String(initialLon) : "",
  )
  const [state, setState] = useState<LookupState>({
    status: "idle",
    address: null,
    raw: null,
    error: null,
  })

  const handleLookup = async () => {
    const parsedLat = Number(lat)
    const parsedLon = Number(lon)
    if (
      !Number.isFinite(parsedLat) ||
      !Number.isFinite(parsedLon) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLon < -180 ||
      parsedLon > 180
    ) {
      const message = "Coordinates out of range. Use lat ∈ [-90, 90] and lon ∈ [-180, 180]."
      setState({ status: "error", address: null, raw: null, error: message })
      onError?.(message)
      return
    }
    setState({ status: "loading", address: null, raw: null, error: null })
    try {
      const r = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(parsedLat)}&lon=${encodeURIComponent(parsedLon)}`,
      )
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as
          | { error?: string }
          | null
        const message = body?.error ?? `Reverse geocode failed (${r.status})`
        setState({ status: "error", address: null, raw: null, error: message })
        onError?.(message)
        return
      }
      const data = (await r.json()) as { address: ProjectedAddress }
      setState({
        status: "success",
        address: data.address,
        raw: data,
        error: null,
      })
      onResult({ address: data.address, raw: data })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Reverse geocode failed"
      setState({ status: "error", address: null, raw: null, error: message })
      onError?.(message)
    }
  }

  const handleRetry = () => {
    setState({ status: "idle", address: null, raw: null, error: null })
  }

  const loading = state.status === "loading"

  return (
    <section
      aria-labelledby="lat-lon-lookup-heading"
      className="rounded-xl border border-outline-variant bg-surface-container-low p-5"
    >
      <h2
        id="lat-lon-lookup-heading"
        className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-secondary"
      >
        Step 1 — Paste lat/lon
      </h2>
      <p className="mb-4 text-xs text-secondary leading-relaxed">
        Paste the coordinates of the new spot. We reverse-geocode them
        through Nominatim and pre-fill the form below. Every field stays
        editable.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label
            htmlFor={latId}
            className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Latitude
          </label>
          <input
            id={latId}
            type="number"
            inputMode="decimal"
            step="any"
            min={-90}
            max={90}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="e.g. 45.7686"
            disabled={disabled}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor={lonId}
            className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Longitude
          </label>
          <input
            id={lonId}
            type="number"
            inputMode="decimal"
            step="any"
            min={-180}
            max={180}
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="e.g. 4.8369"
            disabled={disabled}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none disabled:opacity-50"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleLookup}
            disabled={disabled || loading || !lat || !lon}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-on-surface px-4 py-3 text-xs font-bold uppercase tracking-widest text-surface transition-all hover:bg-on-surface/90 disabled:opacity-50 sm:w-auto",
            )}
          >
            <Search size={12} aria-hidden="true" />
            {loading ? "Looking up…" : "Look up"}
          </button>
        </div>
      </div>

      {state.status === "error" ? (
        <div
          role="alert"
          className="mt-4 flex items-start justify-between gap-2 rounded-lg border border-error/30 bg-error-container/30 p-3 text-xs text-error"
        >
          <span>{state.error}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded border border-error/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          >
            Retry
          </button>
        </div>
      ) : null}

      {state.status === "success" && state.address ? (
        <NominatimAddressPreview address={state.address} />
      ) : null}
    </section>
  )
}
