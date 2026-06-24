import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $applyIntent, clearApplyIntent } from '../stores/applyIntent';
import { setStage, initTracker } from '../stores/tracker';

/**
 * Bottom toast shown right after a founder clicks an Apply/Visit CTA. Offers to
 * mark the program as "Applied" in their tracker — closing the discovery → apply
 * → track loop. Auto-dismisses; mounted once globally (Base layout).
 */
export default function ApplyTrackPrompt() {
  const intent = useStore($applyIntent);

  useEffect(() => {
    initTracker();
  }, []);

  // Auto-dismiss after a few seconds.
  useEffect(() => {
    if (!intent) return;
    const id = setTimeout(clearApplyIntent, 9000);
    return () => clearTimeout(id);
  }, [intent]);

  if (!intent) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[1600] flex -translate-x-1/2 items-center gap-3 rounded-full border border-line2 bg-[rgba(12,12,12,.95)] py-2 pl-4 pr-2 shadow-[0_18px_50px_rgba(0,0,0,.6)] backdrop-blur"
    >
      <span className="text-[12.5px] text-text">
        Opened <span className="font-semibold">{intent.name}</span> — did you apply?
      </span>
      <button
        onClick={() => {
          setStage(intent.slug, 'applied');
          clearApplyIntent();
        }}
        className="rounded-full border border-transparent px-3 py-1.5 text-[12px] font-bold text-[#0a0a0a]"
        style={{ background: 'var(--grad)' }}
      >
        Mark as applied
      </button>
      <button
        onClick={clearApplyIntent}
        aria-label="Dismiss"
        className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] leading-none text-muted transition hover:text-text"
      >
        ✕
      </button>
    </div>
  );
}
