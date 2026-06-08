// Filtering + sorting — ported from the legacy passes()/sort logic so the map,
// globe and dashboard all agree on what a given filter set returns.

import type { Program } from '../data/programs';
import { STATUS_ORDER, type StatusKey } from './status';

export interface Filters {
  dataset: 'all' | 'residential' | 'traditional';
  q: string;
  type: string;
  country: string;
  status: string;
  focus: string;
}

export const EMPTY_FILTERS: Filters = {
  dataset: 'all',
  q: '',
  type: '',
  country: '',
  status: '',
  focus: '',
};

/** Mirrors the original index.html passes() predicate, plus a focus filter. */
export function passes(p: Program, f: Filters): boolean {
  const q = f.q.trim().toLowerCase();
  const hay = (p.name + p.city + p.country + p.focus + p.operator + p.type).toLowerCase();
  return (
    (!q || hay.includes(q)) &&
    (f.dataset === 'all' || p.dataset === f.dataset) &&
    (!f.type || p.type === f.type) &&
    (!f.country || p.country === f.country) &&
    (!f.status || p.status === f.status) &&
    (!f.focus || (p.focus || '').toLowerCase().includes(f.focus.trim().toLowerCase()))
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
