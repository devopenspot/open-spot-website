export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto max-w-7xl py-8 animate-fade-in"
    >
      <div className="h-screen w-full bg-surface-container animate-pulse" />
    </div>
  );
}
