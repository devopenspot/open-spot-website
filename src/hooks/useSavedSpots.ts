import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'openspot_saved_ids_v1';

function readStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((v): v is string => typeof v === 'string'));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function writeStorage(set: Set<string>): string | null {
  if (typeof window === 'undefined') return null;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Failed to persist saved spots';
  }
}

export function useSavedSpots() {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => readStorage());
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (savedIds.size === 0) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return;
    }
    const err = writeStorage(savedIds);
    setLastError(err);
  }, [savedIds]);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggle = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return {
    savedIds,
    isSaved,
    toggle,
    count: savedIds.size,
    lastError,
  } as const;
}
