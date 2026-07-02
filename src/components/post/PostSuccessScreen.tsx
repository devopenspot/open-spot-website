"use client";

import { Check } from "lucide-react";

interface PostSuccessScreenProps {
  onPostAnother: () => void;
  onReturnToDirectory: () => void;
}

export function PostSuccessScreen({
  onPostAnother,
  onReturnToDirectory,
}: PostSuccessScreenProps) {
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
          onClick={onPostAnother}
          className="w-full bg-on-surface text-surface py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
        >
          Post another plot
        </button>

        <button
          type="button"
          onClick={onReturnToDirectory}
          className="w-full border border-outline text-on-surface py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
        >
          Return to directory
        </button>
      </div>
    </section>
  );
}