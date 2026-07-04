import { cn } from "@/lib/cn"

interface DataModeNoticeProps {
  isJsonMode: boolean
}

/**
 * Persistent banner shown at the top of every admin page when the runtime
 * is in JSON mode (`SPOTS_DATA_SOURCE=json`). Renders nothing in DB mode.
 *
 * The spec calls for the visual to be a yellow-bordered strip; the design
 * system is strictly monochrome, so we use a high-contrast outlined
 * surface-container instead — same hierarchy, no color.
 */
export function DataModeNotice({ isJsonMode }: DataModeNoticeProps) {
  if (!isJsonMode) return null
  return (
    <div
      role="alert"
      className="border-b-2 border-on-surface bg-surface-container-low px-4 py-2 md:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono uppercase tracking-widest text-on-surface">
        <span className="font-bold">Read-only mode</span>
        <span aria-hidden="true">·</span>
        <span>
          JSON source active. Set{" "}
          <code
            className={cn(
              "rounded bg-surface-container px-1.5 py-0.5",
              "font-mono text-[10px] tracking-normal text-on-surface",
            )}
          >
            SPOTS_DATA_SOURCE=db
          </code>{" "}
          to enable write actions.
        </span>
      </div>
    </div>
  )
}
