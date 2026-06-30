// "Why are you looking?" founder triggers (handoff §8.2 / §16). Simple, honest,
// rule-based: each trigger maps to a filter preset that genuinely narrows the
// list toward the kind of program that solves that bottleneck. No black-box
// recommender — clicking a trigger just sets filters you can see and tweak.
//
// Stream 5 evolves these additively: each trigger now also carries an optional
// `needs` — a partial `FounderNeedsProfile` — so the same "why are you looking?"
// chips can seed the deterministic matching engine, not just the keyword filter.
// The legacy `preset` (and the `TRIGGERS` export shape) is unchanged so
// `filter.ts` / existing components keep working exactly as before.
import type { Filters } from '../lib/filter';
import type { FounderNeedsProfile } from '../lib/matching/types';

export interface Trigger {
  label: string;
  /** Filter preset applied (replacing the current filters). Legacy behavior. */
  preset: Partial<Filters>;
  /**
   * Optional structured needs the trigger expresses, for the Stream 5 matching
   * engine. Additive — consumers that only read `preset` are unaffected.
   */
  needs?: Partial<FounderNeedsProfile>;
}

// Each trigger narrows the list via the free-text `q` (the living/working
// `model` filter was retired in favour of the data-driven Sector/Country
// filters, so triggers map to keyword presets the search hay can match).
export const TRIGGERS: Trigger[] = [
  {
    label: 'I need funding',
    preset: { q: 'accelerator' },
    needs: { fundingNeed: true, supportNeeds: ['funding', 'investor-access'] },
  },
  {
    label: 'I want a live-in residency',
    preset: { q: 'live-in' },
    needs: { supportNeeds: ['housing', 'structure', 'community'] },
  },
  {
    label: 'I need a cofounder or community',
    preset: { q: 'hacker house' },
    needs: { teamStatus: 'seeking-cofounder', supportNeeds: ['co-founder-matching', 'community'] },
  },
  {
    label: 'I need deep focus',
    preset: { q: 'residency' },
    needs: { stage: 'idea', supportNeeds: ['structure', 'community'] },
  },
];

/**
 * Merge the structured `needs` of one or more triggers into a single partial
 * `FounderNeedsProfile`. Pure helper for callers that want to seed the matching
 * engine from selected trigger chips. Support-needs arrays are unioned;
 * scalar fields take the last non-undefined value.
 */
export function triggersToNeeds(triggers: Trigger[]): Partial<FounderNeedsProfile> {
  const merged: Partial<FounderNeedsProfile> = {};
  const supportNeeds = new Set<NonNullable<FounderNeedsProfile['supportNeeds']>[number]>();
  for (const t of triggers) {
    if (!t.needs) continue;
    const { supportNeeds: ns, ...rest } = t.needs;
    for (const n of ns ?? []) supportNeeds.add(n);
    Object.assign(merged, rest);
  }
  if (supportNeeds.size > 0) merged.supportNeeds = [...supportNeeds];
  return merged;
}
