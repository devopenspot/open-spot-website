import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { STORAGE_KEY_VERSION } from '@/lib/constants';
import { showToast } from './useToast';

const STORAGE_KEY_LEGACY = 'openspot_saved_ids_v1';
const DEFAULT_USER_ID = 'dev';

function storageKeyFor(userId: string): string {
  return `openspot_saved_ids_${STORAGE_KEY_VERSION}:${userId}`;
}

type Listener = () => void;
type Entry = { raw: string | null; set: Set<string> };

interface UserStore {
  memoryCache: Map<string, string | null>;
  cachedSnapshot: Entry | null;
  listeners: Set<Listener>;
}

const userStores = new Map<string, UserStore>();

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

function migrateLegacy(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = storageKeyFor(userId);
    if (userId !== DEFAULT_USER_ID) return;
    const legacy = window.localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacy && !window.localStorage.getItem(key)) {
      window.localStorage.setItem(key, legacy);
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

export function useSavedSpots(userId: string = DEFAULT_USER_ID) {
  const lastErrorRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

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

  useEffect(() => {
    migrateLegacy(userId);
    const store = getUserStore(userId);
    const key = storageKeyFor(userId);
    if (store.memoryCache.has(key)) {
      store.memoryCache.delete(key);
      store.cachedSnapshot = null;
      notify(userId);
    }
    hydratedRef.current = true;
  }, [userId]);

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

  // DB sync skeleton — Stage A.7.
  // Once `toggleSavedAction` / `listSavedSpotsAction` land in E.6, this effect will:
  //   1. On mount, if the user is online, list the server's saved spot ids and reconcile local state.
  //   2. On every `savedIds` change (after hydration), fire a Server Action to push the new set to the DB.
  // For now the localStorage write above is the only persistence.
  useEffect(() => {
    // TODO(E.6): wire to Server Actions in src/app/actions/saved-spots.ts.
  }, [userId, savedIds]);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggle = useCallback(
    (id: string) => {
      const store = getUserStore(userId);
      const next = new Set(savedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      const serialized = next.size === 0 ? null : JSON.stringify(Array.from(next));
      const err = writeStorage(userId, serialized);
      store.cachedSnapshot = null;
      notify(userId);
      if (err && err !== lastErrorRef.current) {
        lastErrorRef.current = err;
        showToast(`Saved spots could not be persisted: ${err}`, 'error');
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