import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { STATUS_ORDER, statusMeta, shortStatusLabel } from '../lib/status';
import { $filters, setFilters, initFiltersFromURL } from '../stores/filters';

type Variant = 'dashboard' | 'sidebar';

const DATASETS = [
  { k: 'all', label: 'All' },
  { k: 'residential', label: 'Residential' },
  { k: 'traditional', label: 'Traditional' },
] as const;

const inputCls =
  'w-full rounded-xl border border-line2 bg-[rgba(8,10,22,.6)] px-3 py-2.5 text-[13px] text-text outline-none transition focus:border-a1';
const selectCls =
  'rounded-xl border border-line2 bg-[rgba(8,10,22,.6)] px-3 py-2 text-[12.5px] text-text outline-none cursor-pointer';

export default function FilterSidebar({
  programs,
  variant = 'dashboard',
}: {
  programs: Program[];
  variant?: Variant;
}) {
  const filters = useStore($filters);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    initFiltersFromURL();
  }, []);

  // Options + chip counts reflect the active dataset.
  const slice = useMemo(
    () => (filters.dataset === 'all' ? programs : programs.filter((p) => p.dataset === filters.dataset)),
    [programs, filters.dataset],
  );
  const types = useMemo(() => [...new Set(slice.map((p) => p.type))].sort(), [slice]);
  const countries = useMemo(() => [...new Set(slice.map((p) => p.country))].sort(), [slice]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      setToast(true);
      setTimeout(() => setToast(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  const wrap =
    variant === 'dashboard'
      ? 'flex flex-col gap-3'
      : 'flex flex-col gap-3';

  return (
    <div className={wrap}>
      {/* Dataset toggle */}
      <div
        className="inline-flex gap-1 rounded-xl border border-line2 bg-[rgba(8,10,22,.5)] p-1"
        role="tablist"
        aria-label="Dataset"
      >
        {DATASETS.map((d) => {
          const active = filters.dataset === d.k;
          return (
            <button
              key={d.k}
              role="tab"
              aria-selected={active}
              onClick={() => setFilters({ dataset: d.k, status: '' })}
              className={`flex-1 rounded-[3px] px-3 py-2 font-display text-[12.5px] font-semibold transition ${
                active ? 'text-[#0a0a0a]' : 'text-muted hover:text-text'
              }`}
              style={active ? { background: 'var(--grad)' } : undefined}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Search + selects */}
      <div className={variant === 'dashboard' ? 'flex flex-wrap items-center gap-2.5' : 'flex flex-col gap-2.5'}>
        <div className={variant === 'dashboard' ? 'relative min-w-[240px] flex-1' : 'relative'}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9aa3c8"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            aria-label="Search programs"
            placeholder="Search name, city, country, focus, operator…"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            className={inputCls + ' pl-9'}
          />
        </div>
        <select
          aria-label="Filter by type"
          value={filters.type}
          onChange={(e) => setFilters({ type: e.target.value })}
          className={selectCls + (variant === 'sidebar' ? ' w-full' : '')}
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by country"
          value={filters.country}
          onChange={(e) => setFilters({ country: e.target.value })}
          className={selectCls + (variant === 'sidebar' ? ' w-full' : '')}
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {variant === 'dashboard' && (
          <>
            <button
              onClick={copyLink}
              title="Copy a link to this exact filtered view"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-[rgba(8,10,22,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold text-text transition hover:border-a1"
            >
              🔗 Copy link
            </button>
            <a
              href="/api/programs.json"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-[rgba(8,10,22,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold text-text transition hover:border-a1"
            >
              {'{ }'} API
            </a>
          </>
        )}
      </div>

      {/* Status chips — only on the dashboard. On the map/globe sidebars these
          duplicate the on-canvas status legend, so they're hidden there. */}
      {variant === 'dashboard' && (
        <div className="flex flex-wrap gap-1.5" aria-label="Filter by recruiting status">
          {STATUS_ORDER.map((k) => {
            const n = slice.filter((p) => p.status === k).length;
            if (!n) return null;
            const s = statusMeta(k);
            const active = filters.status === k;
            return (
              <button
                key={k}
                onClick={() => setFilters({ status: active ? '' : k })}
                className={`inline-flex select-none items-center gap-1.5 rounded-[3px] border px-2.5 py-[5px] text-[11.5px] font-semibold transition ${
                  active ? 'border-transparent text-[#0a0a0a]' : 'border-line2 text-muted hover:text-text'
                }`}
                style={active ? { background: s.color } : { background: 'rgba(8,10,22,.4)' }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {shortStatusLabel(k)} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-[12.5px] font-bold text-[#0a0a0a]" style={{ background: 'var(--grad)' }}>
          Link copied
        </div>
      )}
    </div>
  );
}
