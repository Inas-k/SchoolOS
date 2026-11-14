import { useSyncExternalStore } from 'react';
import { buildSeed, STORAGE_KEY } from '../data/seed';

let state = load();
const listeners = new Set();
let storageFull = false;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.version === 1 && s.students?.length) return s;
    }
  } catch {
    /* corrupted or unavailable storage: fall through to a fresh seed */
  }
  return buildSeed();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageFull = false;
  } catch {
    storageFull = true;
  }
}
const emit = () => listeners.forEach((l) => l());

export const getState = () => state;
export const isStorageFull = () => storageFull;
export const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useAppState = () => useSyncExternalStore(subscribe, getState);

/** Apply a change to a deep copy, persist, notify. The draft is validated by the caller before mutating. */
export function mutate(fn) {
  const draft = structuredClone(state);
  const result = fn(draft);
  state = draft;
  persist();
  emit();
  return result;
}
export function replaceState(next) {
  state = next;
  persist();
  emit();
}
export function resetDemo(keepUserId) {
  const fresh = buildSeed();
  fresh.session = { userId: keepUserId || null };
  replaceState(fresh);
}

// Keep tabs in sync (role switching in another tab)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = JSON.parse(e.newValue);
        emit();
      } catch {
        /* ignore */
      }
    }
  });
}
