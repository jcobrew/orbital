import { useEffect, useMemo, useState } from 'react';
import type { Program } from '../../data/programs';
import { matchPrograms, type ProgramMatch } from '../../lib/matching';
import ProgramDetailDrawer from '../ProgramDetailDrawer';
import MatchCard from './MatchCard';
import { QUESTIONS } from './questions';
import {
  answersFromQuery,
  answersToProfile,
  answersToQuery,
  hasAnyAnswer,
  type IntakeAnswers,
} from './profile';

type Path = 'choose' | 'guided' | 'results';

const cardBase = 'rounded-md border bg-[rgba(16,16,16,.55)]';
const chipBase = 'select-none rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition text-left';

/** Tri-state ("yes"/"no"/"either") <-> boolean|undefined for the relocate question. */
function relocateToValue(b: boolean | undefined): string {
  if (b === true) return 'yes';
  if (b === false) return 'no';
  return 'either';
}
function valueToRelocate(v: string): boolean | undefined {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return undefined;
}

export default function FindSupportFlow({ programs }: { programs: Program[] }) {
  const [answers, setAnswers] = useState<IntakeAnswers>({});
  const [path, setPath] = useState<Path>('choose');
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Program | null>(null);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate answers from the URL on first mount; if any answer is present, jump
  // straight to results (shareable deep link).
  useEffect(() => {
    const parsed = answersFromQuery(window.location.search);
    setAnswers(parsed);
    if (hasAnyAnswer(parsed)) setPath('results');
    setHydrated(true);
  }, []);

  // Keep the URL in sync with answers (replaceState — no history spam), matching
  // the explore/filters deep-link contract.
  useEffect(() => {
    if (!hydrated) return;
    const qs = answersToQuery(answers);
    const url = qs ? window.location.pathname + '?' + qs : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [answers, hydrated]);

  const programById = useMemo(() => {
    const m = new Map<string, Program>();
    for (const p of programs) m.set(p.name, p);
    return m;
  }, [programs]);

  const matches: ProgramMatch[] = useMemo(() => {
    if (path !== 'results') return [];
    const profile = answersToProfile(answers);
    return matchPrograms(profile, programs);
  }, [answers, programs, path]);

  const recommended = matches.filter((m) => m.disqualifiers.length === 0);
  const blocked = matches.filter((m) => m.disqualifiers.length > 0);

  function patch(p: Partial<IntakeAnswers>) {
    setAnswers((prev) => ({ ...prev, ...p }));
  }

  function toggleMulti(key: 'supportNeeds' | 'regions', value: string) {
    setAnswers((prev) => {
      const cur = (prev[key] as string[] | undefined) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setPath('choose');
  }

  // ── Path chooser ────────────────────────────────────────────────────────
  if (path === 'choose') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => {
            setStep(0);
            setPath('guided');
          }}
          className={`${cardBase} border-line p-5 text-left transition hover:border-a1`}
        >
          <div className="mb-1.5 font-display text-[16px] font-bold text-text">Help me figure out what I need</div>
          <p className="m-0 text-[12.5px] leading-normal text-muted">
            Answer {QUESTIONS.length} quick questions about your stage, needs, and constraints. We score every
            program and explain each match — why it fits, what blocks it, and the next step.
          </p>
          <span className="mt-3 inline-block text-[12px] font-semibold text-a2">Start guided intake →</span>
        </button>

        <a href="/explore" className={`${cardBase} border-line p-5 no-underline transition hover:border-a1`}>
          <div className="mb-1.5 font-display text-[16px] font-bold text-text">I know what I need</div>
          <p className="m-0 text-[12.5px] leading-normal text-muted">
            Jump straight to faceted search — filter the full directory by type, stage, sector, country, housing,
            and application status.
          </p>
          <span className="mt-3 inline-block text-[12px] font-semibold text-a2">Browse all programs →</span>
        </a>
      </div>
    );
  }

  // ── Guided flow (one question per step) ─────────────────────────────────
  if (path === 'guided') {
    const q = QUESTIONS[step];
    const isLast = step === QUESTIONS.length - 1;
    const selectedSingle = q.key === 'willingToRelocate'
      ? relocateToValue(answers.willingToRelocate)
      : (answers[q.key] as string | undefined);
    const selectedMulti = (answers[q.key as 'supportNeeds' | 'regions'] as string[] | undefined) ?? [];

    return (
      <div className="mx-auto max-w-[680px]">
        {/* Progress */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-muted">
            <span>Question {step + 1} of {QUESTIONS.length}</span>
            <button onClick={restart} className="font-semibold text-muted hover:text-text">Start over</button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(16,16,16,.7)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, background: 'var(--grad)' }}
            />
          </div>
        </div>

        <div className={`${cardBase} border-line p-5`}>
          <h2 className="m-0 mb-1 font-display text-[18px] font-bold text-text">{q.title}</h2>
          {q.subtitle && <p className="m-0 mb-4 text-[12.5px] leading-normal text-muted">{q.subtitle}</p>}

          <div className="flex flex-col gap-2">
            {q.options.map((opt) => {
              const active =
                q.kind === 'multi' ? selectedMulti.includes(opt.value) : selectedSingle === opt.value;
              const cls = `${chipBase} ${
                active ? 'border-transparent text-[#0a0a0a]' : 'border-line2 text-text hover:border-a1'
              }`;
              const style = active ? { background: 'var(--grad)' } : undefined;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (q.kind === 'multi') {
                      toggleMulti(q.key as 'supportNeeds' | 'regions', opt.value);
                    } else if (q.key === 'willingToRelocate') {
                      patch({ willingToRelocate: valueToRelocate(opt.value) });
                    } else {
                      // Toggle off if re-clicking the same single answer.
                      patch({ [q.key]: active ? undefined : opt.value } as Partial<IntakeAnswers>);
                    }
                  }}
                  className={cls}
                  style={style}
                  aria-pressed={active}
                >
                  <span className="block font-semibold">{opt.label}</span>
                  {opt.hint && (
                    <span className={`mt-0.5 block text-[11px] font-normal ${active ? 'text-[#0a0a0a]/70' : 'text-muted'}`}>
                      {opt.hint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => (step === 0 ? setPath('choose') : setStep((s) => s - 1))}
            className="rounded-full border border-line2 px-4 py-2.5 text-[12.5px] font-semibold text-text transition hover:border-a1"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            {!isLast && (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full border border-line2 px-4 py-2.5 text-[12.5px] font-semibold text-muted transition hover:border-a1 hover:text-text"
              >
                Skip
              </button>
            )}
            <button
              onClick={() => (isLast ? setPath('results') : setStep((s) => s + 1))}
              className="rounded-full border border-transparent px-5 py-2.5 text-[12.5px] font-bold text-[#0a0a0a]"
              style={{ background: 'var(--grad)' }}
            >
              {isLast ? 'See my matches →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 font-display text-[18px] font-bold text-text">
            {recommended.length > 0
              ? `${recommended.length} program${recommended.length === 1 ? '' : 's'} worth a look`
              : 'No clean matches yet'}
          </h2>
          <p className="m-0 mt-0.5 text-[12.5px] text-muted">
            Ranked by deterministic fit across {programs.length} programs. Every match is explained — nothing hidden.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyLink}
            className="rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3.5 py-2 text-[12.5px] font-semibold text-text transition hover:border-a1"
          >
            Copy results link
          </button>
          <button
            onClick={() => {
              setPath('guided');
              setStep(0);
            }}
            className="rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3.5 py-2 text-[12.5px] font-semibold text-text transition hover:border-a1"
          >
            Edit answers
          </button>
          <button
            onClick={restart}
            className="rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3.5 py-2 text-[12.5px] font-semibold text-muted transition hover:border-a1 hover:text-text"
          >
            Start over
          </button>
        </div>
      </div>

      {!hasAnyAnswer(answers) && (
        <div className={`${cardBase} mb-5 border-line p-5`}>
          <p className="m-0 text-[13px] text-muted">
            You haven’t answered anything yet, so this is just the full directory ranked by trust and freshness.{' '}
            <button
              onClick={() => {
                setPath('guided');
                setStep(0);
              }}
              className="font-semibold text-a2 underline"
            >
              Answer a few questions
            </button>{' '}
            to get tailored, explained matches.
          </p>
        </div>
      )}

      {recommended.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((m) => {
            const program = programById.get(m.programName);
            if (!program) return null;
            return <MatchCard key={m.programId} program={program} match={m} onSelect={setSelected} />;
          })}
        </div>
      ) : (
        <div className={`${cardBase} border-line p-6 text-center`}>
          <p className="m-0 mb-3 text-[13px] text-muted">
            Every program was ruled out by a hard constraint. Try loosening a requirement — for example, allow
            relocation, widen your regions, or set urgency to “exploring”.
          </p>
          <button
            onClick={() => {
              setPath('guided');
              setStep(0);
            }}
            className="rounded-full border border-transparent px-5 py-2.5 text-[12.5px] font-bold text-[#0a0a0a]"
            style={{ background: 'var(--grad)' }}
          >
            Adjust my answers
          </button>
        </div>
      )}

      {/* Ruled-out programs — shown so founders learn *why* (transparency). */}
      {blocked.length > 0 && (
        <details className="mt-7 rounded-md border border-line bg-[rgba(16,16,16,.4)] p-4">
          <summary className="cursor-pointer text-[13px] font-semibold text-text">
            {blocked.length} program{blocked.length === 1 ? '' : 's'} ruled out — see why
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {blocked.map((m) => {
              const program = programById.get(m.programName);
              if (!program) return null;
              return <MatchCard key={m.programId} program={program} match={m} onSelect={setSelected} />;
            })}
          </div>
        </details>
      )}

      <ProgramDetailDrawer program={selected} onClose={() => setSelected(null)} />

      {copied && (
        <div
          className="fixed bottom-6 left-1/2 z-[1100] -translate-x-1/2 rounded-full px-4 py-2.5 text-[12.5px] font-bold text-[#0a0a0a]"
          style={{ background: 'var(--grad)' }}
        >
          Link copied
        </div>
      )}
    </div>
  );
}
