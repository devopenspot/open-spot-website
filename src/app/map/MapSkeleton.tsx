import { MAP_VIEWPORT_OFFSET_PX } from '@/lib/constants';

export function MapSkeleton() {
  return (
    <div
      className="flex flex-col lg:flex-row gap-6 pb-24 animate-fade-in min-h-[500px]"
      style={{ height: `calc(100vh - ${MAP_VIEWPORT_OFFSET_PX.MOBILE}px)` }}
      role="status"
      aria-label="Loading map"
    >
      <div className="w-full lg:w-80 h-[300px] lg:h-full rounded-2xl border border-outline-variant bg-surface-bright animate-pulse" />
      <div className="flex-1 rounded-2xl border border-outline-variant bg-surface-container-low animate-pulse" />
    </div>
  );
}
