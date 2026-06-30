// Personal application tracker — per-program stage + private note, keyed by
// program slug. Stored only in localStorage (no backend), shared across islands
// like the saved store. Kept SEPARATE from $saved (a plain slug list) so the
// existing saved data needs no migration; setting any tracking info also ensures
// the program is in the saved shortlist so it surfaces on /saved.
import { atom } from 'nanostores';
import { addSaved, initSaved } from './saved';
import { isTrackStage, type TrackStage } from '../lib/tracker';

const KEY = 'fa_tracker';

export interface TrackEntry {
  stage: TrackStage;
  note?: string;
  /** ISO timestamp of the last change (handy for future sorting). */
  updatedAt: string;
}

export type TrackerMap = Record<string, TrackEntry>;

export const $tracker = atom<TrackerMap>({});

/** Drop malformed entries when hydrating untrusted localStorage JSON. */
function sanitize(raw: unknown): TrackerMap {
  if (!raw || typeof raw !== 'object') return {};
  const out: TrackerMap = {};
  for (const [slug, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const e = v as Record<string, unknown>;
    if (!isTrackStage(e.stage)) continue;
    out[slug] = {
      stage: e.stage,
      note: typeof e.note === 'string' ? e.note : undefined,
      updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : new Date().toISOString(),
    };
  }
  return out;
}

let hydrated = false;
/** Load from localStorage once (idempotent across islands); keep tabs in sync. */
export function initTracker(): void {
  if (hydrated) return;
  hydrated = true;
  // Tracking implies saving, and setStage/setNote mutate $saved — make sure the
  // saved store is hydrated from localStorage first so we never overwrite it with
  // a truncated in-memory list.
  initSaved();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) $tracker.set(sanitize(JSON.parse(raw)));
  } catch {
    /* storage unavailable */
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) {
        try {
          $tracker.set(e.newValue ? sanitize(JSON.parse(e.newValue)) : {});
        } catch {
          /* ignore */
        }
      }
    });
  }
}

function persist(v: TrackerMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

function write(slug: string, patch: Partial<TrackEntry>): void {
  // Tracking implies saving — keep the program on the /saved shortlist.
  addSaved(slug);
  const cur = $tracker.get();
  const existing = cur[slug];
  const next: TrackerMap = {
    ...cur,
    [slug]: {
      stage: patch.stage ?? existing?.stage ?? 'interested',
      note: patch.note !== undefined ? patch.note : existing?.note,
      updatedAt: new Date().toISOString(),
    },
  };
  $tracker.set(next);
  persist(next);
}

/** Set (or change) the application stage for a program. */
export function setStage(slug: string, stage: TrackStage): void {
  write(slug, { stage });
}

/** Set the private note for a program (empty string clears the text). */
export function setNote(slug: string, note: string): void {
  write(slug, { note });
}

/** Forget all tracking for a program (does not unsave it). */
export function clearTrack(slug: string): void {
  const cur = $tracker.get();
  if (!(slug in cur)) return;
  const next = { ...cur };
  delete next[slug];
  $tracker.set(next);
  persist(next);
}
