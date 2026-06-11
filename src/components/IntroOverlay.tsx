import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $introOpen, autoOpenIntro, closeIntro } from '../stores/ui';
import { PROGRAM_TYPES } from '../data/programTypes';
import FounderTriggers from './FounderTriggers';

/**
 * Dismissible intro overlay (mounted once via the layout). Auto-opens on a
 * visitor's first arrival on an entry page, reopens from the nav's About button,
 * and is always available in full at /about. Keeps the globe/list as the actual
 * front door instead of a separate landing page.
 */
export default function IntroOverlay({ autoOpen = false }: { autoOpen?: boolean }) {
  const open = useStore($introOpen);

  useEffect(() => {
    if (autoOpen) autoOpenIntro();
  }, [autoOpen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeIntro();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto p-4 sm:items-center" role="presentation">
      <button aria-label="Close" onClick={closeIntro} className="fixed inset-0 cursor-default bg-black/65" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="About Founder Atlas"
        className="relative z-[1] w-full max-w-[680px] rounded-[3px] border border-line2 bg-[#0b0e1c] p-7 shadow-[0_30px_80px_rgba(0,0,0,.7)]"
      >
        <button
          onClick={closeIntro}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-[3px] border border-line2 px-2 py-1 text-[14px] leading-none text-muted hover:text-text"
        >
          ✕
        </button>

        <div className="mb-1.5 font-display text-[10.5px] font-semibold uppercase tracking-[.22em] text-a2">
          Founder Atlas
        </div>
        <h2 className="m-0 mb-2.5 max-w-[520px] font-display text-[22px] font-bold leading-[1.12] text-text">
          Find the right startup program for your next move.
        </h2>
        <p className="m-0 mb-5 max-w-[560px] text-[13.5px] leading-relaxed text-muted">
          A live map of accelerators, incubators, residencies, hacker houses and fellowships worldwide —
          filter by stage, sector, funding, location and application status to find what fits where you are now.
        </p>

        <div className="mb-5">
          <FounderTriggers mode="link" onNavigate={closeIntro} />
        </div>

        <div className="mb-2 font-display text-[12px] font-semibold uppercase tracking-wide text-muted">
          …or by program type
        </div>
        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROGRAM_TYPES.map((t) => (
            <a
              key={t.name}
              href={`/explore?q=${encodeURIComponent(t.q)}`}
              onClick={closeIntro}
              className="rounded-[3px] border border-line bg-[rgba(10,13,28,.55)] p-3 no-underline transition hover:border-a1"
            >
              <div className="font-display text-[13px] font-bold text-text">{t.name}</div>
              <div className="mt-0.5 text-[11.5px] leading-snug text-muted">{t.best}</div>
            </a>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={closeIntro}
            className="rounded-[3px] border border-transparent px-4 py-2.5 font-display text-[13px] font-bold text-[#08101f]"
            style={{ background: 'var(--grad)' }}
          >
            Start exploring
          </button>
          <a
            href="/explore"
            onClick={closeIntro}
            className="rounded-[3px] border border-line2 px-4 py-2.5 text-[13px] font-semibold text-text no-underline transition hover:border-a1"
          >
            Browse the list
          </a>
          <a href="/about" className="text-[12.5px] font-semibold text-a2 no-underline hover:underline">
            Full guide →
          </a>
        </div>
      </div>
    </div>
  );
}
