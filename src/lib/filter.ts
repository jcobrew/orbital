// Filtering + sorting — ported from the legacy passes()/sort logic so the map,
// globe and dashboard all agree on what a given filter set returns.

import type { Program } from '../data/programs';
import { programSectors } from '../data/sectors';
import { STATUS_ORDER, type StatusKey } from './status';

export interface Filters {
  /** Free-text search across name, city, country, focus, operator. */
  q: string;
  /** Recruiting status (rolling, open, closing-soon, …) or '' for any. */
  status: string;
  /** Selected sector ids (see data/sectors.ts), OR-matched. Empty = any. */
  sector: string[];
  /** Selected countries, OR-matched. Empty array = no country constraint. */
  country: string[];
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  status: '',
  sector: [],
  country: [],
};

/** Sector + country + status + free-text search. */
export function passes(p: Program, f: Filters): boolean {
  const q = f.q.trim().toLowerCase();
  const hay = (p.name + p.city + p.country + p.focus + p.operator + p.type).toLowerCase();
  return (
    (!q || hay.includes(q)) &&
    (!f.sector.length || programSectors(p).some((s) => f.sector.includes(s))) &&
    (!f.country.length || f.country.includes(p.country)) &&
    (!f.status || p.status === f.status)
  );
}

export type SortKey = keyof Program;

export function sortPrograms(list: Program[], sort: SortKey, dir: 1 | -1): Program[] {
  return [...list].sort((a, b) => {
    let av: number | string;
    let bv: number | string;
    if (sort === 'status') {
      av = STATUS_ORDER.indexOf(a.status as StatusKey);
      bv = STATUS_ORDER.indexOf(b.status as StatusKey);
    } else {
      av = String(a[sort] ?? '').toLowerCase();
      bv = String(b[sort] ?? '').toLowerCase();
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return a.name.localeCompare(b.name);
  });
}

/** Default ordering used by the legacy list: status order, then name. */
export function defaultSort(list: Program[]): Program[] {
  return sortPrograms(list, 'status', 1);
}
