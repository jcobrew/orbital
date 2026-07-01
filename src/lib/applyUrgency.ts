// Push-to-apply urgency cue. Given a program slug + its legacy recruiting status,
// derive a short, ENCOURAGING label to show next to an Apply button — only when
// there's something actionable to say. We never surface a discouraging
// "closed/unknown" beside an Apply CTA; in those cases we return null and the UI
// shows nothing.
//
// Reuses the existing application-window machinery rather than reinventing dates:
//   - windowsForSlug (data/applicationWindows)
//   - resolveApplicationStatus / statusForWindow (lib/applicationStatus)

import { windowsForSlug, type ApplicationWindow } from '../data/applicationWindows';
import { resolveApplicationStatus } from './applicationStatus';

export type UrgencyTone = 'urgent' | 'open' | 'upcoming';

export interface ApplyUrgency {
  label: string;
  tone: UrgencyTone;
}

/** Days a closing window must be within to count as "urgent". */
export const URGENT_WITHIN_DAYS = 30;

/** Parse an ISO (YYYY-MM-DD) date at UTC midnight, or null. */
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

/** Whole days from `now` until a window's close date, or null. */
function daysUntilClose(w: ApplicationWindow, now: Date): number | null {
  if (w.rolling) return null;
  const closes = parseISODate(w.closes);
  if (!closes) return null;
  return Math.ceil((closes.getTime() - now.getTime()) / 86_400_000);
}

/**
 * Compute the apply-urgency cue for a program. Returns null when there's nothing
 * encouraging + actionable to show.
 *
 * Precedence:
 *  1. A real, currently-open window closing within URGENT_WITHIN_DAYS → "Closes in N days".
 *  2. Resolved application status `open` → "Applications open".
 *  3. `closing-soon` (window-derived) → "Closing soon"; `coming-soon` → "Coming soon".
 *  4. Everything else (closed / upcoming-far / unknown) → null.
 */
export function applyUrgency(
  slug: string,
  legacyStatus?: string | null,
  now: Date = new Date(),
): ApplyUrgency | null {
  const windows = windowsForSlug(slug);
  const resolved = resolveApplicationStatus({ legacyStatus, windows }, now);

  // 1. Closing-soon, from concrete window dates.
  if (windows && resolved.status === 'open') {
    let soonest: number | null = null;
    for (const w of windows.windows) {
      const d = daysUntilClose(w, now);
      if (d != null && d >= 0 && (soonest == null || d < soonest)) soonest = d;
    }
    if (soonest != null && soonest <= URGENT_WITHIN_DAYS) {
      return {
        label: soonest === 0 ? 'Closes today' : `Closes in ${soonest} day${soonest === 1 ? '' : 's'}`,
        tone: 'urgent',
      };
    }
  }

  // 2. Legacy "closing soon" is more specific/urgent than a generic "open" — it
  //    maps to `open` in the status model, so check it before the generic case.
  const legacy = (legacyStatus ?? '').trim().toLowerCase();
  if (legacy === 'closing-soon') return { label: 'Closing soon', tone: 'urgent' };

  // 3. Open (rolling or window-open) with no near deadline.
  if (resolved.status === 'open') {
    return { label: 'Applications open', tone: 'open' };
  }

  // 4. Coming soon (upcoming hint when there's no window to be precise). Accepts
  //    the retired `opening-soon` alias too.
  if (legacy === 'coming-soon' || legacy === 'opening-soon') return { label: 'Coming soon', tone: 'upcoming' };

  // 5. Nothing encouraging to say.
  return null;
}
