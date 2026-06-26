import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'openspot_saved_ids_v2';
const STORAGE_KEY_LEGACY = 'openspot_saved_ids_v1';

const memoryCache = new Map<string, string | null>();

function readStorage(): string | null {
  if (typeof window === 'undefined') return null;
  if (memoryCache.has(STORAGE_KEY)) {
    return memoryCache.get(STORAGE_KEY) ?? null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    memoryCache.set(STORAGE_KEY, raw);
    return raw;
  } catch {
    memoryCache.set(STORAGE_KEY, null);
    return null;
  }
}

function writeStorage(value: string | null): string | null {
  if (typeof window === 'undefined') return null;
  memoryCache.set(STORAGE_KEY, value);
  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Failed to persist saved spots';
  }
}

function migrateLegacy(): void {
  if (typeof window === 'undefined') return;
  try {
    const legacy = window.localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacy && !window.localStorage.getItem(STORAGE_KEY)) {
      window.localStorage.setItem(STORAGE_KEY, legacy);
    }
    window.localStorage.removeItem(STORAGE_KEY_LEGACY);
  } catch {
    // ignore
  }
}

function parseSavedIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((v): v is string => typeof v === 'string'));
    }
  } catch {
    // fall through
  }
  return new Set();
}

export function useSavedSpots() {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    migrateLegacy();
    return parseSavedIds(readStorage());
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (savedIds.size === 0) {
      const err = writeStorage(null);
      if (err && err !== lastErrorRef.current) {
        lastErrorRef.current = err;
        setLastError(err);
      }
      return;
    }
    const err = writeStorage(JSON.stringify(Array.from(savedIds)));
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      setLastError(err);
    }
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
