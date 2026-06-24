import { useEffect, useRef } from 'react';
import type { Program } from '../data/programs';
import { programSlug } from '../data/programs';
import Logo from './Logo';
import StatusBadge from './StatusBadge';
import CompareButton from './CompareButton';
import { applyHref } from './ProgramCard';
import { noteApplyIntent } from '../stores/applyIntent';
import { applyUrgency } from '../lib/applyUrgency';
import { livingModelLabel } from '../lib/living';
import { UNKNOWN, displayVal as val, displayBool as boolVal, displayDuration as duration } from '../lib/display';

function Fact({ label, value }: { label: string; value: string }) {
  const unknown = value === UNKNOWN;
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`m-0 mt-0.5 text-[12.5px] ${unknown ? 'italic text-muted/70' : 'text-text'}`}>{value}</dd>
    </div>
  );
}

/**
 * Program detail drawer / bottom-sheet (handoff §13). Honest about missing data:
 * every quick fact shows "Unknown" when the founder-schema value isn't filled.
 * Accessible: aria-modal, Esc to close, focus moves into the panel on open.
 */
export default function ProgramDetailDrawer({ program: p, onClose }: { program: Program | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!p) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [p, onClose]);

  if (!p) return null;
  const sources = p.sourceUrls ?? [];
  const slug = programSlug(p.name);
  const urgency = applyUrgency(slug, p.status);

  return (
    <div className="fixed inset-0 z-[1000]" role="presentation">
      <button aria-label="Close details" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/55" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${p.name} details`}
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line2 bg-[#0c0c0c] shadow-[0_24px_70px_rgba(0,0,0,.65)] max-[480px]:max-w-full"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-line p-5">
          <Logo name={p.name} domain={p.domain} size={48} />
          <div className="min-w-0 flex-1">
            <h2 className="m-0 font-display text-[17px] font-bold leading-tight text-text">{p.name}</h2>
            <div className="mt-1 text-[12px] text-muted">
              {p.type} · {p.city}, {p.country}
            </div>
            <div className="mt-1 text-[11.5px] text-muted">Run by {p.operator || UNKNOWN}</div>
            <div className="mt-2">
              <StatusBadge status={p.status} full />
            </div>
          </div>
          <div className="flex flex-none items-center gap-1.5">
            <CompareButton slug={slug} name={p.name} />
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="rounded-sm border border-line2 px-2 py-1 text-[14px] leading-none text-muted hover:text-text"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* CTAs */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <a
              href={applyHref(p)}
              target="_blank"
              rel="noopener"
              onClick={() => noteApplyIntent({ slug, name: p.name })}
              className="rounded-full border border-transparent px-4 py-2.5 font-display text-[13px] font-bold text-[#0a0a0a] no-underline"
              style={{ background: 'var(--grad)' }}
            >
              {p.applyUrl ? 'Apply' : 'Visit site'} →
            </a>
            {urgency && (
              <span className="inline-flex items-center rounded-full border border-a2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-a2">
                {urgency.label}
              </span>
            )}
            {p.applyUrl && (
              <a
                href={p.url}
                target="_blank"
                rel="noopener"
                className="rounded-full border border-line2 px-4 py-2.5 text-[13px] font-semibold text-text no-underline transition hover:border-a1"
              >
                Visit site
              </a>
            )}
            <a
              href={`/programs/${programSlug(p.name)}`}
              className="rounded-full border border-line2 px-4 py-2.5 text-[13px] font-semibold text-text no-underline transition hover:border-a1"
            >
              Open full page ↗
            </a>
            <a
              href={`/submit?program=${encodeURIComponent(p.name)}&mode=update`}
              className="rounded-full border border-line2 px-4 py-2.5 text-[13px] font-semibold text-muted no-underline transition hover:border-a1 hover:text-text"
            >
              Report update
            </a>
          </div>

          <div className="orbit-divider my-5" aria-hidden="true" />

          {/* Quick facts */}
          <h3 className="m-0 mb-2 font-display text-[13px] font-bold text-text">Quick facts</h3>
          <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Stage fit" value={(p.stageFit && p.stageFit.join(', ')) || val(p.stage)} />
            <Fact label="Sector" value={(p.sectorFocus && p.sectorFocus.join(', ')) || val(p.focus)} />
            <Fact label="Living model" value={livingModelLabel(p.format) ?? UNKNOWN} />
            <Fact label="Duration" value={duration(p)} />
            <Fact label="Housing" value={boolVal(p.providesHousing)} />
            <Fact label="Workspace" value={boolVal(p.providesWorkspace)} />
            <Fact label="Funding" value={val(p.fundingAmount)} />
            <Fact label="Equity" value={val(p.equityTaken)} />
            <Fact label="Cost" value={val(p.cost)} />
            <Fact label="Cohort size" value={val(p.cohortSize)} />
            <Fact label="Deadline" value={val(p.applicationDeadline)} />
            <Fact label="Last verified" value={val(p.lastVerified)} />
          </dl>

          <div className="orbit-divider my-5" aria-hidden="true" />

          {/* Best for */}
          <h3 className="m-0 mb-2 font-display text-[13px] font-bold text-text">Best for</h3>
          <p className="m-0 mb-5 text-[12.5px] leading-normal text-muted">
            {p.founderFit && p.founderFit.length ? p.founderFit.join(', ') : 'Not yet categorized — verify on the official site.'}
          </p>

          {/* Notes */}
          {(p.highlight || p.status_detail || p.notes) && (
            <>
              <h3 className="m-0 mb-2 font-display text-[13px] font-bold text-text">Notes</h3>
              {p.highlight && <p className="m-0 mb-2 text-[12.5px] leading-normal text-muted">{p.highlight}</p>}
              {p.status_detail && <p className="m-0 mb-2 text-[12.5px] leading-normal text-muted">{p.status_detail}</p>}
              {p.notes && <p className="m-0 mb-2 text-[12.5px] leading-normal text-muted">{p.notes}</p>}
            </>
          )}

          <div className="orbit-divider my-5" aria-hidden="true" />

          {/* Sources */}
          <h3 className="m-0 mb-2 font-display text-[13px] font-bold text-text">Sources</h3>
          <ul className="orbit-list m-0 mb-2 list-none p-0 text-[12px]">
            <li>
              <a href={p.url} target="_blank" rel="noopener" className="text-a2">Official site</a>
            </li>
            {sources.map((s) => (
              <li key={s} className="mt-1">
                <a href={s} target="_blank" rel="noopener" className="break-all text-a2">{s}</a>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-[11px] italic text-muted">
            Last checked: {val(p.lastVerified)}. Application status and terms change often — confirm on the official site before applying.
          </p>
        </div>
      </div>
    </div>
  );
}
