import type { Program } from '../../data/programs';
import { programSlug } from '../../data/programs';
import type { ProgramMatch } from '../../lib/matching';
import Logo from '../Logo';
import StatusBadge from '../StatusBadge';
import { applyHref } from '../ProgramCard';
import { noteApplyIntent } from '../../stores/applyIntent';
import { applyUrgency } from '../../lib/applyUrgency';

/** Apply-link target, reusing ProgramCard's helper (read-only import). */

function ReasonRow({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <li className="flex items-start gap-2 text-[12px] leading-snug">
      <span aria-hidden className="mt-px flex-none font-bold" style={{ color }}>
        {icon}
      </span>
      <span className="text-muted">{text}</span>
    </li>
  );
}

/**
 * Founder-discovery match card. Renders the engine's explanation for ONE program:
 * a fit score, why-matched reasons, hard blockers, cautions, application status +
 * freshness, and the single suggested next step. Reuses StatusBadge read-only.
 *
 * Disqualified programs are still shown (so the founder learns *why*), but visually
 * de-emphasized.
 */
export default function MatchCard({
  program: p,
  match: m,
  onSelect,
}: {
  program: Program;
  match: ProgramMatch;
  onSelect: (p: Program) => void;
}) {
  const disqualified = m.disqualifiers.length > 0;
  const slug = programSlug(p.name);
  const urgency = applyUrgency(slug, p.status);

  return (
    <article
      className={`orbit-hover flex flex-col rounded-md border bg-[rgba(16,16,16,.55)] p-4 transition ${
        disqualified ? 'border-line opacity-70' : 'border-line hover:border-a1'
      }`}
    >
      {/* Header: logo · name/type · score + status */}
      <div className="mb-2.5 flex items-start gap-3">
        <Logo name={p.name} domain={p.domain} size={40} />
        <div className="min-w-0 flex-1">
          <a
            href={`/programs/${programSlug(p.name)}`}
            className="block max-w-full truncate text-[14px] font-semibold text-text no-underline hover:text-a2"
          >
            {p.name}
          </a>
          <div className="mt-0.5 truncate text-[11.5px] text-muted">
            {p.type} · {p.city ? `${p.city}, ` : ''}{p.country}
          </div>
        </div>
        <div className="flex flex-none flex-col items-end gap-1.5">
          {disqualified ? (
            <span className="rounded-full border border-[#ff7a7a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ff7a7a]">
              Not a fit
            </span>
          ) : (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold text-[#0a0a0a]"
              style={{ background: 'var(--grad)' }}
              title="Deterministic fit score (0–100)"
            >
              {m.score}% fit
            </span>
          )}
          <StatusBadge status={p.status} />
        </div>
      </div>

      {/* Why matched */}
      {m.reasons.length > 0 && (
        <div className="mb-2.5">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Why this might fit</div>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {m.reasons.map((r) => (
              <ReasonRow key={r.code} icon="✓" color="#6ee7a8" text={r.text} />
            ))}
          </ul>
        </div>
      )}

      {/* Blockers (hard disqualifiers) */}
      {disqualified && (
        <div className="mb-2.5">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#ff7a7a]">Blockers</div>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {m.disqualifiers.map((r) => (
              <ReasonRow key={r.code} icon="✕" color="#ff7a7a" text={r.text} />
            ))}
          </ul>
        </div>
      )}

      {/* Cautions */}
      {m.cautions.length > 0 && (
        <div className="mb-2.5">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#ffc24b]">Potential tradeoffs</div>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {m.cautions.map((r) => (
              <ReasonRow key={r.code} icon="!" color="#ffc24b" text={r.text} />
            ))}
          </ul>
        </div>
      )}

      {m.reasons.length === 0 && !disqualified && m.cautions.length === 0 && (
        <p className="m-0 mb-2.5 text-[12px] italic text-muted">
          No strong signal either way — open the program to judge fit yourself.
        </p>
      )}

      {/* Next step */}
      <p className="m-0 mb-3 rounded-sm border border-line2 bg-[rgba(16,16,16,.5)] px-2.5 py-2 text-[11.5px] leading-snug text-muted">
        <span className="font-semibold text-text">Suggested next step: </span>
        {m.suggestedNextStep}
      </p>

      {/* Footer: freshness + CTAs */}
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[10.5px] text-muted">
          {urgency ? (
            <span className="font-semibold text-a2">{urgency.label}</span>
          ) : p.lastVerified ? (
            `Verified ${p.lastVerified}`
          ) : (
            'Not yet verified'
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(p)}
            className="rounded-full border border-line2 px-2.5 py-1.5 text-[11.5px] font-semibold text-text transition hover:border-a1"
          >
            View details
          </button>
          <a
            href={applyHref(p)}
            target="_blank"
            rel="noopener"
            onClick={() => noteApplyIntent({ slug, name: p.name })}
            className="rounded-full border border-transparent px-2.5 py-1.5 text-[11.5px] font-bold text-[#0a0a0a] no-underline"
            style={{ background: 'var(--grad)' }}
          >
            {p.applyUrl ? 'Apply' : 'Visit'}
          </a>
        </div>
      </div>
    </article>
  );
}
