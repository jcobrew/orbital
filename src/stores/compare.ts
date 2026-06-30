// Compare selection — the set of program slugs the user is weighing side-by-side.
// Independent of the saved shortlist. Persisted to localStorage (and synced across
// tabs) so a selection survives navigation and reloads — Orbital is an MPA, so
// every click is a full page load. Capped so the side-by-side table stays legible.
// "Clear" empties it.
import { atom } from 'nanostores';

const KEY = 'fa_compare';

/** Max programs that can be compared at once (keeps the table readable). */
export const COMPARE_MAX = 4;

export const $compare = atom<string[]>([]);

/** Whether the side-by-side compare drawer is open (tray opens it; drawer reads it). */
export const $compareOpen = atom<boolean>(false);
export function openCompare(): void {
  $compareOpen.set(true);
}
export function closeCompare(): void {
  $compareOpen.set(false);
}

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

function persist(v: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

let hydrated = false;
/** Load from localStorage once (idempotent across islands); keep tabs in sync. */
export function initCompare(): void {
  if (hydrated) return;
  hydrated = true;
  $compare.set(read());
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) $compare.set(read());
    });
  }
}

/** Can this slug still be added? (already-selected always returns true). */
export function canAddCompare(slug: string): boolean {
  const cur = $compare.get();
  return cur.includes(slug) || cur.length < COMPARE_MAX;
}

/** Add/remove a slug. Adds are ignored once the cap is reached. */
export function toggleCompare(slug: string): void {
  const cur = $compare.get();
  let next: string[];
  if (cur.includes(slug)) {
    next = cur.filter((s) => s !== slug);
  } else {
    if (cur.length >= COMPARE_MAX) return;
    next = [...cur, slug];
  }
  $compare.set(next);
  persist(next);
}

export function removeCompare(slug: string): void {
  const cur = $compare.get();
  if (!cur.includes(slug)) return;
  const next = cur.filter((s) => s !== slug);
  $compare.set(next);
  persist(next);
}

export function clearCompare(): void {
  $compare.set([]);
  persist([]);
}
