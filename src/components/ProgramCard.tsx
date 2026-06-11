import type { Program } from '../data/programs';
import { programSlug } from '../data/programs';
import Logo from './Logo';
import StatusBadge from './StatusBadge';
import LivingModelBadge from './LivingModelBadge';
import SaveButton from './SaveButton';

/** Apply link prefers an explicit applyUrl, else the program's site. */
export function applyHref(p: Program): string {
  return p.applyUrl || p.url;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm border border-line2 px-2 py-0.5 text-[10.5px] font-semibold text-muted">{children}</span>
  );
}

/**
 * Founder-facing program card (handoff §12). Shows what we know; founder-schema
 * fields that aren't filled yet simply don't render as badges (the drawer spells
 * out "Unknown" explicitly). "Why it matters" reuses the existing highlight.
 */
export default function ProgramCard({ program: p, onSelect }: { program: Program; onSelect: (p: Program) => void }) {
  return (
    <article className="flex flex-col rounded-md border border-line bg-[rgba(10,13,28,.55)] p-4 transition hover:border-a1">
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
            {p.type} · {p.city}, {p.country}
          </div>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <StatusBadge status={p.status} />
          <SaveButton slug={programSlug(p.name)} name={p.name} />
        </div>
      </div>

      {p.highlight && <p className="m-0 mb-3 line-clamp-2 text-[12px] leading-normal text-muted">{p.highlight}</p>}

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <LivingModelBadge format={p.format} />
        {p.stage && <Badge>{p.stage}</Badge>}
        {p.providesHousing === true && <Badge>Housing</Badge>}
        {p.fundingAmount && <Badge>{p.fundingAmount}</Badge>}
        {p.equityTaken && <Badge>{p.equityTaken} equity</Badge>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-[10.5px] text-muted">
          {p.lastVerified ? `Verified ${p.lastVerified}` : 'Not yet verified'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(p)}
            className="rounded-sm border border-line2 px-2.5 py-1.5 text-[11.5px] font-semibold text-text transition hover:border-a1"
          >
            View details
          </button>
          <a
            href={applyHref(p)}
            target="_blank"
            rel="noopener"
            className="rounded-sm border border-transparent px-2.5 py-1.5 text-[11.5px] font-bold text-[#08101f] no-underline"
            style={{ background: 'var(--grad)' }}
          >
            {p.applyUrl ? 'Apply' : 'Visit'}
          </a>
        </div>
      </div>
    </article>
  );
}
