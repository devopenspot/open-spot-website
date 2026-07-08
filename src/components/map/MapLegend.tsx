export function MapLegend() {
  return (
    <div
      aria-label="Map marker legend"
      className="bg-surface border-t border-outline-variant px-4 py-2.5 flex flex-wrap gap-4 text-[10px] font-mono justify-center items-center"
    >
      <span className="text-secondary font-bold uppercase">Marker legend:</span>

      <span className="flex items-center space-x-1.5">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 border border-outline bg-surface"
        />
        <span className="text-secondary uppercase">Default</span>
      </span>

      <span className="flex items-center space-x-1.5">
        <span
          aria-hidden="true"
          className="inline-block h-3.5 w-3.5 border border-outline-variant bg-primary"
          style={{ outline: "2px solid var(--color-outline-variant)", outlineOffset: "1px" }}
        />
        <span className="text-on-surface font-semibold uppercase">Active</span>
      </span>

      <span className="flex items-center space-x-1.5">
        <span aria-hidden="true" className="relative inline-block h-2.5 w-2.5 bg-primary">
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 h-1.5 w-1.5 bg-surface"
            style={{ boxShadow: "-1px 1px 0 0 var(--color-outline)" }}
          />
        </span>
        <span className="text-secondary uppercase">Saved</span>
      </span>

      <span className="flex items-center space-x-1.5">
        <span
          aria-hidden="true"
          className="relative inline-block h-2.5 w-2.5 border border-primary"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 m-auto h-1 w-1 bg-primary"
          />
        </span>
        <span className="text-secondary uppercase">You</span>
      </span>
    </div>
  );
}
