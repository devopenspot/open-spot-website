import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { STORAGE_KEY_VERSION } from '@/lib/constants';
import { showToast } from './useToast';

const STORAGE_KEY = `openspot_saved_ids_${STORAGE_KEY_VERSION}`;
const STORAGE_KEY_LEGACY = 'openspot_saved_ids_v1';

const memoryCache = new Map<string, string | null>();
const listeners = new Set<() => void>();

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

function notify(): void {
  for (const l of listeners) l();
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

let cachedSnapshot: { raw: string | null; set: Set<string> } | null = null;

function getSnapshot(): Set<string> {
  const raw = readStorage();
  if (cachedSnapshot && cachedSnapshot.raw === raw) {
    return cachedSnapshot.set;
  }
  const set = parseSavedIds(raw);
  cachedSnapshot = { raw, set };
  return set;
}

const SERVER_SNAPSHOT: Set<string> = new Set();

function getServerSnapshot(): Set<string> {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      memoryCache.delete(STORAGE_KEY);
      cachedSnapshot = null;
      notify();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useSavedSpots() {
  const lastErrorRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  const savedIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    migrateLegacy();
    if (memoryCache.has(STORAGE_KEY)) {
      memoryCache.delete(STORAGE_KEY);
      cachedSnapshot = null;
      notify();
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const serialized =
      savedIds.size === 0 ? null : JSON.stringify(Array.from(savedIds));
    const err = writeStorage(serialized);
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      showToast(`Saved spots could not be persisted: ${err}`, 'error');
    }
  }, [savedIds]);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(savedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const serialized = next.size === 0 ? null : JSON.stringify(Array.from(next));
      const err = writeStorage(serialized);
      cachedSnapshot = null;
      notify();
      if (err && err !== lastErrorRef.current) {
        lastErrorRef.current = err;
        showToast(`Saved spots could not be persisted: ${err}`, 'error');
      }
    },
    [savedIds],
  );

  return {
    savedIds,
    isSaved,
    toggle,
    count: savedIds.size,
  } as const;
}
