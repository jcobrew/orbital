// Cross-island filter state. Astro islands are isolated, so the map/globe and
// the sidebar share state through this nanostore rather than props. The store
// also stays in sync with the URL query string — the deep-link contract that
// agents and humans use (e.g. /dashboard?dataset=all&country=USA&status=open).

import { atom } from 'nanostores';
import { EMPTY_FILTERS, type Filters } from '../lib/filter';
import { STATUS } from '../lib/status';

export const $filters = atom<Filters>({ ...EMPTY_FILTERS });

const DATASETS = ['all', 'residential', 'traditional'] as const;

/** Parse the current location.search into a Filters object. */
export function filtersFromURL(search = window.location.search): Filters {
  const u = new URLSearchParams(search);
  const ds = u.get('dataset');
  const status = u.get('status');
  return {
    dataset: (DATASETS as readonly string[]).includes(ds ?? '')
      ? (ds as Filters['dataset'])
      : 'all',
    q: u.get('q') ?? '',
    type: u.get('type') ?? '',
    country: u.get('country') ?? '',
    status: status && status in STATUS ? status : '',
    focus: u.get('focus') ?? '',
    format: u.get('format') ?? '',
    stage: u.get('stage') ?? '',
    sector: u.get('sector') ?? '',
    housing: u.get('housing') ?? '',
  };
}

/** Serialize filters back into a query string (omitting defaults). */
export function filtersToQuery(f: Filters): string {
  const u = new URLSearchParams();
  if (f.dataset !== 'all') u.set('dataset', f.dataset);
  if (f.q) u.set('q', f.q);
  if (f.type) u.set('type', f.type);
  if (f.country) u.set('country', f.country);
  if (f.status) u.set('status', f.status);
  if (f.focus) u.set('focus', f.focus);
  if (f.format) u.set('format', f.format);
  if (f.stage) u.set('stage', f.stage);
  if (f.sector) u.set('sector', f.sector);
  if (f.housing) u.set('housing', f.housing);
  return u.toString();
}

/** Hydrate the store from the URL — runs once even if several islands call it. */
let initialized = false;
export function initFiltersFromURL(): void {
  if (initialized) return;
  initialized = true;
  $filters.set(filtersFromURL());
}

/** Merge a partial update into the store and reflect it in the URL. */
export function setFilters(patch: Partial<Filters>): void {
  const next = { ...$filters.get(), ...patch };
  $filters.set(next);
  const qs = filtersToQuery(next);
  history.replaceState(null, '', qs ? location.pathname + '?' + qs : location.pathname);
}
