import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { programSlug } from '../data/programs';
import { $saved, initSaved } from '../stores/saved';
import { $tracker, initTracker } from '../stores/tracker';
import { TRACK_STAGES, trackStageMeta, DEFAULT_STAGE, type TrackStage } from '../lib/tracker';
import { defaultSort } from '../lib/filter';
import ProgramCard from './ProgramCard';
import TrackControls from './TrackControls';
import ProgramDetailDrawer from './ProgramDetailDrawer';

export default function SavedList({ programs }: { programs: Program[] }) {
  const saved = useStore($saved);
  const tracker = useStore($tracker);
  const [selected, setSelected] = useState<Program | null>(null);

  useEffect(() => {
    initSaved();
    initTracker();
  }, []);

  const shown = useMemo(
    () => defaultSort(programs.filter((p) => saved.includes(programSlug(p.name)))),
    [programs, saved],
  );

  // Bucket the shortlist by tracked stage (untracked → the default "Interested").
  const byStage = useMemo(() => {
    const groups = new Map<TrackStage, Program[]>();
    for (const stage of TRACK_STAGES) groups.set(stage, []);
    for (const p of shown) {
      const stage = tracker[programSlug(p.name)]?.stage ?? DEFAULT_STAGE;
      groups.get(stage)!.push(p);
    }
    return groups;
  }, [shown, tracker]);

  return (
    <div>
      <div className="mb-4 text-[12px] font-semibold text-muted" aria-live="polite">
        {shown.length} saved place{shown.length === 1 ? '' : 's'}
        {shown.length > 0 && ' · set a stage and a private note to track where you are'}
      </div>

      {shown.length === 0 ? (
        <div className="relative overflow-hidden rounded-md border border-line bg-[rgba(16,16,16,.55)] p-10 text-center">
          <span
            className="orbit-ring orbit-ring--node orbit-ring--spin pointer-events-none absolute left-1/2 top-6 h-16 w-16 -translate-x-1/2 opacity-30"
            aria-hidden="true"
          />
          <h2 className="relative m-0 mb-1.5 mt-12 font-display text-[16px] font-bold text-text">Your constellation is empty</h2>
          <p className="relative m-0 mb-4 text-[13px] text-muted">
            Browse the houses and tap the <span className="text-a2">☆</span> to pull a few into your shortlist. Kept on this
            device only.
          </p>
          <a
            href="/explore"
            className="relative inline-block rounded-full border border-line2 px-4 py-2.5 text-[13px] font-semibold text-text no-underline transition hover:border-a1"
          >
            Browse houses
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-7">
          {TRACK_STAGES.map((stage) => {
            const items = byStage.get(stage)!;
            if (items.length === 0) return null;
            const meta = trackStageMeta(stage);
            return (
              <section key={stage}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
                  <h2 className="m-0 font-display text-[14px] font-bold text-text">{meta.label}</h2>
                  <span className="text-[11px] font-semibold text-muted">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => (
                    <div key={(p.canonicalType ?? 'other') + '|' + p.name} className="flex flex-col">
                      <ProgramCard program={p} onSelect={setSelected} />
                      <TrackControls slug={programSlug(p.name)} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <ProgramDetailDrawer program={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
