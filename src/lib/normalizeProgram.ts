// Non-destructive normalization (Stream 2).
//
// Maps a program's legacy free-text `type` / `stage` / `format` to canonical
// taxonomy IDs (see `src/data/taxonomy.ts`). This is *derivation*, never
// mutation: it returns a fresh object and emits warnings for anything it can't
// confidently map. The source `Program` fields are left untouched.
//
// Strategy: an explicit best-effort lookup table for the exact legacy strings
// seen in the datasets, plus keyword heuristics as a fallback so new/edited
// records still map without code changes. Order matters in the heuristics —
// more specific signals are checked first.

import type {
  CostFundingModelId,
  FounderStageId,
  ProgramTypeId,
  SupportModeId,
} from '../data/taxonomy';
import { isProgramTypeId } from '../data/taxonomy';

/** Minimal shape we read — keeps this decoupled from the full `Program` type. */
export interface NormalizableProgram {
  name?: string;
  type?: string;
  stage?: string;
  format?: string;
  focus?: string;
  // Optional booleans we use to enrich support-mode inference when present.
  providesHousing?: boolean | null;
  providesWorkspace?: boolean | null;
  providesFunding?: boolean | null;
  providesMentorship?: boolean | null;
  providesInvestorAccess?: boolean | null;
  providesDemoDay?: boolean | null;
  providesVisaSupport?: boolean | null;
}

