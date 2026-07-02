export function MapLegend() {
  return (
    <div
      aria-label="Map marker legend"
      className="bg-surface border-t border-outline-variant px-4 py-2.5 flex flex-wrap gap-4 text-[10px] font-mono justify-center items-center"
    >
      <span className="text-secondary font-bold uppercase">Marker legend:</span>
      <span className="flex items-center space-x-1.5">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-secondary uppercase">Skateable plots</span>
      </span>
      <span className="flex items-center space-x-1.5">
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-surface-container border border-outline"
        />
        <span className="text-secondary uppercase">Unselected obstacle</span>
      </span>
      <span className="flex items-center space-x-1.5">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20"
        />
        <span className="text-on-surface font-semibold uppercase">Active scout</span>
      </span>
    </div>
  );
}