import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { passes, defaultSort } from '../lib/filter';
import { $filters, initFiltersFromURL } from '../stores/filters';
import ProgramCard from './ProgramCard';
import ProgramDetailDrawer from './ProgramDetailDrawer';

export default function ExploreResults({ programs }: { programs: Program[] }) {
  const filters = useStore($filters);
  const [selected, setSelected] = useState<Program | null>(null);

  useEffect(() => {
    initFiltersFromURL();
  }, []);

  const shown = useMemo(() => defaultSort(programs.filter((p) => passes(p, filters))), [programs, filters]);

  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold text-muted" aria-live="polite">
        {shown.length} of {programs.length} houses & residencies
      </div>

      {shown.length === 0 ? (
        <div className="relative overflow-hidden rounded-md border border-line bg-[rgba(10,13,28,.55)] p-10 text-center">
          <span
            className="orbit-ring orbit-ring--node orbit-ring--spin pointer-events-none absolute left-1/2 top-6 h-16 w-16 -translate-x-1/2 opacity-30"
            aria-hidden="true"
          />
          <h2 className="relative m-0 mb-1.5 mt-12 font-display text-[16px] font-bold text-text">Nothing in this orbit yet</h2>
          <p className="relative m-0 mb-4 text-[13px] text-muted">
            Loosen a filter, search a nearby city, or point us at a house we haven't mapped.
          </p>
          <a
            href="/submit"
            className="relative inline-block rounded-full border border-line2 px-4 py-2.5 text-[13px] font-semibold text-text no-underline transition hover:border-a1"
          >
            Add a house
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
