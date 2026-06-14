import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { programTypeLabel } from '../data/programs';
import { PROGRAM_TYPES, isMvpProgramType } from '../data/taxonomy';
import { STATUS_ORDER, statusMeta, shortStatusLabel } from '../lib/status';
import { $filters, setFilters, initFiltersFromURL } from '../stores/filters';
import { hasCountryProfile, countrySlug } from '../data/countries';
import { openCountry } from '../stores/country';
import { livingModelLabel } from '../lib/living';
import type { ProgramFormat } from '../data/programs';

type Variant = 'dashboard' | 'sidebar';

/** Canonical program-type IDs in display order: the 8 MVP types first. */
const PROGRAM_TYPE_ORDER = [...PROGRAM_TYPES]
  .map((e) => e.id)
  .sort((a, b) => (isMvpProgramType(a) === isMvpProgramType(b) ? 0 : isMvpProgramType(a) ? -1 : 1));

const inputCls =
  'w-full rounded-full border border-line2 bg-[rgba(8,10,22,.6)] px-3 py-2.5 text-[13px] text-text outline-none transition focus:border-a1';
const selectCls =
  'rounded-full border border-line2 bg-[rgba(8,10,22,.6)] px-3 py-2 text-[12.5px] text-text outline-none cursor-pointer';

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

  // Options + chip counts reflect the active program-type filter.
  const slice = useMemo(
    () => (!filters.type ? programs : programs.filter((p) => p.canonicalType === filters.type)),
    [programs, filters.type],
  );
  // Program-type options: canonical types present in the data, MVP types first,
  // each with a live count (computed against the full set, not the slice).
  const programTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of programs) {
      if (!p.canonicalType) continue;
      counts.set(p.canonicalType, (counts.get(p.canonicalType) ?? 0) + 1);
    }
    return PROGRAM_TYPE_ORDER.filter((id) => counts.has(id)).map((id) => ({
      id,
      label: programTypeLabel(id),
      mvp: isMvpProgramType(id),
      count: counts.get(id) ?? 0,
    }));
  }, [programs]);
  const countries = useMemo(() => [...new Set(slice.map((p) => p.country))].sort(), [slice]);
  // Founder dimensions — these light up only once the data is filled (handoff: no
  // dead controls while values are unknown).
  const stages = useMemo(() => [...new Set(slice.flatMap((p) => p.stageFit ?? []))].sort(), [slice]);
  const formats = useMemo(
    () => [...new Set(slice.map((p) => p.format).filter((f): f is NonNullable<typeof f> => !!f && f !== 'unknown'))].sort(),
    [slice],
  );
  const sectors = useMemo(() => [...new Set(slice.flatMap((p) => p.sectorFocus ?? []))].sort(), [slice]);
  const hasHousing = useMemo(() => slice.some((p) => p.providesHousing === true || p.providesHousing === false), [slice]);

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
      {/* Program-type filter (canonical taxonomy — the primary axis) */}
      <div
        className="inline-flex flex-wrap gap-1 rounded-full border border-line2 bg-[rgba(8,10,22,.5)] p-1"
        role="tablist"
        aria-label="Program type"
      >
        {(() => {
          const allActive = !filters.type;
          return (
            <button
              role="tab"
              aria-selected={allActive}
              onClick={() => setFilters({ type: '', status: '' })}
              className={`rounded-full px-3 py-2 font-display text-[12.5px] font-semibold transition ${
                allActive ? 'text-[#0a0a0a]' : 'text-muted hover:text-text'
              }`}
              style={allActive ? { background: 'var(--grad)' } : undefined}
            >
              All
            </button>
          );
        })()}
        {programTypes
          .filter((t) => t.mvp)
          .map((t) => {
            const active = filters.type === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setFilters({ type: active ? '' : t.id, status: '' })}
                className={`rounded-full px-3 py-2 font-display text-[12.5px] font-semibold transition ${
                  active ? 'text-[#0a0a0a]' : 'text-muted hover:text-text'
                }`}
                style={active ? { background: 'var(--grad)' } : undefined}
              >
                {t.label} <span className="opacity-60">{t.count}</span>
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
          aria-label="Filter by program type"
          value={filters.type}
          onChange={(e) => setFilters({ type: e.target.value })}
          className={selectCls + (variant === 'sidebar' ? ' w-full' : '')}
        >
          <option value="">All program types</option>
          <optgroup label="MVP types">
            {programTypes
              .filter((t) => t.mvp)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.count})
                </option>
              ))}
          </optgroup>
          {programTypes.some((t) => !t.mvp) && (
            <optgroup label="More">
              {programTypes
                .filter((t) => !t.mvp)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.count})
                  </option>
                ))}
            </optgroup>
          )}
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
        {filters.country && hasCountryProfile(filters.country) && (
          <button
            type="button"
            onClick={() => openCountry(countrySlug(filters.country))}
            className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(8,10,22,.6)] px-3 py-2 text-[12.5px] font-semibold text-text transition hover:border-a1"
          >
            View {filters.country} →
          </button>
        )}
        {stages.length > 0 && (
          <select
            aria-label="Filter by stage"
            value={filters.stage}
            onChange={(e) => setFilters({ stage: e.target.value })}
            className={selectCls + (variant === 'sidebar' ? ' w-full' : '')}
          >
            <option value="">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        {formats.length > 0 && (
          <select
            aria-label="Filter by living model"
            value={filters.format}
            onChange={(e) => setFilters({ format: e.target.value })}
            className={selectCls + (variant === 'sidebar' ? ' w-full' : '')}
          >
            <option value="">All living models</option>
            {formats.map((f) => (
              <option key={f} value={f}>
                {livingModelLabel(f as ProgramFormat) ?? f}
              </option>
            ))}
          </select>
        )}
        {sectors.length > 0 && (
          <select
            aria-label="Filter by sector"
            value={filters.sector}
            onChange={(e) => setFilters({ sector: e.target.value })}
            className={selectCls + (variant === 'sidebar' ? ' w-full' : '')}
          >
            <option value="">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        {hasHousing && (
          <select
            aria-label="Filter by housing"
            value={filters.housing}
            onChange={(e) => setFilters({ housing: e.target.value })}
            className={selectCls + (variant === 'sidebar' ? ' w-full' : '')}
          >
            <option value="">Housing: any</option>
            <option value="yes">Housing provided</option>
            <option value="no">No housing</option>
          </select>
        )}
        {variant === 'dashboard' && (
          <>
            <button
              onClick={copyLink}
              title="Copy a link to this exact filtered view"
              className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(8,10,22,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold text-text transition hover:border-a1"
            >
              🔗 Copy link
            </button>
            <a
              href="/api/programs.json"
              className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(8,10,22,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold text-text transition hover:border-a1"
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
                className={`inline-flex select-none items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11.5px] font-semibold transition ${
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2.5 text-[12.5px] font-bold text-[#0a0a0a]" style={{ background: 'var(--grad)' }}>
          Link copied
        </div>
      )}
    </div>
  );
}
