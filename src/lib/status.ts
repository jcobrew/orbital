// Recruiting-status model — single source of truth, ported from the original
// index.html / dashboard.html STATUS objects so every view stays in sync.

export type StatusKey =
  | 'rolling'
  | 'open'
  | 'closing-soon'
  | 'opening-soon'
  | 'running'
  | 'closed';

export interface StatusMeta {
  label: string;
  color: string;
}

export const STATUS: Record<StatusKey, StatusMeta> = {
  rolling: { label: 'Rolling / always open', color: '#25e0a4' },
  open: { label: 'Cohort open', color: '#4f9dff' },
  'closing-soon': { label: 'Closing soon', color: '#ffc24b' },
  'opening-soon': { label: 'Opening soon', color: '#b388ff' },
  running: { label: 'Running now', color: '#ff6fae' },
  closed: { label: 'Closed — check next cycle', color: '#707a9c' },
};

// Display/sort order (most "act now" first), matching the legacy views.
export const STATUS_ORDER: StatusKey[] = [
  'running',
  'open',
  'closing-soon',
  'opening-soon',
  'rolling',
  'closed',
];

export function statusMeta(key: string): StatusMeta {
  return STATUS[key as StatusKey] ?? { label: key, color: '#999' };
}

/** Short label used on chips/badges (drops the "— check next cycle" tail). */
export function shortStatusLabel(key: string): string {
  return statusMeta(key).label.replace(' — check next cycle', '');
}
