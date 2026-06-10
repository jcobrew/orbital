// Living-model axis — the "where do you live/work, and for how much of the
// program" dimension. This is independent of program *type* (accelerator,
// residency, …) and of the storage split between the residential/traditional
// datasets. Reuses the `format` field; `relocation` and `hybrid` let
// traditional-plus-relocation programs (e.g. EF "The Bridge") be honest.
import type { ProgramFormat } from '../data/programs';

export interface LivingModelMeta {
  label: string;
  blurb: string;
}

export const LIVING_MODELS: Record<Exclude<ProgramFormat, 'unknown'>, LivingModelMeta> = {
  'live-in': { label: 'Live-in', blurb: 'Housing provided — you live where you build.' },
  relocation: { label: 'Relocation', blurb: 'Relocate to the host city for the cohort (housing not provided).' },
  hybrid: { label: 'Hybrid', blurb: 'Phased or mixed — e.g. remote then on-site, or an accelerator with a relocation leg.' },
  'in-person': { label: 'In-person', blurb: 'Attend in person; sort your own housing locally.' },
  remote: { label: 'Remote', blurb: 'Participate from anywhere.' },
};

/** Human-readable living-model label, or undefined when unknown/unset. */
export function livingModelLabel(format?: ProgramFormat | null): string | undefined {
  if (!format || format === 'unknown') return undefined;
  return LIVING_MODELS[format]?.label;
}

/** Ordered for filters (most location-committing first). */
export const LIVING_MODEL_ORDER: Exclude<ProgramFormat, 'unknown'>[] = [
  'live-in',
  'relocation',
  'hybrid',
  'in-person',
  'remote',
];
