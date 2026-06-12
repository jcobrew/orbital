import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { programSlug } from '../data/programs';
import { $saved, initSaved } from '../stores/saved';
import { defaultSort } from '../lib/filter';
import ProgramCard from './ProgramCard';
import ProgramDetailDrawer from './ProgramDetailDrawer';

export default function SavedList({ programs }: { programs: Program[] }) {
  const saved = useStore($saved);
  const [selected, setSelected] = useState<Program | null>(null);

  useEffect(() => {
    initSaved();
  }, []);

  const shown = useMemo(
    () => defaultSort(programs.filter((p) => saved.includes(programSlug(p.name)))),
    [programs, saved],
  );

  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold text-muted" aria-live="polite">
        {shown.length} saved program{shown.length === 1 ? '' : 's'}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-md border border-line bg-[rgba(10,13,28,.55)] p-10 text-center">
          <h2 className="m-0 mb-1.5 font-display text-[16px] font-bold text-text">Nothing saved yet</h2>
          <p className="m-0 mb-4 text-[13px] text-muted">
            Browse programs and tap the <span className="text-a2">☆</span> to build a shortlist. It's stored on this
            device only.
          </p>
          <a
            href="/explore"
            className="inline-block rounded-md border border-line2 px-4 py-2.5 text-[13px] font-semibold text-text no-underline transition hover:border-a1"
          >
            Browse programs
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <ProgramCard key={(p.canonicalType ?? 'other') + '|' + p.name} program={p} onSelect={setSelected} />
          ))}
        </div>
      )}

      <ProgramDetailDrawer program={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
