"use client";

import { useId, useMemo, useState } from "react";
import { Globe, MapPin, Ruler, Thermometer, X } from "lucide-react";
import { Overlay } from "@/components/feedback/Overlay";
import { useUIStore } from "@/stores/ui-store";
import {
  usePreferencesStore,
  DEFAULT_DISTANCE_UNIT,
  DEFAULT_TEMPERATURE_UNIT,
  type DistanceUnit,
  type TemperatureUnit,
} from "@/stores/preferences-store";
import { useSpotsStore } from "@/stores/spots-store";
import { cn } from "@/lib/cn";

const ONBOARDING_DIALOG_TITLE_ID = "onboarding-dialog-title";

type Mode = "onboarding" | "edit";

interface OnboardingDialogProps {
  mode: Mode;
}

function guessDefaultLocale(
  regions: ReadonlyArray<{ name: string; countries: readonly string[] }>,
): { region: string | null; country: string | null } {
  if (typeof navigator === "undefined") return { region: null, country: null };
  const locale =
    navigator.language ||
    (Array.isArray(navigator.languages) ? navigator.languages[0] : "");
  if (!locale) return { region: null, country: null };
  const regionPart = locale.split(/[-_]/)[1]?.toUpperCase() ?? "";
  if (!regionPart) return { region: null, country: null };
  for (const r of regions) {
    const match = r.countries.find((c) => {
      const tokens = c.toLowerCase().split(/\s+/);
      return tokens.includes(regionPart.toLowerCase());
    });
    if (match) return { region: r.name, country: match };
  }
  return { region: null, country: null };
}

export function OnboardingDialog({ mode }: OnboardingDialogProps) {
  const titleId = useId() || ONBOARDING_DIALOG_TITLE_ID;
  const isOpen = useUIStore((s) => s.isOnboardingOpen);
  const closeOnboarding = useUIStore((s) => s.closeOnboarding);
  const pendingAction = useUIStore((s) => s.pendingOnboardingAction);

  const setOnboarded = usePreferencesStore((s) => s.setOnboarded);
  const setDistanceUnit = usePreferencesStore((s) => s.setDistanceUnit);
  const setTemperatureUnit = usePreferencesStore((s) => s.setTemperatureUnit);
  const setRegion = usePreferencesStore((s) => s.setRegion);
  const setCountry = usePreferencesStore((s) => s.setCountry);
  const reset = usePreferencesStore((s) => s.reset);

  const regions = useSpotsStore((s) => s.regions);
  const isOnboarding = mode === "onboarding";

  return (
    <Overlay
      isOpen={isOpen}
      onClose={isOnboarding ? () => undefined : closeOnboarding}
      labelledBy={titleId}
      role="dialog"
      closeOnBackdrop={!isOnboarding}
      containerClassName="bg-surface-bright"
      panelClassName="bg-surface-bright max-w-md"
    >
      <OnboardingForm
        key={`${mode}-${isOpen ? "open" : "closed"}`}
        mode={mode}
        isOnboarding={isOnboarding}
        regions={regions}
        titleId={titleId}
        onSubmitOnboarding={() => {
          if (isOnboarding) {
            setOnboarded(true);
            // Run the originally-attempted action (search open, nearby
            // navigation, saved navigation, etc.) before closing so the
            // user lands on the screen they intended to reach.
            if (pendingAction) pendingAction();
            closeOnboarding();
          } else {
            closeOnboarding();
          }
        }}
        onSubmitEdit={() => closeOnboarding()}
        onSave={(d, t, r, c) => {
          setDistanceUnit(d);
          setTemperatureUnit(t);
          setRegion(r);
          setCountry(c);
        }}
        onReset={() => {
          reset();
        }}
      />
    </Overlay>
  );
}

interface OnboardingFormProps {
  mode: Mode;
  isOnboarding: boolean;
  regions: ReadonlyArray<{ name: string; countries: readonly string[] }>;
  titleId: string;
  onSubmitOnboarding: () => void;
  onSubmitEdit: () => void;
  onSave: (
    distance: DistanceUnit,
    temperature: TemperatureUnit,
    region: string,
    country: string,
  ) => void;
  onReset: () => void;
}

