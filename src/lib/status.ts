// Recruiting-status model — single source of truth, ported from the original
// index.html / dashboard.html STATUS objects so every view stays in sync.

// Four founder-facing states. "Open" means applications are open (whether the
// intake is rolling or a fixed cohort window). "Coming soon" is a program that's
// been announced but hasn't launched/opened yet. A near deadline still surfaces
// as a derived "Closes in N days" cue (see applyUrgency), not a separate state.
export type StatusKey =
  | 'open'
  | 'coming-soon'
  | 'running'
  | 'closed';

export interface StatusMeta {
  label: string;
  color: string;
}

export const STATUS: Record<StatusKey, StatusMeta> = {
  open: { label: 'Open', color: '#25e0a4' },
  'coming-soon': { label: 'Coming soon', color: '#b388ff' },
  running: { label: 'Running now', color: '#ff6fae' },
  closed: { label: 'Closed', color: '#707a9c' },
};

// Display/sort order (most "act now" first).
export const STATUS_ORDER: StatusKey[] = ['open', 'coming-soon', 'running', 'closed'];

export function statusMeta(key: string): StatusMeta {
  return STATUS[key as StatusKey] ?? { label: key, color: '#999' };
}

/** Short label used on chips/badges. */
export function shortStatusLabel(key: string): string {
  return statusMeta(key).label;
}
