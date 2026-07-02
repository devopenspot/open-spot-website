import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { STORAGE_KEY_VERSION } from '@/lib/constants';
import { showToast } from './useToast';
import { toggleSavedAction } from '@/app/actions/saved-spots';
import type { SavedSpot } from '@/types/saved-spot';
import { useInitialSavedSpots } from '@/lib/saved-spots-context';

const STORAGE_KEY_LEGACY = 'openspot_saved_ids_v1';
const DEFAULT_USER_ID = 'dev';

type Listener = () => void;
type Entry = { raw: string | null; set: Set<string> };

interface UserStore {
  memoryCache: Map<string, string | null>;
  cachedSnapshot: Entry | null;
  listeners: Set<Listener>;
}

const userStores = new Map<string, UserStore>();

function storageKeyFor(userId: string): string {
  return `openspot_saved_ids_${STORAGE_KEY_VERSION}:${userId}`;
}

function getUserStore(userId: string): UserStore {
  let store = userStores.get(userId);
  if (!store) {
    store = { memoryCache: new Map(), cachedSnapshot: null, listeners: new Set() };
    userStores.set(userId, store);
  }
  return store;
}

function readStorage(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  const store = getUserStore(userId);
  const key = storageKeyFor(userId);
  if (store.memoryCache.has(key)) {
    return store.memoryCache.get(key) ?? null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    store.memoryCache.set(key, raw);
    return raw;
  } catch {
    store.memoryCache.set(key, null);
    return null;
  }
}

function writeStorage(userId: string, value: string | null): string | null {
  if (typeof window === 'undefined') return null;
  const store = getUserStore(userId);
  const key = storageKeyFor(userId);
  store.memoryCache.set(key, value);
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Failed to persist saved spots';
  }
}

function notify(userId: string): void {
  const store = getUserStore(userId);
  for (const l of store.listeners) l();
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

function getSnapshot(userId: string): Set<string> {
  const store = getUserStore(userId);
  const raw = readStorage(userId);
  if (store.cachedSnapshot && store.cachedSnapshot.raw === raw) {
    return store.cachedSnapshot.set;
  }
  const set = parseSavedIds(raw);
  store.cachedSnapshot = { raw, set };
  return set;
}

const SERVER_SNAPSHOT: Set<string> = new Set();

function getServerSnapshot(): Set<string> {
  return SERVER_SNAPSHOT;
}

function subscribe(userId: string, listener: Listener): () => void {
  if (typeof window === 'undefined') return () => {};
  const store = getUserStore(userId);
  store.listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    const key = storageKeyFor(userId);
    if (e.key === key || e.key === null) {
      store.memoryCache.delete(key);
      store.cachedSnapshot = null;
      notify(userId);
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    store.listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function __resetUserStoresForTests(): void {
  userStores.clear();
}

export function __migrateLegacyForTests(userId: string = DEFAULT_USER_ID): void {
  migrateLegacy(userId);
}

export function useSavedSpots(
  userId: string = DEFAULT_USER_ID,
  initialServerSavedSpotsArg?: readonly SavedSpot[],
) {
  const contextInitial = useInitialSavedSpots()
  const initialServerSavedSpots =
    initialServerSavedSpotsArg ?? (contextInitial.length > 0 ? contextInitial : undefined)
  const lastErrorRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const isServerHydratedRef = useRef(Boolean(initialServerSavedSpots))

  const subscribeBound = useCallback(
    (listener: Listener) => subscribe(userId, listener),
    [userId],
  );
  const getSnapshotBound = useCallback(
    () => getSnapshot(userId),
    [userId],
  );

  const savedIds = useSyncExternalStore(
    subscribeBound,
    getSnapshotBound,
    getServerSnapshot,
  );

  // Hydration: clear the in-memory cache so the next getSnapshot re-reads
  // localStorage. Also seed from the server-fed list on first mount so
  // the UI is correct without a fetch.
  useEffect(() => {
    migrateLegacy(userId);
    const store = getUserStore(userId);
    const key = storageKeyFor(userId);
    if (isServerHydratedRef.current && initialServerSavedSpots) {
      const ids = initialServerSavedSpots.map((s) => s.spotId)
      const serialized = ids.length === 0 ? null : JSON.stringify(ids)
      writeStorage(userId, serialized)
      store.memoryCache.set(key, serialized)
      store.cachedSnapshot = null
      notify(userId)
    } else if (store.memoryCache.has(key)) {
      store.memoryCache.delete(key)
      store.cachedSnapshot = null
      notify(userId)
    }
    hydratedRef.current = true
  }, [userId, initialServerSavedSpots])

  // Persist localStorage on every change (after hydration).
  useEffect(() => {
    if (!hydratedRef.current) return;
    const serialized =
      savedIds.size === 0 ? null : JSON.stringify(Array.from(savedIds));
    const err = writeStorage(userId, serialized);
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      showToast(`Saved spots could not be persisted: ${err}`, 'error');
    }
  }, [userId, savedIds]);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggle = useCallback(
    async (id: string) => {
      const store = getUserStore(userId)
      const next = new Set(savedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      const serialized = next.size === 0 ? null : JSON.stringify(Array.from(next))
      writeStorage(userId, serialized)
      store.cachedSnapshot = null
      notify(userId)

      // Push to the server. On failure, roll back + toast.
      try {
        await toggleSavedAction(id)
      } catch (err) {
        const prevSerialized =
          savedIds.size === 0 ? null : JSON.stringify(Array.from(savedIds))
        writeStorage(userId, prevSerialized)
        store.cachedSnapshot = null
        notify(userId)
        const msg = err instanceof Error ? err.message : 'Toggle failed'
        showToast(`Could not sync saved spot: ${msg}`, 'error')
      }
    },
    [userId, savedIds],
  );

  return {
    savedIds,
    isSaved,
    toggle,
    count: savedIds.size,
  } as const;
}

function migrateLegacy(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = storageKeyFor(userId);
    const isDefault = userId === DEFAULT_USER_ID;
    if (isDefault) {
      const legacy = window.localStorage.getItem(STORAGE_KEY_LEGACY);
      if (legacy && !window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, legacy);
      }
    }
    window.localStorage.removeItem(STORAGE_KEY_LEGACY);
  } catch {
    // ignore
  }
}