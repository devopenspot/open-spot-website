"use client";

import { useId } from "react";
import { SPORT_DISCIPLINES, type SportDiscipline } from "@/types/sport-events";
import {
  ImageSourceField,
  type ImageSourceFieldValue,
} from "./ImageSourceField";
import { LatLonEditor, type LatLonEditorMode } from "./LatLonEditor";
import { CountryAutocomplete } from "./CountryAutocomplete";
import type { ProjectedAddress } from "@/lib/geocode/project";
import type { SpotTypeEntity } from "@/lib/types";

export interface SpotFormState {
  name: string;
  city: string;
  citySlug: string;
  address: string;
  country: string;
  countryCode: string;
  types: string[];
  sports: SportDiscipline[];
  image: ImageSourceFieldValue;
  lat: number;
  lon: number;
}
// TODO: the correct behavior of this form is: when the user open for first time this page, or then of save a spot, must set the fields in the default values, as the first time it is open
interface SpotFormFieldsProps {
  state: SpotFormState;
  onChange: (next: SpotFormState) => void;
  errors?: Partial<Record<keyof SpotFormState, string>>;
  /**
   * Lat/lon editor behaviour. Defaults to `"preview"` (the edit-page
   * contract: lookup shows a preview, does not overwrite address fields).
   * Pass `"auto-fill"` from the new-spot page so a successful lookup
   * populates city / country / address / citySlug through
   * `onAutoFillResult`.
   */
  latLonMode?: LatLonEditorMode;
  /**
   * Only used when `latLonMode === "auto-fill"`. Receives the projected
   * address from a successful reverse-geocode so the parent can apply
   * it to the form (mirrors the previous `applyAddress` helper in
   * `AdminNewSpotForm`).
   */
  onAutoFillResult?: (address: ProjectedAddress) => void;
  /** Forwarded to the lat/lon editor for its API + validation errors. */
  onError?: (message: string) => void;
  /**
   * The available spot types for the type picker. The server page
   * fetches this from the `spot_types` DB table via
   * `repo.listAllSpotTypes()` and passes it down.
   */
  spotTypes: readonly SpotTypeEntity[];
}

export function SpotFormFields({
  state,
  onChange,
  errors,
  latLonMode = "preview",
  onAutoFillResult,
  onError,
  spotTypes,
}: SpotFormFieldsProps) {
  const nameId = useId();
  const cityId = useId();
  const addressId = useId();
  const countryId = useId();
  const typesFieldsetId = useId();
  const sportsFieldsetId = useId();
  const errorId = useId();

  const update = <K extends keyof SpotFormState>(
    key: K,
    value: SpotFormState[K],
  ) => onChange({ ...state, [key]: value });

  const handleCountryChange = (next: { name: string; code: string }) => {
    onChange({ ...state, country: next.name, countryCode: next.code });
  };

  const toggleSport = (sport: SportDiscipline) => {
    if (state.sports.includes(sport)) {
      update(
        "sports",
        state.sports.filter((s) => s !== sport),
      );
    } else {
      update("sports", [...state.sports, sport]);
    }
  };

  const toggleType = (slug: string) => {
    if (state.types.includes(slug)) {
      update(
        "types",
        state.types.filter((s) => s !== slug),
      );
    } else {
      update("types", [...state.types, slug]);
    }
  };

  return (
    <div className="space-y-8">
      <LatLonEditor
        lat={state.lat}
        lon={state.lon}
        mode={latLonMode}
        onChange={(lat, lon) => onChange({ ...state, lat, lon })}
        onAutoFillResult={onAutoFillResult}
        onError={onError}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={nameId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Spot name <span aria-hidden="true">*</span>
          </label>
          <input
            id={nameId}
            type="text"
            required
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. The White Marble Nine"
            aria-invalid={Boolean(errors?.name)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={cityId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            City <span aria-hidden="true">*</span>
          </label>
          <input
            id={cityId}
            type="text"
            required
            value={state.city}
            onChange={(e) => update("city", e.target.value)}
            placeholder="e.g. Los Angeles, CA"
            aria-invalid={Boolean(errors?.city)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <fieldset
        id={typesFieldsetId}
        className="rounded-xl border border-outline-variant bg-surface-container-low p-5"
      >
        <legend className="flex items-center px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
          Spot types{" "}
          <span aria-hidden="true" className="ml-1 text-primary">
            *
          </span>
        </legend>
        <p className="mb-3 text-[10px] text-secondary">
          Pick every type this spot supports — plaza, bowl, rails, DIY, etc.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {spotTypes.map((opt) => {
            const active = state.types.includes(opt.slug);
            return (
              <li key={opt.slug}>
                <label
                  className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-[10px] font-semibold transition-all ${
                    active
                      ? "border-primary bg-primary text-surface"
                      : "border-outline-variant bg-surface text-on-surface hover:border-outline"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleType(opt.slug)}
                    className="sr-only"
                    aria-label={opt.name}
                  />
                  {opt.name}
                </label>
              </li>
            );
          })}
        </ul>
        {errors?.types ? (
          <p id={errorId} role="alert" className="mt-3 text-[10px] text-error">
            {errors.types}
          </p>
        ) : null}
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={countryId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Country
          </label>
          <CountryAutocomplete
            id={countryId}
            value={{ name: state.country, code: state.countryCode }}
            onChange={handleCountryChange}
            onError={onError}
            invalid={Boolean(errors?.country)}
          />
        </div>
        <div>
          <label
            htmlFor={addressId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Address
          </label>
          <input
            id={addressId}
            type="text"
            value={state.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="e.g. Hope Street, L.A."
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <ImageSourceField
        value={state.image}
        onChange={(v) => update("image", v)}
      />

      <fieldset
        id={sportsFieldsetId}
        className="rounded-xl border border-outline-variant bg-surface-container-low p-5"
      >
        <legend className="flex items-center px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
          Sport types
        </legend>
        <p className="mb-3 text-[10px] text-secondary">
          Which disciplines does this spot support? Pick all that apply.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {SPORT_DISCIPLINES.map((sport) => {
            const active = state.sports.includes(sport);
            return (
              <li key={sport}>
                <label
                  className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-[10px] font-semibold transition-all ${
                    active
                      ? "border-primary bg-primary text-surface"
                      : "border-outline-variant bg-surface text-on-surface hover:border-outline"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleSport(sport)}
                    className="sr-only"
                    aria-label={sport}
                  />
                  {sport}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {Object.values(errors ?? {}).some(Boolean) ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container/30 px-4 py-2 text-xs text-error"
        >
          {Object.values(errors ?? {})
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
