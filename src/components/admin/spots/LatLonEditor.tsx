"use client";

import { useEffect, useId, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { NominatimAddressPreview } from "./NominatimAddressPreview";
import type { ProjectedAddress } from "@/lib/geocode/project";

export type LatLonEditorMode = "auto-fill" | "preview" | "read-only";

interface LatLonEditorProps {
  lat: number;
  lon: number;
  onChange: (lat: number, lon: number) => void;
  /**
   * `auto-fill`  — the new-spot flow: a successful lookup's projected
   *                 address is forwarded to the parent via
   *                 `onAutoFillResult` so it can populate city / country /
   *                 address / citySlug. The address preview is also shown.
   * `preview`    — the edit flow: a successful lookup is shown as a
   *                 read-only preview; the parent is NOT notified, so
   *                 existing address fields are not overwritten.
   * `read-only`  — JSON mode / write-disabled: inputs and button are
   *                 disabled; no fetch is performed.
   */
  mode: LatLonEditorMode;
  /** Only invoked in `auto-fill` mode on a successful lookup. */
  onAutoFillResult?: (address: ProjectedAddress) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

interface LookupState {
  status: "idle" | "loading" | "success" | "error";
  address: ProjectedAddress | null;
  error: string | null;
}

const FIELD_CLASSES =
  "w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none disabled:opacity-50";

// Strict "lat, lon" parser. Optional surrounding whitespace, optional
// leading minus. Does NOT accept parens, DMS, or "lat lon" with no comma —
// those are rejected silently so the paste input feels honest.
const PASTE_REGEX = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function formatPaste(lat: number, lon: number): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  return `${lat}, ${lon}`;
}

export function LatLonEditor({
  lat,
  lon,
  onChange,
  mode,
  onAutoFillResult,
  onError,
  disabled = false,
}: LatLonEditorProps) {
  const latId = useId();
  const lonId = useId();
  const pasteId = useId();
  const readOnly = mode === "read-only" || disabled;
  const [state, setState] = useState<LookupState>({
    status: "idle",
    address: null,
    error: null,
  });
  // Local state for the paste field. Source of truth for the form is still
  // the `lat` / `lon` props; this just lets the user type freely without
  // losing their input on every keystroke.
  const [pasteValue, setPasteValue] = useState<string>(formatPaste(lat, lon));

  // Resync the paste field when the two separate inputs change it externally.
  // This is the standard "derived state from props" pattern for a hybrid
  // controlled input (the user types freely, but prop changes win).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPasteValue(formatPaste(lat, lon));
  }, [lat, lon]);

  const setError = (message: string) => {
    setState({ status: "error", address: null, error: message });
    onError?.(message);
  };

  const handleLookup = async () => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setError("Enter numeric latitude and longitude.");
      return;
    }
    if (lat === 0 && lon === 0) {
      setError(
        "Coordinates look like a placeholder (0, 0). Set real coordinates or paste from a map.",
      );
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError(
        "Coordinates out of range. Use lat ∈ [-90, 90] and lon ∈ [-180, 180].",
      );
      return;
    }
    setState({ status: "loading", address: null, error: null });
    try {
      const r = await fetch(
        `/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      );
      if (!r.ok) {
        const body = (await r.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message =
          r.status === 404
            ? "No address found at this location. Try moving the pin."
            : r.status >= 500
              ? "Reverse-geocode service is unavailable. Try again later."
              : (body?.error ?? `Reverse geocode failed (${r.status})`);
        setError(message);
        return;
      }
      const data = (await r.json()) as { address: ProjectedAddress };
      setState({ status: "success", address: data.address, error: null });
      if (mode === "auto-fill") {
        onAutoFillResult?.(data.address);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Reverse geocode failed";
      setError(message);
    }
  };

  const handleRetry = () => {
    setState({ status: "idle", address: null, error: null });
  };

  const handleLatChange = (raw: string) => {
    const next = Number(raw);
    onChange(Number.isFinite(next) ? next : NaN, lon);
  };

  const handleLonChange = (raw: string) => {
    const next = Number(raw);
    onChange(lat, Number.isFinite(next) ? next : NaN);
  };

  const handlePasteChange = (raw: string) => {
    setPasteValue(raw);
    const match = PASTE_REGEX.exec(raw);
    if (!match) return;
    const newLat = Number(match[1]);
    const newLon = Number(match[2]);
    if (Number.isFinite(newLat) && Number.isFinite(newLon)) {
      onChange(newLat, newLon);
    }
  };

  const loading = state.status === "loading";
  const canLookup =
    !readOnly && !loading && Number.isFinite(lat) && Number.isFinite(lon);

  return (
    <fieldset className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
      <legend className="flex items-center px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
        Location (lat / lon)
      </legend>
      <p className="mb-3 text-[10px] text-secondary">
        {mode === "auto-fill"
          ? "Paste coordinates from a map or type them. The address fields below auto-fill when the lookup succeeds; you can still edit them."
          : "Latitude and longitude of the spot. Use the button to reverse-geocode through Nominatim — the resolved address is shown as a preview without overwriting the address fields below."}
      </p>

      <div className="mb-3">
        <label
          htmlFor={pasteId}
          className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          <MapPin
            size={10}
            className="mr-1 inline-block align-middle"
            aria-hidden="true"
          />
          Paste coordinates (lat, lon)
        </label>
        <input
          id={pasteId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={pasteValue}
          onChange={(e) => handlePasteChange(e.target.value)}
          placeholder="3.4148330629420376, -76.55256421903898"
          disabled={readOnly}
          aria-describedby={`${pasteId}-hint`}
          className={cn(FIELD_CLASSES, "font-mono")}
        />

        <p
          id={`${pasteId}-hint`}
          className="mt-1 font-mono text-[9px] uppercase tracking-widest text-secondary"
        >
          Strict format: <span className="font-semibold">lat, lon</span> · e.g.{" "}
          <span className="font-semibold">45.764, 4.836</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
        {/* <div>
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
            value={Number.isFinite(lat) ? String(lat) : ""}
            onChange={(e) => handleLatChange(e.target.value)}
            placeholder="e.g. 45.7686"
            disabled={readOnly}
            className={cn(FIELD_CLASSES, "font-mono")}
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
            value={Number.isFinite(lon) ? String(lon) : ""}
            onChange={(e) => handleLonChange(e.target.value)}
            placeholder="e.g. 4.8369"
            disabled={readOnly}
            className={cn(FIELD_CLASSES, "font-mono")}
          />
        </div> */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleLookup}
            disabled={!canLookup}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-on-surface px-4 py-3 text-xs font-bold uppercase tracking-widest text-surface transition-all hover:bg-on-surface/90 disabled:opacity-50 sm:w-auto"
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
    </fieldset>
  );
}
