const SAMPLE_GLYPH =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" ' +
  'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="4"/>' +
  '<path d="M12 2v2"/><path d="M12 20v2"/>' +
  '<path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>' +
  '<path d="M2 12h2"/><path d="M20 12h2"/>' +
  '<path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/>' +
  "</svg>";

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
          className="inline-flex h-3.5 w-3.5 border border-outline bg-surface items-center justify-center text-on-surface"
        >
          <span
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: SAMPLE_GLYPH }}
          />
        </span>
        <span className="text-secondary uppercase">Weather</span>
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
