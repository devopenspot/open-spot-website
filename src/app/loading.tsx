export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto max-w-7xl px-4 py-8 md:px-8 animate-fade-in"
    >
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-md bg-surface-container animate-pulse" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="rounded-xl border border-outline-variant bg-surface-bright overflow-hidden"
            >
              <div className="h-48 bg-surface-container animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-1/3 rounded bg-surface-container animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-surface-container animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-surface-container animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