export interface NormalizedProgram {
  /** Best-effort canonical program type, or 'other' when unmappable. */
  canonicalType: ProgramTypeId;
  /** Canonical founder stages derived from the free-text `stage`. */
  canonicalStages: FounderStageId[];
  /** Canonical support modes derived from type + format + provides* flags. */
  canonicalSupportModes: SupportModeId[];
  /** Canonical cost/funding model when inferable from the type text. */
  canonicalCostFundingModel?: CostFundingModelId;
  /** Non-fatal mapping problems (never thrown). */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// programType mapping
// ---------------------------------------------------------------------------

/**
 * Exact legacy `type` strings → canonical IDs. Covers the distinct values
 * present in the current datasets. Heuristics below catch anything missing.
 * Keys are lowercased at lookup time.
 */
const TYPE_EXACT: Record<string, ProgramTypeId> = {
  accelerator: 'accelerator',
  'seed accelerator': 'accelerator',
  'ai accelerator': 'accelerator',
  'accelerator (b2b)': 'accelerator',
  'accelerator (no equity)': 'accelerator',
  'accelerator (network)': 'accelerator',
  'accelerator (global network)': 'accelerator',
  'thematic accelerator': 'accelerator',
  'biotech accelerator': 'accelerator',
  'hard-tech accelerator': 'accelerator',
  'web3 accelerator': 'accelerator',
  'impact accelerator': 'accelerator',
  'ai go-to-market accelerator': 'accelerator',
  'climate ai accelerator (no equity)': 'accelerator',
  'ai accelerator (no equity)': 'accelerator',
  'accelerator / micro-vc': 'accelerator',
  'accelerator + vc': 'accelerator',
  'early-stage vc / accelerator': 'accelerator',
  'seed fund / accelerator': 'accelerator',
  'pre-seed accelerator': 'pre-accelerator',
  'pre-seed accelerator (global)': 'pre-accelerator',
  'corporate accelerator': 'corporate-accelerator',
  'government accelerator': 'accelerator',
  'government-backed accelerator': 'accelerator',
  'government-backed hub / accelerator': 'accelerator',
  'seed accelerator (mena)': 'accelerator',
  'university accelerator': 'university-program',
  'company-building intensive': 'accelerator',
  'residency / accelerator': 'founder-residency',
  'accelerator / venture studio': 'startup-studio',
  'b2b accelerator / studio': 'startup-studio',
  'accelerator / hub': 'accelerator',
  'innovation hub / accelerator': 'accelerator',
  'live-in incubator': 'founder-residency',
  'training + seed incubator': 'incubator',
  'live-in residency': 'founder-residency',
  'residency (upcoming)': 'founder-residency',
  'bio lab residency': 'founder-residency',
  'founder residency (short-form)': 'founder-residency',
  'hacker house / residency': 'founder-residency',
  'ai residency + campus': 'founder-residency',
  'hacker house': 'hacker-house',
  'hacker house / coliving': 'hacker-house',
  'hacker house network': 'hacker-house',
  'hacker house + fund': 'hacker-house',
  'student hacker house': 'hacker-house',
  'hacker house (women)': 'hacker-house',
  'hacker house (web3)': 'hacker-house',
  'hacker hotel': 'hacker-house',
  'hacker house / workspace': 'hacker-house',
  'coliving startup society': 'hacker-house',
  'vertical village / coliving': 'hacker-house',
  'coworking residency / community': 'hacker-house',
  'coworking community / club': 'hacker-house',
  'residential launchpad / co-founder factory': 'cofounder-matching',
  'founder fellowship / community': 'founder-fellowship',
  'fellowship + fund': 'founder-fellowship',
  'talent investor': 'cofounder-matching',
  'talent investor / day-zero vc': 'cofounder-matching',
  'talent investor / growth fund': 'cofounder-matching',
  'deep-tech program (no equity)': 'deep-tech-program',
  'deep-tech phd program': 'deep-tech-program',
  'startup campus + fund': 'startup-campus',
  'startup campus': 'startup-campus',
  'startup hub': 'startup-campus',
  'government innovation hub': 'startup-campus',
  'pop-up village': 'pop-up-village',
};

/** Keyword heuristics, checked in order (first match wins). */
const TYPE_HEURISTICS: Array<[RegExp, ProgramTypeId]> = [
  [/\bvisa\b|soft[-\s]?landing/, 'startup-visa'],
  [/co-?founder|cofounder|talent investor|day-zero/, 'cofounder-matching'],
  [/grant|non-?dilutive/, 'government-grant'],
  [/fellowship/, 'founder-fellowship'],
  [/residency|residential|live-in/, 'founder-residency'],
  [/hacker\s*house|hacker\s*hotel|coliving|co-?living|hacker building/, 'hacker-house'],
  [/pop-?up village/, 'pop-up-village'],
  [/venture studio|venture builder|company builder|\bstudio\b/, 'startup-studio'],
  [/corporate/, 'corporate-accelerator'],
  [/deep-?tech|lab program|phd program|biotech/, 'deep-tech-program'],
  [/university|campus/, 'university-program'],
  [/incubator/, 'incubator'],
  [/pre-?seed accelerator|pre-?accelerator/, 'pre-accelerator'],
  [/accelerator/, 'accelerator'],
  [/\bhub\b/, 'startup-campus'],
];

/** Map a legacy free-text `type` to a canonical program-type ID. */
export function canonicalProgramType(rawType: string | undefined): {
  id: ProgramTypeId;
  matched: boolean;
} {
  const t = (rawType ?? '').trim().toLowerCase();
  if (!t) return { id: 'other', matched: false };
  const exact = TYPE_EXACT[t];
  if (exact) return { id: exact, matched: true };
  for (const [re, id] of TYPE_HEURISTICS) {
    if (re.test(t)) return { id, matched: true };
  }
  return { id: 'other', matched: false };
}

// ---------------------------------------------------------------------------
// founderStage mapping (free-text `stage` may encode several tokens/ranges)
// ---------------------------------------------------------------------------

const STAGE_TOKEN_MAP: Array<[RegExp, FounderStageId]> = [
  [/pre-?idea/, 'pre-idea'],
  [/pre-?team/, 'pre-idea'],
  [/exploratory|exploration/, 'pre-idea'],
  [/pre-?product/, 'pre-product'],
  [/\bidea\b/, 'idea'],
  [/\bmvp\b/, 'mvp'],
  [/pre-?seed/, 'pre-seed'],
  [/\bseed\b/, 'seed'],
  [/series\s*a/, 'series-a-plus'],
  [/growth/, 'series-a-plus'],
  [/repeat/, 'repeat-founder'],
  [/student/, 'student'],
  [/researcher|research/, 'researcher'],
];

/**
 * Map a legacy free-text `stage` to canonical founder-stage IDs.
 *
 * `matched` is false (caller warns) only when the text carries *no* usable
 * stage signal at all. Generic-but-meaningful phrasings are handled:
 *   - a bare "early" / "very early" → the early band (pre-seed, seed)
 *   - "cross-stage" / "community" / "nomad" / "builders" / "indie" / "funded"
 *     describe audience, not a crisp stage → matched (no specific stage ID).
 */
export function canonicalStages(rawStage: string | undefined): {
  ids: FounderStageId[];
  matched: boolean;
} {
  const s = (rawStage ?? '').trim().toLowerCase();
  if (!s) return { ids: [], matched: false };
  const ids = new Set<FounderStageId>();
  for (const [re, id] of STAGE_TOKEN_MAP) {
    if (re.test(s)) ids.add(id);
  }
  if (ids.size > 0) return { ids: [...ids], matched: true };

  // No crisp token. Recognize the common generic descriptors so they don't
  // produce noise warnings — they are legitimately stage-agnostic.
  const isGenericEarly = /\bearly\b|very early/.test(s);
  if (isGenericEarly) return { ids: ['pre-seed', 'seed'], matched: true };
  const isStageAgnostic = /cross-?stage|community|nomad|builders?|\bindie\b|\bfunded\b/.test(s);
  if (isStageAgnostic) return { ids: [], matched: true };

  return { ids: [], matched: false };
}

// ---------------------------------------------------------------------------
// supportMode derivation (from canonical type + format + provides* flags)
// ---------------------------------------------------------------------------

/** Baseline support modes implied by a canonical program type. */
const TYPE_SUPPORT_MODES: Partial<Record<ProgramTypeId, SupportModeId[]>> = {
  'founder-residency': ['housing', 'workspace', 'community', 'structure'],
  'hacker-house': ['housing', 'workspace', 'community'],
  accelerator: ['funding', 'mentorship', 'investor-access', 'demo-day', 'structure'],
  'pre-accelerator': ['mentorship', 'structure', 'community'],
  'founder-fellowship': ['funding', 'community', 'mentorship'],
  'government-grant': ['funding'],
  'startup-visa': ['visa-support'],
  'cofounder-matching': ['co-founder-matching', 'community', 'funding'],
  incubator: ['workspace', 'mentorship'],
  'corporate-accelerator': ['mentorship', 'customers'],
  'deep-tech-program': ['funding', 'lab-access', 'mentorship'],
  'university-program': ['mentorship', 'workspace'],
  'startup-campus': ['workspace', 'community'],
  'startup-studio': ['funding', 'co-founder-matching', 'structure'],
  'pop-up-village': ['community'],
};

/** Derive canonical support modes from a program, combining all signals. */
export function canonicalSupportModes(
  program: NormalizableProgram,
  canonicalTypeId: ProgramTypeId,
): SupportModeId[] {
  const modes = new Set<SupportModeId>(TYPE_SUPPORT_MODES[canonicalTypeId] ?? []);

  // format implies housing/relocation signals.
  const fmt = (program.format ?? '').trim().toLowerCase();
  if (fmt === 'live-in') modes.add('housing');

  // provides* booleans are authoritative when explicitly set.
  if (program.providesHousing) modes.add('housing');
  if (program.providesWorkspace) modes.add('workspace');
  if (program.providesFunding) modes.add('funding');
  if (program.providesMentorship) modes.add('mentorship');
  if (program.providesInvestorAccess) modes.add('investor-access');
  if (program.providesDemoDay) modes.add('demo-day');
  if (program.providesVisaSupport) modes.add('visa-support');

  return [...modes];
}

// ---------------------------------------------------------------------------
// costFundingModel inference (best-effort from the type text)
// ---------------------------------------------------------------------------

export function canonicalCostFundingModel(
  rawType: string | undefined,
): CostFundingModelId | undefined {
  const t = (rawType ?? '').trim().toLowerCase();
  if (!t) return undefined;
  if (/no equity|non-?dilutive|grant/.test(t)) return 'equity-free-grant';
  if (/venture debt/.test(t)) return 'venture-debt';
  if (/coliving|co-?living|coworking|hacker house|hacker hotel/.test(t)) return 'fee';
  if (/\bvc\b|\bfund\b|talent investor|accelerator|day-zero/.test(t)) return 'equity';
  return undefined;
}

// ---------------------------------------------------------------------------
// Top-level entry point
// ---------------------------------------------------------------------------

/**
 * Derive all canonical fields for a program, collecting warnings for anything
 * that could not be confidently mapped. Pure and non-destructive.
 */
export function normalizeProgram(program: NormalizableProgram): NormalizedProgram {
  const warnings: string[] = [];
  const label = program.name ? `"${program.name}"` : 'program';

  const typeResult = canonicalProgramType(program.type);
  if (!typeResult.matched) {
    warnings.push(
      `${label}: could not map legacy type ${JSON.stringify(program.type ?? '')} to a canonical program type (defaulted to "other").`,
    );
  }

  const stageResult = canonicalStages(program.stage);
  if (program.stage && program.stage.trim() && !stageResult.matched) {
    warnings.push(
      `${label}: could not map legacy stage ${JSON.stringify(program.stage)} to any canonical founder stage.`,
    );
  }

  const supportModes = canonicalSupportModes(program, typeResult.id);
  const costFundingModel = canonicalCostFundingModel(program.type);

  // Sanity: warn if heuristics produced an ID not in the taxonomy (guards
  // against future edits to the maps).
  if (!isProgramTypeId(typeResult.id)) {
    warnings.push(`${label}: derived program type "${typeResult.id}" is not a known canonical ID.`);
  }

  return {
    canonicalType: typeResult.id,
    canonicalStages: stageResult.ids,
    canonicalSupportModes: supportModes,
    canonicalCostFundingModel: costFundingModel,
    warnings,
  };
}
