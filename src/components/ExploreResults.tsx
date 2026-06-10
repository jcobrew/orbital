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
        {shown.length} of {programs.length} programs
      </div>

      {shown.length === 0 ? (
        <div className="rounded-md border border-line bg-[rgba(10,13,28,.55)] p-10 text-center">
          <h2 className="m-0 mb-1.5 font-display text-[16px] font-bold text-text">No matching programs yet</h2>
          <p className="m-0 mb-4 text-[13px] text-muted">
            Try removing a filter, searching a nearby city, or submitting a program we missed.
          </p>
          <a
            href="/explore?intent=submit"
            className="inline-block rounded-md border border-line2 px-4 py-2.5 text-[13px] font-semibold text-text no-underline transition hover:border-a1"
          >
            Submit a program
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <ProgramCard key={p.dataset + '|' + p.name} program={p} onSelect={setSelected} />
          ))}
        </div>
      )}

      <ProgramDetailDrawer program={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
