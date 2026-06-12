import { statusMeta, shortStatusLabel } from '../lib/status';
import {
  applicationStatusMeta,
  type ApplicationStatus,
} from '../lib/applicationStatus';

interface Props {
  status: string;
  /** Use the full label (with "— check next cycle") instead of the short one. */
  full?: boolean;
}

export default function StatusBadge({ status, full = false }: Props) {
  const s = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ background: s.color, color: '#0a0a0a' }}
      title={s.label}
    >
      {full ? s.label : shortStatusLabel(status)}
    </span>
  );
}

// ── Stream 4 additive variants ───────────────────────────────────────────────
// New, opt-in badges for the derived application status and stale-data flag.
// Existing StatusBadge usages/props are untouched.

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  /** Optional override label (defaults to the canonical meta label). */
  label?: string;
}

/** Renders the derived open/upcoming/closed/unknown application status. */
export function ApplicationStatusBadge({ status, label }: ApplicationStatusBadgeProps) {
  const meta = applicationStatusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ background: meta.color, color: '#0a0a0a' }}
      title={meta.label}
    >
      {label ?? meta.label}
    </span>
  );
}

interface StaleBadgeProps {
  /** Whole days since last verification, when known. */
  ageDays?: number | null;
  /** True when there is no usable verification date. */
  unknown?: boolean;
}

/** A muted "stale data" / "unverified" warning badge. */
export function StaleBadge({ ageDays, unknown = false }: StaleBadgeProps) {
  const label = unknown
    ? 'Verification date unknown'
    : ageDays != null
      ? `Stale · ${ageDays}d since check`
      : 'Stale data';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#ffc24b] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap text-[#ffc24b]"
      title="This record may be out of date — confirm on the official site."
    >
      {label}
    </span>
  );
}
