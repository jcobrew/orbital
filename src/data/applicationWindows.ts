// Stream 4 — Application windows / deadlines model.
//
// Separates *stable program identity* (the `Program` record) from *changing
// application data* (when can a founder actually apply?). "A program exists" is
// NOT the same as "applications are open".
//
// Windows are linked to programs EXTERNALLY by program slug (see `programSlug`
// in ./programs) — this stream does NOT edit the `Program` type. A program with
// no window here keeps rendering exactly as today off its legacy `status` field.

/** A single application window for a program cohort/intake. */
export interface ApplicationWindow {
  /**
   * Rolling means "always open" — no fixed opens/closes. When true, `opens` /
   * `closes` are ignored for status computation.
   */
  rolling?: boolean;
  /** ISO date (YYYY-MM-DD) applications open. Omitted for rolling. */
  opens?: string;
  /** ISO date (YYYY-MM-DD) applications close. Omitted for rolling/open-ended. */
  closes?: string;
  /** Cohort/batch label, e.g. "Winter 2026", "Cohort 14". */
  cohortLabel?: string;
  /** Optional direct application URL for this specific window. */
  applyUrl?: string;
  /** Free-text deadline/intake notes. */
  notes?: string;
}

/** Application-window data for one program, keyed by program slug. */
export interface ProgramWindows {
  programSlug: string;
  /** Zero or more windows; the soonest-relevant one drives displayed status. */
  windows: ApplicationWindow[];
}

/**
 * Sample windows for a few MVP-relevant programs already in the dataset.
 * Slugs verified against the live JSON. Dates are plausible illustrative
 * samples (clearly noted) unless backed by an official source in ./sources.ts.
 */
export const PROGRAM_WINDOWS: Record<string, ProgramWindows> = {
  // Rolling intake — applications are effectively always open.
  'y-combinator': {
    programSlug: 'y-combinator',
    windows: [
      {
        rolling: true,
        cohortLabel: 'Rolling batches',
        applyUrl: 'https://www.ycombinator.com/apply',
        notes: 'YC reviews applications on a rolling basis ahead of each batch.',
      },
    ],
  },
  'entrepreneur-first-ef': {
    programSlug: 'entrepreneur-first-ef',
    windows: [
      {
        rolling: true,
        cohortLabel: 'Rolling cohorts',
        applyUrl: 'https://www.joinef.com/apply/',
        notes: 'EF runs rolling intake across its global cohorts.',
      },
    ],
  },
  // A fixed, currently-open window (sample dates around the current date).
  'startup-wise-guys': {
    programSlug: 'startup-wise-guys',
    windows: [
      {
        opens: '2026-05-01',
        closes: '2026-07-15',
        cohortLabel: 'Autumn 2026 (sample)',
        notes: 'Sample window — confirm exact dates on the official site.',
      },
    ],
  },
  // An upcoming window that has not opened yet (sample dates).
  'south-park-commons': {
    programSlug: 'south-park-commons',
    windows: [
      {
        opens: '2026-08-01',
        closes: '2026-09-30',
        cohortLabel: 'Fall 2026 Fellowship (sample)',
        notes: 'Sample window — applications open ahead of the next fellowship.',
      },
    ],
  },
  // A closed window in the past (sample dates) — demonstrates "closed".
  'founders-inc-f-inc': {
    programSlug: 'founders-inc-f-inc',
    windows: [
      {
        opens: '2026-01-01',
        closes: '2026-03-31',
        cohortLabel: 'Q1 2026 (sample, closed)',
        notes: 'Sample closed window — used to demonstrate closed-state rendering.',
      },
    ],
  },
};

/** Look up windows for a program by slug. Returns undefined when absent. */
export function windowsForSlug(slug: string): ProgramWindows | undefined {
  return PROGRAM_WINDOWS[slug];
}
