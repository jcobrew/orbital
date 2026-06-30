import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { programSlug } from '../data/programs';
import { $compare, $compareOpen, initCompare, removeCompare, closeCompare } from '../stores/compare';
import { livingModelLabel } from '../lib/living';
import { UNKNOWN, displayVal, displayBool, displayDuration } from '../lib/display';
import { applyHref } from './ProgramCard';
import { noteApplyIntent } from '../stores/applyIntent';
import Logo from './Logo';
import StatusBadge from './StatusBadge';

/** One comparable aspect: a label + how to render it for a given program. */
const ASPECTS: { label: string; get: (p: Program) => string }[] = [
  { label: 'Living model', get: (p) => livingModelLabel(p.format) ?? UNKNOWN },
  { label: 'Location', get: (p) => [p.city, p.country].filter(Boolean).join(', ') || UNKNOWN },
  { label: 'Stage fit', get: (p) => (p.stageFit && p.stageFit.join(', ')) || displayVal(p.stage) },
  { label: 'Sector', get: (p) => (p.sectorFocus && p.sectorFocus.join(', ')) || displayVal(p.focus) },
  { label: 'Duration', get: (p) => displayDuration(p) },
  { label: 'Cohort size', get: (p) => displayVal(p.cohortSize) },
  { label: 'Funding', get: (p) => displayVal(p.fundingAmount) },
  { label: 'Equity', get: (p) => displayVal(p.equityTaken) },
  { label: 'Cost', get: (p) => displayVal(p.cost) },
  { label: 'Housing', get: (p) => displayBool(p.providesHousing) },
  { label: 'Workspace', get: (p) => displayBool(p.providesWorkspace) },
  { label: 'Funding provided', get: (p) => displayBool(p.providesFunding) },
  { label: 'Mentorship', get: (p) => displayBool(p.providesMentorship) },
  { label: 'Investor access', get: (p) => displayBool(p.providesInvestorAccess) },
  { label: 'Demo day', get: (p) => displayBool(p.providesDemoDay) },
  { label: 'Visa support', get: (p) => displayBool(p.providesVisaSupport) },
  { label: 'Last verified', get: (p) => displayVal(p.lastVerified) },
];

/**
 * Full-screen side-by-side comparison of the selected programs. Reuses the same
 * display helpers as the detail drawer/program page so values never drift. Rows
 * whose values differ across programs get a "differs" marker so trade-offs pop.
 * A11y shell mirrors ProgramDetailDrawer (aria-modal, Esc, scrim, focus-in).
 */
export default function CompareDrawer({ programs }: { programs: Program[] }) {
  const slugs = useStore($compare);
  const open = useStore($compareOpen);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    initCompare();
  }, []);

  const cols = useMemo(() => {
    const bySlug = new Map<string, Program>();
    for (const p of programs) bySlug.set(programSlug(p.name), p);
    return slugs.map((s) => bySlug.get(s)).filter((p): p is Program => !!p);
  }, [programs, slugs]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCompare();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Nothing left to compare → close.
  useEffect(() => {
    if (open && cols.length === 0) closeCompare();
  }, [open, cols.length]);

  if (!open || cols.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[1500]" role="presentation">
      <button aria-label="Close comparison" onClick={closeCompare} className="absolute inset-0 h-full w-full cursor-default bg-black/65" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compare programs"
        className="absolute left-1/2 top-1/2 flex max-h-[92vh] w-[min(1040px,96vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line2 bg-[#0c0c0c] shadow-[0_30px_80px_rgba(0,0,0,.7)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="m-0 font-display text-[16px] font-bold text-text">
            Compare <span className="text-muted">· {cols.length} program{cols.length === 1 ? '' : 's'}</span>
          </h2>
          <button
            ref={closeRef}
            onClick={closeCompare}
            aria-label="Close"
            className="rounded-sm border border-line2 px-2 py-1 text-[14px] leading-none text-muted hover:text-text"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-[2] min-w-[120px] border-b border-line2 bg-[#0c0c0c] px-3 py-3 text-left align-bottom" />
                {cols.map((p) => (
                  <th
                    key={programSlug(p.name)}
                    scope="col"
                    className="sticky top-0 z-[1] min-w-[180px] border-b border-l border-line2 bg-[#0c0c0c] px-3 py-3 text-left align-top"
                  >
                    <div className="flex items-start gap-2">
                      <Logo name={p.name} domain={p.domain} size={28} />
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/programs/${programSlug(p.name)}`}
                          className="block truncate font-display text-[13px] font-bold text-text no-underline hover:text-a2"
                        >
                          {p.name}
                        </a>
                        <div className="mt-0.5 truncate text-[11px] text-muted">{p.type}</div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${p.name} from compare`}
                        onClick={() => removeCompare(programSlug(p.name))}
                        className="flex-none rounded-full px-1 text-[12px] leading-none text-muted transition hover:text-text"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <StatusBadge status={p.status} />
                    </div>
                    <a
                      href={applyHref(p)}
                      target="_blank"
                      rel="noopener"
                      onClick={() => noteApplyIntent({ slug: programSlug(p.name), name: p.name })}
                      className="mt-2 inline-block rounded-full border border-transparent px-2.5 py-1 text-[11px] font-bold text-[#0a0a0a] no-underline"
                      style={{ background: 'var(--grad)' }}
                    >
                      {p.applyUrl ? 'Apply' : 'Visit'} →
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASPECTS.map((row) => {
                const vals = cols.map((p) => row.get(p));
                const differs = cols.length > 1 && new Set(vals).size > 1;
                return (
                  <tr key={row.label} className={differs ? 'bg-[rgba(255,255,255,.025)]' : undefined}>
                    <th
                      scope="row"
                      className="sticky left-0 z-[1] border-b border-line bg-[#0c0c0c] px-3 py-2.5 text-left align-top font-display text-[10.5px] font-semibold uppercase tracking-wide text-muted"
                    >
                      {row.label}
                      {differs && (
                        <span className="ml-1 align-middle text-a2" title="Values differ across these programs">
                          •
                        </span>
                      )}
                    </th>
                    {cols.map((p, i) => {
                      const v = vals[i];
                      const unknown = v === UNKNOWN;
                      return (
                        <td
                          key={programSlug(p.name)}
                          className={`border-b border-l border-line px-3 py-2.5 align-top ${
                            unknown ? 'italic text-muted/70' : 'text-text'
                          }`}
                        >
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
