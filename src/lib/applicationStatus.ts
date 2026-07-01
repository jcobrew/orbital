// Stream 4 — Additive application-status + freshness helpers.
//
// These DERIVE a current application status from `ApplicationWindow` data and
// compute stale-data flags from `lastVerified`. They are ADDITIVE: they do not
// rewrite or replace `src/lib/status.ts` (the legacy recruiting-status model),
// and programs without window/source data are handled gracefully.
//
// ── Precedence rule (windows vs legacy `status`) ─────────────────────────────
// 1. If an ApplicationWindow exists for the program, the COMPUTED window status
//    (open / upcoming / closed / unknown) is authoritative for the *application*
//    status shown to founders. Windows are time-aware and more specific.
// 2. If NO window exists, we fall back to mapping the legacy free-text `status`
//    field to an ApplicationStatus. The legacy `status` field itself is never
//    mutated — it keeps rendering exactly as today wherever it's used.
// 3. If neither yields a confident answer, the status is `unknown` (shown
//    honestly, never hidden).

import type { ApplicationWindow, ProgramWindows } from '../data/applicationWindows';
import type { ProgramProvenance, TrustStatus } from '../data/sources';

/** Derived, founder-facing application status. */
export type ApplicationStatus = 'open' | 'upcoming' | 'closed' | 'unknown';

export interface ApplicationStatusMeta {
  label: string;
  /** Hex color, aligned with the legacy STATUS palette in lib/status.ts. */
  color: string;
}

export const APPLICATION_STATUS_META: Record<ApplicationStatus, ApplicationStatusMeta> = {
  open: { label: 'Applications open', color: '#25e0a4' },
  upcoming: { label: 'Coming soon', color: '#b388ff' },
  closed: { label: 'Applications closed', color: '#707a9c' },
  unknown: { label: 'Status unknown', color: '#9aa3bd' },
};

export function applicationStatusMeta(status: ApplicationStatus): ApplicationStatusMeta {
  return APPLICATION_STATUS_META[status];
}

/** Parse an ISO (YYYY-MM-DD) date to a Date at UTC midnight, or null. */
function parseISODate(value?: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Compute the application status of a single window relative to `now`. */
export function statusForWindow(
  window: ApplicationWindow,
  now: Date = new Date(),
): ApplicationStatus {
  if (window.rolling) return 'open';

  const opens = parseISODate(window.opens);
  const closes = parseISODate(window.closes);

  // No usable dates → unknown.
  if (!opens && !closes) return 'unknown';

  const t = now.getTime();

  // Closed if we are past the close date.
  if (closes && t > closes.getTime()) return 'closed';

  // Upcoming if the open date is still in the future.
  if (opens && t < opens.getTime()) return 'upcoming';

  // Otherwise we are at/after open (or open is unknown) and at/before close
  // (or close is unknown) → open.
  return 'open';
}

/**
 * Pick the most "act now" status across a program's windows.
 * Priority: open > upcoming > closed > unknown.
 */
export function statusFromWindows(
  programWindows: ProgramWindows | undefined,
  now: Date = new Date(),
): ApplicationStatus {
  if (!programWindows || programWindows.windows.length === 0) return 'unknown';
  const statuses = programWindows.windows.map((w) => statusForWindow(w, now));
  const priority: ApplicationStatus[] = ['open', 'upcoming', 'closed', 'unknown'];
  for (const s of priority) {
    if (statuses.includes(s)) return s;
  }
  return 'unknown';
}

/**
 * Map the legacy free-text `status` field to an ApplicationStatus. Used only as
 * a fallback when no ApplicationWindow exists. The legacy field is read, never
 * written. Unrecognized values → unknown.
 */
export function statusFromLegacy(legacyStatus?: string | null): ApplicationStatus {
  switch ((legacyStatus ?? '').trim().toLowerCase()) {
    // `rolling` / `closing-soon` are retired aliases kept for old links + data.
    case 'open':
    case 'rolling':
    case 'closing-soon':
      return 'open';
    case 'coming-soon':
    case 'opening-soon':
      return 'upcoming';
    case 'closed':
      return 'closed';
    // "running" = cohort in session; applications not the focus → unknown.
    case 'running':
      return 'unknown';
    default:
      return 'unknown';
  }
}

/** Where a resolved application status came from. */
export type ApplicationStatusSource = 'window' | 'legacy' | 'none';

export interface ResolvedApplicationStatus {
  status: ApplicationStatus;
  source: ApplicationStatusSource;
}

/**
 * Resolve the displayed application status using the documented precedence:
 * window (if present) overrides legacy `status`; otherwise legacy maps in.
 */
export function resolveApplicationStatus(
  args: { legacyStatus?: string | null; windows?: ProgramWindows },
  now: Date = new Date(),
): ResolvedApplicationStatus {
  if (args.windows && args.windows.windows.length > 0) {
    return { status: statusFromWindows(args.windows, now), source: 'window' };
  }
  if (args.legacyStatus != null && args.legacyStatus !== '') {
    return { status: statusFromLegacy(args.legacyStatus), source: 'legacy' };
  }
  return { status: 'unknown', source: 'none' };
}

// ── Stale-data (freshness) computation ───────────────────────────────────────

/** Default age (days) after which a record is considered stale. */
export const STALE_AFTER_DAYS = 90;

export interface StaleInfo {
  /** True when lastVerified is older than the threshold. */
  isStale: boolean;
  /** Whole days since lastVerified, or null when no/invalid date. */
  ageDays: number | null;
  /** True when there is no usable lastVerified date at all. */
  unknown: boolean;
}

/** Compute staleness from a `lastVerified` ISO date. */
export function computeStale(
  lastVerified?: string | null,
  now: Date = new Date(),
  staleAfterDays: number = STALE_AFTER_DAYS,
): StaleInfo {
  const d = parseISODate(lastVerified);
  if (!d) return { isStale: false, ageDays: null, unknown: true };
  const ageDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  return { isStale: ageDays > staleAfterDays, ageDays, unknown: false };
}

// ── Trust summary ────────────────────────────────────────────────────────────

/** Priority for picking the strongest trust level across sources. */
const TRUST_PRIORITY: TrustStatus[] = ['trusted', 'reported', 'unverified', 'sample'];

export interface TrustSummary {
  /** Strongest trust level across the program's sources, or undefined. */
  best?: TrustStatus;
  /** Number of real (non-sample) sources. */
  realSourceCount: number;
  /** True when every source is a sample placeholder. */
  sampleOnly: boolean;
}

/** Summarize the provenance/trust for a program. */
export function summarizeTrust(provenance?: ProgramProvenance): TrustSummary {
  const sources = provenance?.sources ?? [];
  if (sources.length === 0) {
    return { best: undefined, realSourceCount: 0, sampleOnly: false };
  }
  const realSourceCount = sources.filter((s) => s.trust !== 'sample').length;
  let best: TrustStatus | undefined;
  for (const level of TRUST_PRIORITY) {
    if (sources.some((s) => s.trust === level)) {
      best = level;
      break;
    }
  }
  return { best, realSourceCount, sampleOnly: realSourceCount === 0 };
}
