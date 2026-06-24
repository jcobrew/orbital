import { useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { programSlug } from '../data/programs';
import {
  $compare,
  $compareOpen,
  initCompare,
  removeCompare,
  clearCompare,
  openCompare,
} from '../stores/compare';
import Logo from './Logo';

/**
 * Floating bottom tray showing the current compare selection. Hidden when empty
 * or while the compare drawer is open. Mounted once globally (Base layout) so it
 * follows the user across pages; the selection itself lives in sessionStorage.
 */
export default function CompareTray({ programs }: { programs: Program[] }) {
  const slugs = useStore($compare);
  const open = useStore($compareOpen);
  useEffect(() => {
    initCompare();
  }, []);

  const bySlug = useMemo(() => {
    const m = new Map<string, Program>();
    for (const p of programs) m.set(programSlug(p.name), p);
    return m;
  }, [programs]);

  if (open || slugs.length === 0) return null;

  const selected = slugs.map((s) => ({ slug: s, program: bySlug.get(s) }));

  return (
    <div className="fixed inset-x-0 bottom-0 z-[900] flex justify-center px-3 pb-3" role="region" aria-label="Compare selection">
      <div className="flex w-full max-w-[920px] flex-wrap items-center gap-2 rounded-2xl border border-line2 bg-[rgba(12,12,12,.92)] p-2.5 shadow-[0_18px_50px_rgba(0,0,0,.6)] backdrop-blur">
        <span className="px-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Compare
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selected.map(({ slug, program }) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(255,255,255,.06)] py-0.5 pl-1 pr-1.5 text-[12px] font-semibold text-text"
            >
              {program && <Logo name={program.name} domain={program.domain} size={18} />}
              <span className="max-w-[140px] truncate">{program?.name ?? slug}</span>
              <button
                type="button"
                aria-label={`Remove ${program?.name ?? slug} from compare`}
                onClick={() => removeCompare(slug)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-[11px] leading-none text-muted transition hover:bg-[rgba(255,255,255,.12)] hover:text-text"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={clearCompare}
          className="rounded-full border border-line2 px-3 py-2 text-[12px] font-semibold text-muted transition hover:border-a1 hover:text-text"
        >
          Clear
        </button>
        <button
          onClick={openCompare}
          disabled={slugs.length < 2}
          title={slugs.length < 2 ? 'Add at least two programs to compare' : 'Compare side by side'}
          className="rounded-full border border-transparent px-4 py-2 text-[12.5px] font-bold text-[#0a0a0a] transition disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--grad)' }}
        >
          Compare {slugs.length}
        </button>
      </div>
    </div>
  );
}
