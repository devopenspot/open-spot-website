"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Image as ImageIcon, Tag, Plus } from "lucide-react";
import { getPresetImages, getTerrainOptions } from "@/lib/spots";
import { showToast } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import { CROWD_LEVEL } from "@/lib/constants";
import type { SpotType } from "@/lib/types";
import { REFERENCE_LAT, REFERENCE_LON } from "@/lib/spots/geo";
import { createSpotAction } from "@/app/actions/spots";

export default function PostTab() {
  const router = useRouter();
  const presetImages = getPresetImages();
  const terrainOptions = getTerrainOptions();
  const [isPending, startTransition] = useTransition();

  const nameId = useId();
  const typeId = useId();
  const cityId = useId();
  const addressId = useId();
  const imageId = useId();
  const crowdId = useId();
  const crowdHelpId = useId();
  const featuresId = useId();
  const noteId = useId();
  const errorId = useId();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<SpotType>("Plaza");
  const [imageUrl, setImageUrl] = useState<string>(presetImages[0].url);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [communityNote, setCommunityNote] = useState("");
  const [featuresInput, setFeaturesInput] = useState("");
  const [featuresList, setFeaturesList] = useState<string[]>([
    "Transition",
    "Smooth Concrete",
  ]);
  const [crowdLevel, setCrowdLevel] = useState<number>(35);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddFeature = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = featuresInput.trim();
    if (trimmed && !featuresList.includes(trimmed)) {
      setFeaturesList((prev) => [...prev, trimmed]);
      setFeaturesInput("");
    }
  };

  const handleRemoveFeature = (f: string) => {
    setFeaturesList((prev) => prev.filter((item) => item !== f));
  };

  const handlePresetPick = (idx: number, url: string) => {
    setSelectedPreset(idx);
    setImageUrl(url);
  };

  const handleCustomUrl = (url: string) => {
    setSelectedPreset(-1);
    setImageUrl(url);
  };

  const reset = () => {
    setName("");
    setCity("");
    setAddress("");
    setType("Plaza");
    setCommunityNote("");
    setFeaturesList(["Transition", "Smooth Concrete"]);
    setFormError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !city || !address) {
      setFormError(
        "Please fill in the required fields: Name, City, and Address.",
      );
      return;
    }
    setFormError(null);

    const crowdLevelLabel =
      crowdLevel > CROWD_LEVEL.HIGH_MIN
        ? "High (Busy)"
        : crowdLevel > CROWD_LEVEL.LOW_MAX
          ? "Moderate Activity"
          : "Low Crowd (Ideal)";

    const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    startTransition(async () => {
      try {
        await createSpotAction({
          name,
          city,
          citySlug,
          address,
          type,
          features: featuresList,
          image: imageUrl,
          communityNote:
            communityNote ||
            "Contributed by community scout. Bring your setup and session on! — @anonymous_rider",
          crowdLevel,
          crowdLevelLabel,
          country: "",
          location: { lat: REFERENCE_LAT, lon: REFERENCE_LON },
          createdBy: "dev",
        });
        showToast("Spot registered successfully", "success");
        setIsSubmitted(true);
      } catch {
        showToast("Could not register spot. Try again.", "error");
        setFormError("Something went wrong while registering your spot.");
      }
    });
  };

  if (isSubmitted) {
    return (
      <section
        id="post-success-panel"
        role="status"
        aria-live="polite"
        className="max-w-md mx-auto py-16 text-center animate-fade-in"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-6">
          <Check
            size={28}
            className="text-primary animate-pulse"
            aria-hidden="true"
          />
        </div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-widest text-on-surface">
          Spot registered
        </h2>
        <p className="mt-2 text-xs text-secondary leading-relaxed">
          Your street coordinates and terrain specifications have been cataloged
          on the master map! Skaters can now scout this location live.
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              reset();
            }}
            className="w-full bg-on-surface text-surface py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
          >
            Post another plot
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full border border-outline text-on-surface py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
          >
            Return to directory
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="post-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-post"
      className="max-w-3xl mx-auto pb-24 animate-fade-in"
    >
      <header className="border-b border-outline-variant pb-5 mb-8">
        <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase block mb-1">
          Contribute to cartography
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
          Register new obstacle
        </h1>
        <p className="mt-1.5 text-xs text-secondary leading-relaxed">
          Map your local ledges, stairs, DIYs, or pools. Provide accurate
          metadata to help fellow skaters coordinate sessions safely.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor={nameId}
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5"
            >
              Spot name <span aria-hidden="true">*</span>
            </label>
            <input
              id={nameId}
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(formError) && !name}
              placeholder="e.g. The White Marble Nine"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={typeId}
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5"
            >
              Terrain type <span aria-hidden="true">*</span>
            </label>
            <select
              id={typeId}
              required
              value={type}
              onChange={(e) => setType(e.target.value as SpotType)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            >
              {terrainOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor={cityId}
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5"
            >
              City <span aria-hidden="true">*</span>
            </label>
            <input
              id={cityId}
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(formError) && !city}
              placeholder="e.g. Los Angeles, CA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={addressId}
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5"
            >
              Exact address <span aria-hidden="true">*</span>
            </label>
            <input
              id={addressId}
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(formError) && !address}
              placeholder="e.g. Hope Street Corporate Row, L.A."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>
        </div>

        <fieldset className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center">
            <ImageIcon size={12} className="mr-1.5" aria-hidden="true" />
            Visual banner source
          </legend>
          <p className="text-[10px] text-secondary mb-3">
            Choose a preset or submit a URL.
          </p>

          <div
            role="radiogroup"
            aria-label="Preset images"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4"
          >
            {presetImages.map((preset, idx) => (
              <button
                key={preset.name}
                type="button"
                role="radio"
                aria-checked={selectedPreset === idx}
                onClick={() => handlePresetPick(idx, preset.url)}
                className={cn(
                  "relative h-20 rounded-lg overflow-hidden border-2 transition-all",
                  selectedPreset === idx
                    ? "border-primary ring-2 ring-primary/10"
                    : "border-transparent",
                )}
              >
                <Image
                  src={preset.url}
                  alt={preset.name}
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="object-cover grayscale"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
                <div
                  className="absolute inset-0 bg-black/40"
                  aria-hidden="true"
                />
                <span className="absolute bottom-1.5 left-2 right-2 text-[8px] font-bold uppercase tracking-wider text-white text-center truncate">
                  {preset.name}
                </span>
                {selectedPreset === idx && (
                  <span
                    className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5 text-white"
                    aria-hidden="true"
                  >
                    <Check size={8} />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div>
            <label
              htmlFor={imageId}
              className="block text-[10px] text-secondary font-semibold font-mono mb-1"
            >
              Or specify custom image URL
            </label>
            <input
              id={imageId}
              type="url"
              placeholder="Paste custom hotlink image URL here..."
              value={imageUrl}
              onChange={(e) => handleCustomUrl(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
            />
          </div>
        </fieldset>

        <div>
          <label
            htmlFor={crowdId}
            className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5"
          >
            Crowd approximation{" "}
            <span aria-hidden="true">({crowdLevel}% occupancy)</span>
          </label>
          <input
            id={crowdId}
            type="range"
            min={0}
            max={100}
            value={crowdLevel}
            onChange={(e) => setCrowdLevel(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={crowdLevel}
            aria-valuetext={`${crowdLevel} percent occupied`}
            aria-describedby={crowdHelpId}
            className="w-full accent-primary bg-outline-variant h-1 rounded-full appearance-none cursor-pointer"
          />
          <div
            id={crowdHelpId}
            className="flex justify-between text-[9px] font-mono text-secondary mt-1"
            aria-hidden="true"
          >
            <span>0% (empty)</span>
            <span>50% (moderate)</span>
            <span>100% (prime time)</span>
          </div>
        </div>

        <fieldset className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center">
            <Tag size={12} className="mr-1.5" aria-hidden="true" />
            Obstacle specifications / features
          </legend>

          <div className="flex space-x-2 mb-3">
            <label htmlFor={featuresId} className="visually-hidden">
              Add feature tag
            </label>
            <input
              id={featuresId}
              type="text"
              placeholder="Add tag (e.g. Red Curb, Slappy, Waxed)"
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddFeature(e as unknown as FormEvent);
                }
              }}
              className="flex-1 rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:border-outline"
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="bg-on-surface text-surface px-4 rounded-lg text-xs font-bold tracking-wider uppercase hover:bg-on-surface/90 transition-all flex items-center space-x-1"
            >
              <Plus size={12} aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>

          <ul className="flex flex-wrap gap-1.5" aria-label="Selected features">
            {featuresList.map((tag) => (
              <li
                key={tag}
                className="inline-flex items-center rounded-full bg-surface-container-high border border-outline-variant/60 px-3 py-1 text-[10px] font-semibold text-on-surface"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(tag)}
                  aria-label={`Remove ${tag}`}
                  className="ml-1.5 text-secondary hover:text-error font-bold text-xs"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        <div>
          <label
            htmlFor={noteId}
            className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5"
          >
            Community intel / local notes
          </label>
          <textarea
            id={noteId}
            rows={3}
            placeholder="Describe runway smoothness, security timing, wax needs, lighting, etc..."
            value={communityNote}
            onChange={(e) => setCommunityNote(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>

        {formError && (
          <p
            id={errorId}
            role="alert"
            className="rounded-lg border border-error/30 bg-error-container/30 px-4 py-2 text-xs text-error"
          >
            {formError}
          </p>
        )}

        <div className="border-t border-outline-variant pt-5 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-3 rounded-lg bg-on-surface text-surface text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Registering…" : "Register Spot"}
          </button>
        </div>
      </form>
    </section>
  );
}
