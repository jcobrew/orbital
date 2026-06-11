// Canonical Founder Atlas taxonomy (Stream 2).
//
// This module is the single source of truth for the *canonical* ID sets that
// describe a founder-support program. It exists alongside — not instead of —
// the legacy free-text fields on `Program` (`type`, `stage`, `format`, …).
// Nothing here mutates or replaces those fields; `src/lib/normalizeProgram.ts`
// *derives* canonical IDs from the legacy text in a non-destructive way.
//
// Design goals:
//   1. Represent the FULL long-term landscape taxonomy (so the schema is
//      future-ready) while marking only the 6–8 MVP categories with `mvp:true`.
//   2. Be additive and backward compatible — importing this file never changes
//      any existing export shape.
//   3. Stay plain TS data (objects + const arrays) so it can later drive
//      JSON-schema / export generation without a rewrite.

/** One canonical taxonomy entry. */
export interface TaxonomyEntry<Id extends string = string> {
  /** Stable machine ID (kebab-case, never user-facing). */
  id: Id;
  /** Human-facing label. */
  label: string;
  /**
   * Is this value in scope for the MVP? For `programType` this marks the 6–8
   * actively-populated MVP categories; for the other dimensions it marks values
   * the MVP matching/intake flow actually reasons about. Everything else stays
   * representable but `mvp:false`.
   */
  mvp: boolean;
  /** Optional short description / disambiguation note. */
  description?: string;
}

/** Narrow an array of entries to its literal `id` union. */
type IdOf<T extends ReadonlyArray<{ id: string }>> = T[number]['id'];

// ---------------------------------------------------------------------------
// 1. programType — the FULL landscape taxonomy.
//    MVP categories (mvp:true): founder residencies, hacker/founder houses,
//    accelerators, pre-accelerators, founder fellowships, government
//    grants/non-dilutive, startup visas/soft-landing, co-founder matching /
//    online founder communities. Everything else is representable but mvp:false.
// ---------------------------------------------------------------------------
export const PROGRAM_TYPES = [
  // ---- MVP categories ----
  {
    id: 'founder-residency',
    label: 'Founder residency',
    mvp: true,
    description:
      'Live-in or relocation cohort built around focus — you move into a house/campus for a fixed term (HF0, The Residency, Neo).',
  },
  {
    id: 'hacker-house',
    label: 'Hacker / founder house',
    mvp: true,
    description:
      'Shared house or coliving organized around a tech scene; the support is builder density and network, often pay-rent (AGI House, STAK, Foundry).',
  },
  {
    id: 'accelerator',
    label: 'Accelerator',
    mvp: true,
    description:
      'Fixed-length cohort: small cheque + mentorship + demo day, usually for equity (Y Combinator, Techstars).',
  },
  {
    id: 'pre-accelerator',
    label: 'Pre-accelerator',
    mvp: true,
    description:
      'Earlier, lighter-touch program that prepares idea/pre-product founders for a full accelerator or first raise.',
  },
  {
    id: 'founder-fellowship',
    label: 'Founder fellowship',
    mvp: true,
    description:
      'Membership + capital that backs high-potential founders before (or independent of) a specific idea (South Park Commons, Afore FIR).',
  },
  {
    id: 'government-grant',
    label: 'Government grant / non-dilutive',
    mvp: true,
    description:
      'Public, non-dilutive funding or grant-backed program — money without taking equity (Start-Up Chile, national innovation grants).',
  },
  {
    id: 'startup-visa',
    label: 'Startup visa / soft-landing',
    mvp: true,
    description:
      'Visa, relocation, or soft-landing program that lets a founder build in a country (Estonia/France/UK startup visas, Hub71 soft-landing).',
  },
  {
    id: 'cofounder-matching',
    label: 'Co-founder matching / online founder community',
    mvp: true,
    description:
      'Talent-investor or online community whose core value is finding a co-founder, peers, or a first cheque for individuals (Entrepreneur First, Antler, On Deck).',
  },

  // ---- Future / non-MVP categories (representable, not actively populated) ----
  {
    id: 'incubator',
    label: 'Incubator',
    mvp: false,
    description:
      'Longer, lower-intensity support that helps turn an idea into a company; often workspace + early mentorship, sometimes no fixed cohort.',
  },
  {
    id: 'startup-studio',
    label: 'Startup studio / venture builder',
    mvp: false,
    description: 'Builds companies in-house and recruits founders into pre-formed ideas.',
  },
  {
    id: 'corporate-accelerator',
    label: 'Corporate accelerator',
    mvp: false,
    description: 'Run by or with a large company; access to customers/pilots, often no equity (Plug and Play, Wayra).',
  },
  {
    id: 'university-program',
    label: 'University program',
    mvp: false,
    description: 'Campus-affiliated accelerator/incubator for students, alumni, or researchers (StartX, Berkeley SkyDeck).',
  },
  {
    id: 'tech-transfer',
    label: 'Tech transfer / spin-out program',
    mvp: false,
    description: 'University or lab office that commercializes research into spin-out companies.',
  },
  {
    id: 'deep-tech-program',
    label: 'Deep-tech / lab program',
    mvp: false,
    description: 'Provides wet-lab or hard-tech facilities plus capital for science startups (IndieBio, HAX).',
  },
  {
    id: 'startup-campus',
    label: 'Startup campus / hub',
    mvp: false,
    description: 'A building or hub hosting many programs and companies at once (Station F, Norrsken House).',
  },
  {
    id: 'venture-debt',
    label: 'Venture debt / non-equity financing',
    mvp: false,
    description: 'Debt-based financing for startups instead of equity investment.',
  },
  {
    id: 'pop-up-village',
    label: 'Pop-up village / temporary community',
    mvp: false,
    description: 'A temporary town/community of builders that exists for weeks (Edge Esmeralda).',
  },
  {
    id: 'ecosystem-support',
    label: 'Ecosystem-specific support',
    mvp: false,
    description: 'Region- or community-specific support orgs, networks, or hubs that do not fit a cleaner category.',
  },
  {
    id: 'other',
    label: 'Other / unclassified',
    mvp: false,
    description: 'Fallback for programs whose legacy type does not map to a known canonical category.',
  },
] as const satisfies ReadonlyArray<TaxonomyEntry>;
export type ProgramTypeId = IdOf<typeof PROGRAM_TYPES>;

