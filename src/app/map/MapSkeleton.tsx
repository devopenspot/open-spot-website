export function MapSkeleton() {
  return (
    <div
      className="flex flex-col lg:flex-row gap-6 pb-24 animate-fade-in h-[calc(100vh-160px)] min-h-[500px]"
      role="status"
      aria-label="Loading map"
    >
      <div className="w-full lg:w-80 h-[300px] lg:h-full rounded-2xl border border-outline-variant bg-surface-bright animate-pulse" />
      <div className="flex-1 rounded-2xl border border-outline-variant bg-surface-container-low animate-pulse" />
    </div>
  );
}