function OnboardingForm({
  mode,
  isOnboarding,
  regions,
  titleId,
  onSubmitOnboarding,
  onSubmitEdit,
  onSave,
  onReset,
}: OnboardingFormProps) {
  const distanceUnit = usePreferencesStore((s) => s.distanceUnit);
  const temperatureUnit = usePreferencesStore((s) => s.temperatureUnit);
  const region = usePreferencesStore((s) => s.region);
  const country = usePreferencesStore((s) => s.country);

  const initial = useMemo(() => {
    if (!isOnboarding) {
      return {
        distanceUnit,
        temperatureUnit,
        region,
        country,
      };
    }
    const guess = guessDefaultLocale(regions);
    return {
      distanceUnit: DEFAULT_DISTANCE_UNIT,
      temperatureUnit: DEFAULT_TEMPERATURE_UNIT,
      region: guess.region ?? region,
      country: guess.country ?? country,
    };
    // `mode` and `isOpen` are encoded in the parent's `key`; this
    // initializer only runs on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [draftDistance, setDraftDistance] = useState<DistanceUnit>(
    initial.distanceUnit,
  );
  const [draftTemp, setDraftTemp] = useState<TemperatureUnit>(
    initial.temperatureUnit,
  );
  const [draftRegion, setDraftRegionState] = useState<string | null>(
    initial.region,
  );
  const [draftCountry, setDraftCountry] = useState<string | null>(
    initial.country,
  );

  const availableCountries = useMemo(() => {
    if (!draftRegion) return [] as readonly string[];
    return regions.find((r) => r.name === draftRegion)?.countries ?? [];
  }, [draftRegion, regions]);

  const setDraftRegion = (next: string | null) => {
    setDraftRegionState(next);
    if (next === null) {
      setDraftCountry(null);
      return;
    }
    const countries = regions.find((r) => r.name === next)?.countries ?? [];
    if (draftCountry && !countries.includes(draftCountry)) {
      setDraftCountry(null);
    }
  };

  const canSubmit =
    draftDistance !== undefined &&
    draftTemp !== undefined &&
    draftRegion !== null &&
    draftCountry !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave(draftDistance, draftTemp, draftRegion, draftCountry);
    if (isOnboarding) onSubmitOnboarding();
    else onSubmitEdit();
  };

  const handleReset = () => {
    onReset();
    setDraftDistance(DEFAULT_DISTANCE_UNIT);
    setDraftTemp(DEFAULT_TEMPERATURE_UNIT);
    setDraftRegionState(null);
    setDraftCountry(null);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-outline pb-4 mb-6 gap-4 p-4 md:p-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center border border-outline bg-primary text-surface shrink-0">
            <Globe size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <span
              aria-hidden="true"
              className="block font-mono text-[9px] font-bold tracking-widest uppercase text-secondary"
            >
              {isOnboarding ? "First-time setup" : "Preferences"}
            </span>
            <h2
              id={titleId}
              className="font-display text-base font-bold tracking-wide uppercase truncate"
            >
              {isOnboarding ? "Set your defaults" : "Edit your defaults"}
            </h2>
          </div>
        </div>
        {!isOnboarding && (
          <button
            type="button"
            onClick={onSubmitEdit}
            aria-label="Close preferences"
            className="flex h-9 w-9 items-center justify-center border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-6">
        <FieldGroup
          icon={<Ruler size={12} aria-hidden="true" />}
          label="Distance"
          htmlFor={`pref-distance-${mode}`}
        >
          <SegmentedControl
            id={`pref-distance-${mode}`}
            value={draftDistance}
            onChange={setDraftDistance}
            options={[
              { value: "mi", label: "Miles" },
              { value: "km", label: "Kilometers" },
            ]}
          />
        </FieldGroup>

        <FieldGroup
          icon={<Thermometer size={12} aria-hidden="true" />}
          label="Temperature"
          htmlFor={`pref-temp-${mode}`}
        >
          <SegmentedControl
            id={`pref-temp-${mode}`}
            value={draftTemp}
            onChange={setDraftTemp}
            options={[
              { value: "C", label: "Celsius" },
              { value: "F", label: "Fahrenheit" },
            ]}
          />
        </FieldGroup>

        <FieldGroup
          icon={<MapPin size={12} aria-hidden="true" />}
          label="Region"
          htmlFor={`pref-region-${mode}`}
        >
          <select
            id={`pref-region-${mode}`}
            value={draftRegion ?? ""}
            onChange={(e) => setDraftRegion(e.target.value || null)}
            disabled={regions.length === 0}
            className="w-full border border-outline bg-surface px-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-primary disabled:opacity-60"
          >
            <option value="" disabled>
              {regions.length === 0 ? "Loading…" : "Select a region"}
            </option>
            {regions.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup
          icon={<MapPin size={12} aria-hidden="true" />}
          label="Country"
          htmlFor={`pref-country-${mode}`}
        >
          <select
            id={`pref-country-${mode}`}
            value={draftCountry ?? ""}
            onChange={(e) => setDraftCountry(e.target.value || null)}
            disabled={!draftRegion || availableCountries.length === 0}
            className="w-full border border-outline bg-surface px-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-primary disabled:opacity-60"
          >
            <option value="" disabled>
              {!draftRegion
                ? "Pick a region first"
                : availableCountries.length === 0
                  ? "No countries"
                  : "Select a country"}
            </option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FieldGroup>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isOnboarding && !canSubmit}
            className={cn(
              "flex-1 min-h-10 px-4 text-xs font-bold tracking-widest uppercase border transition-colors",
              isOnboarding && !canSubmit
                ? "border-outline-variant text-secondary cursor-not-allowed"
                : "border-primary bg-primary text-surface hover:bg-primary/90",
            )}
          >
            {isOnboarding ? "Save & continue" : "Save changes"}
          </button>
          {!isOnboarding && (
            <button
              type="button"
              onClick={handleReset}
              className="min-h-10 px-3 text-[10px] font-bold tracking-widest uppercase border border-outline-variant text-secondary hover:border-primary hover:text-primary transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {isOnboarding && (
          <p className="text-[10px] font-mono text-secondary leading-snug">
            Stored locally on this device. Change anytime from the menu.
          </p>
        )}
      </div>
    </>
  );
}

interface FieldGroupProps {
  icon: React.ReactNode;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

function FieldGroup({ icon, label, htmlFor, children }: FieldGroupProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-widest uppercase text-secondary mb-2"
      >
        {icon}
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}

interface SegmentedControlProps<T extends string> {
  id: string;
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}

function SegmentedControl<T extends string>({
  id,
  value,
  onChange,
  options,
}: SegmentedControlProps<T>) {
  return (
    <div
      id={id}
      role="radiogroup"
      className="grid grid-cols-2 border border-outline divide-x divide-outline"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-10 px-3 text-[11px] font-bold tracking-widest uppercase transition-colors",
              active
                ? "bg-primary text-surface"
                : "bg-surface text-on-surface hover:bg-surface-container",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