// ---------------------------------------------------------------------------
// 2. supportMode — what a program concretely provides.
//    These mirror the existing `providesX` booleans on `Program` plus a few
//    that matter for matching (structure, customers, co-founder matching).
// ---------------------------------------------------------------------------
export const SUPPORT_MODES = [
  { id: 'funding', label: 'Funding / investment', mvp: true, description: 'Provides cash, an investment cheque, or a stipend.' },
  { id: 'housing', label: 'Housing', mvp: true, description: 'Provides a place to live for the program duration.' },
  { id: 'workspace', label: 'Workspace', mvp: true, description: 'Provides desks / office / coworking space.' },
  { id: 'mentorship', label: 'Mentorship', mvp: true, description: 'Structured mentorship, coaching, or advisors.' },
  { id: 'investor-access', label: 'Investor access', mvp: true, description: 'Introductions to investors / fundraising help.' },
  { id: 'demo-day', label: 'Demo day', mvp: true, description: 'A pitch / demo day to investors at the end.' },
  { id: 'visa-support', label: 'Visa / relocation support', mvp: true, description: 'Helps with visas, relocation, or soft-landing.' },
  { id: 'community', label: 'Community / peers', mvp: true, description: 'A community of peers, builders, or alumni.' },
  {
    id: 'co-founder-matching',
    label: 'Co-founder matching',
    mvp: true,
    description: 'Helps you find or be matched with a co-founder.',
  },
  { id: 'customers', label: 'Customers / pilots', mvp: false, description: 'Access to customers, pilots, or distribution.' },
  { id: 'structure', label: 'Structure / focus', mvp: true, description: 'Imposed structure, deadlines, or full-time focus.' },
  { id: 'compute-credits', label: 'Compute / cloud credits', mvp: false, description: 'Free GPU / cloud / model-API credits.' },
  { id: 'lab-access', label: 'Lab / hardware access', mvp: false, description: 'Wet-lab, prototyping, or hardware facilities.' },
  { id: 'legal-admin', label: 'Legal / admin support', mvp: false, description: 'Incorporation, legal, or back-office help.' },
] as const satisfies ReadonlyArray<TaxonomyEntry>;
export type SupportModeId = IdOf<typeof SUPPORT_MODES>;

// ---------------------------------------------------------------------------
// 3. founderStage — aligns with the existing `StageFit` union on `Program`.
//    Kept ID-identical to StageFit so the two can interoperate.
// ---------------------------------------------------------------------------
export const FOUNDER_STAGES = [
  { id: 'pre-idea', label: 'Pre-idea', mvp: true, description: 'No idea yet; exploring whether to start.' },
  { id: 'idea', label: 'Idea', mvp: true, description: 'Has an idea, no product yet.' },
  { id: 'pre-product', label: 'Pre-product', mvp: true, description: 'Validating; pre-build.' },
  { id: 'mvp', label: 'MVP', mvp: true, description: 'Has an early product / MVP.' },
  { id: 'pre-seed', label: 'Pre-seed', mvp: true, description: 'Raising or about to raise pre-seed.' },
  { id: 'seed', label: 'Seed', mvp: true, description: 'At or raising seed.' },
  { id: 'series-a-plus', label: 'Series A+', mvp: false, description: 'Series A or later.' },
  { id: 'repeat-founder', label: 'Repeat founder', mvp: true, description: 'Has founded before.' },
  { id: 'student', label: 'Student', mvp: true, description: 'Currently a student.' },
  { id: 'researcher', label: 'Researcher', mvp: false, description: 'Academic / research background.' },
  { id: 'unknown', label: 'Unknown', mvp: true, description: 'Stage not specified.' },
] as const satisfies ReadonlyArray<TaxonomyEntry>;
export type FounderStageId = IdOf<typeof FOUNDER_STAGES>;

