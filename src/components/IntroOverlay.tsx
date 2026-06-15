import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $introOpen, autoOpenIntro, closeIntro } from '../stores/ui';

/**
 * Dismissible About / intro overlay (mounted once via the layout). Auto-opens on
 * a visitor's first arrival, reopens from the nav's About button. Intentionally
 * simple — just what Orbital is and why it exists — since all the real
 * interaction lives on the globe itself.
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
        aria-label="About Orbital"
        className="relative z-[1] w-full max-w-[520px] rounded-[3px] border border-line2 bg-[#0c0c0c] p-7 shadow-[0_30px_80px_rgba(0,0,0,.7)]"
      >
        <button
          onClick={closeIntro}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-[3px] border border-line2 px-2 py-1 text-[14px] leading-none text-muted transition hover:text-text"
        >
          ✕
        </button>

        <div className="mb-1.5 inline-flex items-center gap-1.5 font-display text-[10.5px] font-semibold uppercase tracking-[.22em] text-a2">
          <span className="orbit-node" aria-hidden="true" />
          Orbital
        </div>
        <h2 className="m-0 mb-3 max-w-[440px] font-display text-[22px] font-bold leading-[1.12] text-text">
          Where founders gather.
        </h2>

        <div className="flex flex-col gap-3 text-[13.5px] leading-relaxed text-muted">
          <p className="m-0">
            Orbital is a live map of the residencies, hacker houses and co-living programs where founders
            actually live and build together — the places with enough gravity to pull people across the world.
          </p>
          <p className="m-0">
            Spin the globe to see where these communities cluster, click a point to read what it is and how to
            join, and open a dense city's minimap to zoom in. Switch to <span className="text-text">List</span> any
            time to search and filter every program.
          </p>
          <p className="m-0">
            It exists because this information is scattered across group chats, threads and dead links. Orbital
            keeps it in one place, verified and current, so you can find your people and go build.
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={closeIntro}
            className="rounded-full border border-transparent px-4 py-2.5 font-display text-[13px] font-bold text-[#0a0a0a] transition active:scale-95"
            style={{ background: 'var(--grad)' }}
          >
            Enter orbit
          </button>
        </div>
      </div>
    </div>
  );
}
