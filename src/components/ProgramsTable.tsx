import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'motion/react';
import type { Program } from '../data/programs';
import { programTypeLabel } from '../data/programs';
import { passes, sortPrograms, type SortKey } from '../lib/filter';
import { $filters, initFiltersFromURL } from '../stores/filters';
import Logo from './Logo';
import StatusBadge from './StatusBadge';

interface Column {
  key: SortKey;
  label: string;
  sortable?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Program' },
  { key: 'type', label: 'Type' },
  { key: 'canonicalType', label: 'Category' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'status', label: 'Status' },
  { key: 'focus', label: 'Focus' },
  { key: 'stage', label: 'Stage' },
  { key: 'url', label: 'Apply', sortable: false },
];

/** Update only sort/dir in the URL, preserving filter params. */
function syncSortToURL(sort: SortKey, dir: 1 | -1) {
  const u = new URLSearchParams(location.search);
  if (sort === 'status') u.delete('sort');
  else u.set('sort', sort);
  if (dir === 1) u.delete('dir');
  else u.set('dir', '-1');
  const qs = u.toString();
  history.replaceState(null, '', qs ? location.pathname + '?' + qs : location.pathname);
}

export default function ProgramsTable({ programs }: { programs: Program[] }) {
  const filters = useStore($filters);
  const [sort, setSort] = useState<SortKey>('status');
  const [dir, setDir] = useState<1 | -1>(1);

  useEffect(() => {
    initFiltersFromURL();
    const u = new URLSearchParams(location.search);
    if (u.get('sort')) setSort(u.get('sort') as SortKey);
    if (u.get('dir') === '-1') setDir(-1);
  }, []);

  const rows = useMemo(
    () => sortPrograms(programs.filter((p) => passes(p, filters)), sort, dir),
    [programs, filters, sort, dir],
  );

  function onSort(col: Column) {
    if (col.sortable === false) return;
    const nextDir: 1 | -1 = sort === col.key ? ((dir * -1) as 1 | -1) : 1;
    const nextSort = col.key;
    setSort(nextSort);
    setDir(nextDir);
    syncSortToURL(nextSort, nextDir);
  }

  const total = !filters.type ? programs.length : programs.filter((p) => p.canonicalType === filters.type).length;

  return (
    <div>
      <div className="mb-2.5 text-[11.5px] font-semibold tracking-wide text-muted">
        Showing <code className="rounded bg-[rgba(8,10,22,.6)] px-1.5 py-px text-[11px] text-a2">{rows.length}</code> of{' '}
        <code className="rounded bg-[rgba(8,10,22,.6)] px-1.5 py-px text-[11px] text-a2">{total}</code> programs
        {filters.type && (
          <>
            {' '}in <code className="rounded bg-[rgba(8,10,22,.6)] px-1.5 py-px text-[11px] text-a2">{programTypeLabel(filters.type)}</code>
          </>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-line bg-[rgba(10,13,28,.55)]">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  onClick={() => onSort(col)}
                  className={`sticky top-0 whitespace-nowrap border-b border-line2 bg-[rgba(14,14,14,.96)] px-3.5 py-2.5 text-left font-display text-[11px] font-semibold uppercase tracking-wide text-muted backdrop-blur ${
                    col.sortable === false ? '' : 'cursor-pointer hover:text-text'
                  }`}
                >
                  {col.label}
                  {sort === col.key && col.sortable !== false && (
                    <span className="ml-1 text-[9px] opacity-50">{dir === 1 ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="p-10 text-center text-muted">
                    No houses match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <motion.tr
                    key={(p.canonicalType ?? 'other') + p.name}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b border-line hover:bg-[rgba(255,255,255,.06)]"
                  >
                    <td className="px-3.5 py-2.5 align-top">
                      <div className="flex items-center gap-2.5">
                        <Logo name={p.name} domain={p.domain} size={30} />
                        <div className="min-w-0">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener"
                            className="text-[13px] font-semibold text-text no-underline hover:text-a2"
                          >
                            {p.name}
                          </a>
                          {p.operator && <div className="text-[11px] text-muted">{p.operator}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 align-top text-muted">{p.type}</td>
                    <td className="px-3.5 py-2.5 align-top">
                      <span
                        className="rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={
                          p.canonicalType === 'founder-residency' || p.canonicalType === 'hacker-house'
                            ? { color: '#9be9ff', borderColor: 'rgba(155,233,255,.4)' }
                            : { color: '#c9c2ff', borderColor: 'rgba(201,194,255,.4)' }
                        }
                      >
                        {programTypeLabel(p.canonicalType)}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 align-top">{p.city}</td>
                    <td className="px-3.5 py-2.5 align-top">{p.country}</td>
                    <td className="px-3.5 py-2.5 align-top">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="max-w-[280px] px-3.5 py-2.5 align-top text-[11.5px] text-muted">{p.focus}</td>
                    <td className="px-3.5 py-2.5 align-top text-muted">{p.stage}</td>
                    <td className="px-3.5 py-2.5 align-top">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener"
                        className="whitespace-nowrap font-semibold text-a2 no-underline"
                      >
                        Visit →
                      </a>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
