// Saved/bookmarked programs — a localStorage list of program slugs, shared
// across islands so the card buttons, the nav count, and the /saved view stay
// in sync. Fully client-side; no backend.
import { atom } from 'nanostores';

const KEY = 'fa_saved';

export const $saved = atom<string[]>([]);

let hydrated = false;
/** Load from localStorage once (idempotent across islands). */
export function initSaved(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) $saved.set(JSON.parse(raw));
  } catch {
    /* storage unavailable */
  }
  // Keep multiple tabs in sync.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) {
        try {
          $saved.set(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          /* ignore */
        }
      }
    });
  }
}

function persist(v: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function toggleSaved(slug: string): void {
  const cur = $saved.get();
  const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug];
  $saved.set(next);
  persist(next);
}

/** Add a slug to the shortlist if it isn't already there (idempotent). */
export function addSaved(slug: string): void {
  const cur = $saved.get();
  if (cur.includes(slug)) return;
  const next = [...cur, slug];
  $saved.set(next);
  persist(next);
}
