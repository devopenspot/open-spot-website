"use client"

import Image from "next/image"
import { useEffect, useId, useRef, useState } from "react"
import { Check, Image as ImageIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { getPresetImages } from "@/lib/spots"

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export interface ImageSourceFieldValue {
  imageUrl: string
  file: File | null
}

interface ImageSourceFieldProps {
  value: ImageSourceFieldValue
  onChange: (value: ImageSourceFieldValue) => void
  /** Disable the file input (e.g. in JSON mode). */
  disabled?: boolean
}

/**
 * The visual banner source field. Extracted from the legacy public
 * create-spot form so the admin's create + edit forms share the exact
 * same control. Encapsulates preset / URL / file-upload modes in a
 * single accessible radiogroup.
 */
export function ImageSourceField({
  value,
  onChange,
  disabled = false,
}: ImageSourceFieldProps) {
  const presetImages = getPresetImages()
  const fileId = useId()
  const imageId = useId()
  const previewUrlRef = useRef<string | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<number>(() => {
    const idx = presetImages.findIndex((p) => p.url === value.imageUrl)
    return idx === -1 ? -1 : idx
  })

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const handlePresetPick = (idx: number, url: string) => {
    setSelectedPreset(idx)
    setError(null)
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setFilePreview(null)
    onChange({ imageUrl: url, file: null })
  }

  const handleCustomUrl = (url: string) => {
    setSelectedPreset(-1)
    setError(null)
    onChange({ imageUrl: url, file: value.file })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null
    if (!next) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setFilePreview(null)
      onChange({ imageUrl: value.imageUrl, file: null })
      return
    }
    if (!next.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, or WebP).")
      return
    }
    if (next.size > MAX_UPLOAD_BYTES) {
      setError(
        `Image is too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB).`,
      )
      return
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(next)
    previewUrlRef.current = url
    setFilePreview(url)
    setSelectedPreset(-1)
    setError(null)
    onChange({ imageUrl: value.imageUrl, file: next })
  }

  const handleClearFile = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setFilePreview(null)
    onChange({ imageUrl: value.imageUrl, file: null })
  }

  return (
    <fieldset className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
      <legend className="flex items-center px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
        <ImageIcon size={12} className="mr-1.5" aria-hidden="true" />
        Visual banner source
      </legend>
      <p className="mb-3 text-[10px] text-secondary">
        Choose a preset, paste a custom URL, or upload a photo. Uploaded
        photos are stored privately in Supabase Storage and rendered via a
        1-hour signed URL.
      </p>

      <div
        role="radiogroup"
        aria-label="Preset images"
        className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {presetImages.map((preset, idx) => (
          <button
            key={preset.name}
            type="button"
            role="radio"
            aria-checked={selectedPreset === idx && !filePreview}
            onClick={() => handlePresetPick(idx, preset.url)}
            className={cn(
              "relative h-20 overflow-hidden rounded-lg border-2 transition-all",
              selectedPreset === idx && !filePreview
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
            <span className="absolute bottom-1.5 left-2 right-2 truncate text-center text-[8px] font-bold uppercase tracking-wider text-white">
              {preset.name}
            </span>
            {selectedPreset === idx && !filePreview ? (
              <span
                className="absolute right-1.5 top-1.5 rounded-full bg-primary p-0.5 text-white"
                aria-hidden="true"
              >
                <Check size={8} />
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <label
          htmlFor={fileId}
          className="mb-1 block text-[10px] font-mono font-semibold text-secondary"
        >
          Or upload your own photo
        </label>
        <div className="flex items-center gap-2">
          <label
            htmlFor={fileId}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-on-surface transition-all",
              !disabled && "hover:bg-surface-container",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <Upload size={12} aria-hidden="true" />
            <span>Choose file</span>
          </label>
          <input
            id={fileId}
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            className="sr-only"
          />
          {value.file ? (
            <button
              type="button"
              onClick={handleClearFile}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary hover:text-error"
            >
              <X size={12} aria-hidden="true" />
              <span>Clear</span>
            </button>
          ) : null}
        </div>
        {filePreview ? (
          <div className="mt-3 relative h-32 w-full max-w-sm overflow-hidden rounded-lg border border-outline-variant">
            <Image
              src={filePreview}
              alt="Selected upload preview"
              fill
              sizes="(min-width: 640px) 24rem, 100vw"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={imageId}
          className="mb-1 block text-[10px] font-mono font-semibold text-secondary"
        >
          Or specify custom image URL
        </label>
        <input
          id={imageId}
          type="url"
          placeholder="Paste custom hotlink image URL here..."
          value={value.imageUrl}
          onChange={(e) => handleCustomUrl(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-error/30 bg-error-container/30 px-3 py-2 text-xs text-error"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
