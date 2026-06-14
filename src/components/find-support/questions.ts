// Stream 6 — guided-intake question definitions (plan §3, Path 2).
//
// Declarative so the flow component stays dumb: it just renders whatever is here.
// Option `value`s are the exact taxonomy / engine IDs the matcher expects, so no
// extra mapping lives in the UI — `answersToProfile` consumes these verbatim.

import { FOUNDER_STAGES, SUPPORT_MODES } from '../../data/taxonomy';
import { REGION_OPTIONS } from './profile';

export type QuestionKind = 'single' | 'multi' | 'tri';

export interface QuestionOption {
  value: string;
  label: string;
  hint?: string;
}

export interface Question {
  /** Stable key into IntakeAnswers. */
  key: 'stage' | 'teamStatus' | 'supportNeeds' | 'willingToRelocate' | 'regions' | 'urgency' | 'equityTolerance';
  kind: QuestionKind;
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

/** Stages we offer in intake — the MVP-scoped founder stages, in journey order. */
const STAGE_OPTIONS: QuestionOption[] = FOUNDER_STAGES.filter(
  (s) => s.mvp && s.id !== 'unknown',
).map((s) => ({ value: s.id, label: s.label, hint: s.description }));

/** Support modes we let founders pick — the MVP-scoped ones plus "customers". */
const SUPPORT_OPTIONS: QuestionOption[] = SUPPORT_MODES.filter(
  (m) => m.mvp || m.id === 'customers',
).map((m) => ({ value: m.id, label: m.label, hint: m.description }));

export const QUESTIONS: Question[] = [
  {
    key: 'stage',
    kind: 'single',
    title: 'What stage are you at?',
    subtitle: 'Pick the closest — this rules out programs built for a very different stage.',
    options: STAGE_OPTIONS,
  },
  {
    key: 'teamStatus',
    kind: 'single',
    title: 'Solo, in a team, or looking for a co-founder?',
    options: [
      { value: 'solo', label: 'Solo founder', hint: 'Building on your own for now.' },
      { value: 'team', label: 'In a team', hint: 'You already have co-founder(s).' },
      { value: 'seeking-cofounder', label: 'Looking for a co-founder', hint: 'You want to be matched with one.' },
    ],
  },
  {
    key: 'supportNeeds',
    kind: 'multi',
    title: 'What do you need most right now?',
    subtitle: 'Choose everything that applies — funding, community, workspace, co-founder discovery, visa help, customers, mentorship, or structure.',
    options: SUPPORT_OPTIONS,
  },
  {
    key: 'willingToRelocate',
    kind: 'tri',
    title: 'Willing to relocate for the right program?',
    subtitle: 'Live-in and relocation programs are filtered out if you can’t move.',
    options: [
      { value: 'yes', label: 'Yes, I can relocate' },
      { value: 'no', label: 'No, I need to stay put' },
      { value: 'either', label: 'No preference' },
    ],
  },
  {
    key: 'regions',
    kind: 'multi',
    title: 'Which regions interest you?',
    subtitle: 'Programs in these ecosystems get a relevance boost. Leave empty for anywhere.',
    options: REGION_OPTIONS.map((r) => ({ value: r.id, label: r.label })),
  },
  {
    key: 'urgency',
    kind: 'single',
    title: 'How soon do you want to act?',
    subtitle: 'If you want to apply now, closed cohorts are treated as blockers.',
    options: [
      { value: 'apply-now', label: 'Apply now', hint: 'Ready to submit applications today.' },
      { value: 'three-months', label: 'Next 3 months', hint: 'Planning to apply soon.' },
      { value: 'this-year', label: 'This year', hint: 'Sometime in the coming months.' },
      { value: 'exploring', label: 'Just exploring', hint: 'Researching options, no rush.' },
    ],
  },
  {
    key: 'equityTolerance',
    kind: 'single',
    title: 'How do you feel about giving up equity?',
    subtitle: 'Equity-free-only filters out programs that invest for equity.',
    options: [
      { value: 'equity-free-only', label: 'Equity-free only', hint: 'No dilution — grants, stipends, free access.' },
      { value: 'prefer-equity-free', label: 'Prefer equity-free', hint: 'Open to equity, but non-dilutive preferred.' },
      { value: 'open', label: 'Open to equity', hint: 'No strong preference.' },
    ],
  },
];