// ---------------------------------------------------------------------------
// 4. intakeMethod — how you get in.
// ---------------------------------------------------------------------------
export const INTAKE_METHODS = [
  { id: 'rolling', label: 'Rolling', mvp: true, description: 'Accepts applications continuously / always open.' },
  { id: 'cohort-application', label: 'Cohort application', mvp: true, description: 'Apply to a specific dated cohort.' },
  { id: 'open-call', label: 'Open call', mvp: true, description: 'A specific open call / round you respond to.' },
  { id: 'invitation', label: 'Invitation / referral', mvp: true, description: 'By invitation, nomination, or referral only.' },
  { id: 'membership', label: 'Membership / pay-to-join', mvp: false, description: 'Join by paying membership or rent.' },
  { id: 'unknown', label: 'Unknown', mvp: true, description: 'Intake method not specified.' },
] as const satisfies ReadonlyArray<TaxonomyEntry>;
export type IntakeMethodId = IdOf<typeof INTAKE_METHODS>;

// ---------------------------------------------------------------------------
// 5. intakeFrequency — how often intake happens.
// ---------------------------------------------------------------------------
export const INTAKE_FREQUENCIES = [
  { id: 'rolling', label: 'Rolling', mvp: true, description: 'Always open / continuous intake.' },
  { id: 'annual', label: 'Annual', mvp: true, description: 'About once a year.' },
  { id: 'biannual', label: 'Biannual', mvp: true, description: 'About twice a year.' },
  { id: 'quarterly', label: 'Quarterly', mvp: true, description: 'About four times a year.' },
  { id: 'ad-hoc', label: 'Ad-hoc', mvp: true, description: 'Irregular / as announced.' },
  { id: 'unknown', label: 'Unknown', mvp: true, description: 'Frequency not specified.' },
] as const satisfies ReadonlyArray<TaxonomyEntry>;
export type IntakeFrequencyId = IdOf<typeof INTAKE_FREQUENCIES>;

// ---------------------------------------------------------------------------
// 6. costFundingModel — the equity / money axis.
// ---------------------------------------------------------------------------
export const COST_FUNDING_MODELS = [
  { id: 'equity', label: 'Equity investment', mvp: true, description: 'Gives cash and takes equity (typically via SAFE).' },
  {
    id: 'equity-free-grant',
    label: 'Equity-free grant',
    mvp: true,
    description: 'Provides non-dilutive grant funding; takes no equity.',
  },
  { id: 'stipend', label: 'Stipend', mvp: true, description: 'Pays a living stipend rather than an investment cheque.' },
  { id: 'fee', label: 'Fee / paid', mvp: true, description: 'You pay a fee, tuition, or rent to participate.' },
  { id: 'free', label: 'Free', mvp: true, description: 'No fee and no equity — access-based.' },
  { id: 'venture-debt', label: 'Venture debt', mvp: false, description: 'Debt-based financing.' },
  { id: 'mixed', label: 'Mixed', mvp: true, description: 'Combination of the above (e.g. equity + optional fee).' },
  { id: 'unknown', label: 'Unknown', mvp: true, description: 'Cost / funding model not specified.' },
] as const satisfies ReadonlyArray<TaxonomyEntry>;
export type CostFundingModelId = IdOf<typeof COST_FUNDING_MODELS>;

// ---------------------------------------------------------------------------
// Convenience accessors.
// ---------------------------------------------------------------------------

/** All taxonomy dimensions keyed by name, for generic tooling / docs / exports. */
export const TAXONOMY = {
  programType: PROGRAM_TYPES,
  supportMode: SUPPORT_MODES,
  founderStage: FOUNDER_STAGES,
  intakeMethod: INTAKE_METHODS,
  intakeFrequency: INTAKE_FREQUENCIES,
  costFundingModel: COST_FUNDING_MODELS,
} as const;

export type TaxonomyDimension = keyof typeof TAXONOMY;

/** All program-type IDs. */
export const PROGRAM_TYPE_IDS: ProgramTypeId[] = PROGRAM_TYPES.map((e) => e.id);
/** Only the MVP-scoped program-type IDs (the 6–8 actively-populated categories). */
export const MVP_PROGRAM_TYPE_IDS: ProgramTypeId[] = PROGRAM_TYPES.filter((e) => e.mvp).map((e) => e.id);

/** Is a program-type ID one of the MVP-scoped categories? */
export function isMvpProgramType(id: string): id is ProgramTypeId {
  return MVP_PROGRAM_TYPE_IDS.includes(id as ProgramTypeId);
}

/** True if `id` is a known canonical program type (MVP or future). */
export function isProgramTypeId(id: string): id is ProgramTypeId {
  return PROGRAM_TYPE_IDS.includes(id as ProgramTypeId);
}

/** Look up an entry's label in any dimension, falling back to the raw id. */
export function labelFor(dimension: TaxonomyDimension, id: string): string {
  const entry = (TAXONOMY[dimension] as ReadonlyArray<TaxonomyEntry>).find((e) => e.id === id);
  return entry?.label ?? id;
}
