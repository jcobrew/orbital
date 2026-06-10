// "Why are you looking?" founder triggers (handoff §8.2 / §16). Simple, honest,
// rule-based: each trigger maps to a filter preset that genuinely narrows the
// list toward the kind of program that solves that bottleneck. No black-box
// recommender — clicking a trigger just sets filters you can see and tweak.
import type { Filters } from '../lib/filter';

export interface Trigger {
  label: string;
  /** Filter preset applied (replacing the current filters). */
  preset: Partial<Filters>;
}

export const TRIGGERS: Trigger[] = [
  { label: 'I need funding', preset: { q: 'accelerator' } },
  { label: 'I need a place to live & build', preset: { format: 'live-in' } },
  { label: 'I need deep focus', preset: { q: 'residency' } },
  { label: 'I need a cofounder or community', preset: { q: 'hacker house' } },
  { label: 'I need to go from idea to MVP', preset: { q: 'incubator' } },
  { label: "I'm very early (pre-idea)", preset: { q: 'fellowship' } },
  { label: 'I need to move to a startup hub', preset: { format: 'relocation' } },
];
