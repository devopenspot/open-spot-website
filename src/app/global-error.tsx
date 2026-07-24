'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { log } from '@/lib/log';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error('GlobalError caught', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background font-sans text-on-background antialiased">
        <div
          role="alert"
          className="min-h-screen flex items-center justify-center p-6"
        >
          <div className="mx-auto my-12 max-w-md rounded-none-none border border-outline-variant bg-surface-bright p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-none-none border border-outline-variant text-error">
              <AlertTriangle size={20} aria-hidden="true" />
            </div>
            <h2 className="font-display text-base font-bold uppercase tracking-wider text-on-surface">
              Critical error
            </h2>
            <p className="mt-2 text-xs text-secondary leading-relaxed">
              A critical error prevented the app from loading. Please try again.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="rounded-none-none bg-on-surface text-surface px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
