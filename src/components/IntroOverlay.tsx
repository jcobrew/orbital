import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $introOpen, autoOpenIntro, closeIntro } from '../stores/ui';

/**
 * Dismissible intro overlay (mounted once via the layout). Auto-opens on a
 * visitor's first arrival, then doesn't reappear; the persistent entry point is
 * the Story page in the nav. Intentionally minimal — a one-line hook and two
 * buttons — since all the real interaction lives on the globe itself.
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
          Find your place to build.
        </h2>

        <p className="m-0 max-w-[440px] text-[13.5px] leading-relaxed text-muted">
          A live map of the residencies, hacker houses and co-living programs where founders live and build
          together. Find your people — anywhere in the world.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <button
            onClick={closeIntro}
            className="rounded-full border border-transparent px-4 py-2.5 font-display text-[13px] font-bold text-[#0a0a0a] transition active:scale-95"
            style={{ background: 'var(--grad)' }}
          >
            Enter orbit
          </button>
          <a
            href="/story"
            onClick={closeIntro}
            className="rounded-full border border-line2 px-4 py-2.5 font-display text-[13px] font-semibold text-text no-underline transition hover:border-a1"
          >
            Read the story →
          </a>
        </div>
      </div>
    </div>
  );
}
