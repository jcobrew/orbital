import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Program, WorkLiveModel } from '../data/programs';
import { programModel } from '../data/programs';
import { STATUS_ORDER, statusMeta, shortStatusLabel } from '../lib/status';
import { $filters, setFilters, initFiltersFromURL } from '../stores/filters';
import { hasCountryProfile, countrySlug } from '../data/countries';
import { openCountry } from '../stores/country';
import CountryMultiSelect from './CountryMultiSelect';

type Variant = 'dashboard' | 'sidebar';

/** The whole program filter axis: where you live / where you work / both. */
const MODELS: { id: WorkLiveModel; label: string }[] = [
  { id: 'co-living', label: 'Co-living' },
  { id: 'co-working', label: 'Co-working' },
  { id: 'both', label: 'Both' },
];

const inputCls =
  'w-full rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3 py-2.5 text-[13px] text-text outline-none transition focus:border-a1';

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

  // All countries present in the data — the typeahead suggests from these so a
  // pick always yields results.
  const countries = useMemo(() => [...new Set(programs.map((p) => p.country))].sort(), [programs]);
  // Model chip counts reflect the active country selection.
  const byCountry = useMemo(
    () => (filters.country.length ? programs.filter((p) => filters.country.includes(p.country)) : programs),
    [programs, filters.country],
  );
  const modelCounts = useMemo(() => {
    const m: Record<WorkLiveModel, number> = { 'co-living': 0, 'co-working': 0, both: 0 };
    for (const p of byCountry) m[programModel(p)] += 1;
    return m;
  }, [byCountry]);
  // Status-chip counts reflect the active model + country selection.
  const slice = useMemo(
    () => byCountry.filter((p) => !filters.model || programModel(p) === filters.model),
    [byCountry, filters.model],
  );

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

  const single = filters.country.length === 1 ? filters.country[0] : null;

  return (
    <div className={wrap}>
      {/* The one program filter: co-living / co-working / both. */}
      <div
        className="inline-flex flex-wrap gap-1 rounded-full border border-line2 bg-[rgba(16,16,16,.5)] p-1"
        role="tablist"
        aria-label="Living / working model"
      >
        <button
          role="tab"
          aria-selected={!filters.model}
          onClick={() => setFilters({ model: '' })}
          className={`rounded-full px-3 py-2 font-display text-[12.5px] font-semibold transition active:scale-95 ${
            !filters.model
              ? 'text-[#0a0a0a] shadow-[0_2px_10px_rgba(0,0,0,.4)]'
              : 'text-a2 hover:bg-[rgba(255,255,255,.07)] hover:text-text'
          }`}
          style={!filters.model ? { background: 'var(--grad)' } : undefined}
        >
          All
        </button>
        {MODELS.map((m) => {
          const active = filters.model === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={active}
              onClick={() => setFilters({ model: active ? '' : m.id })}
              className={`rounded-full px-3 py-2 font-display text-[12.5px] font-semibold transition active:scale-95 ${
                active
                  ? 'text-[#0a0a0a] shadow-[0_2px_10px_rgba(0,0,0,.4)]'
                  : 'text-a2 hover:bg-[rgba(255,255,255,.07)] hover:text-text'
              }`}
              style={active ? { background: 'var(--grad)' } : undefined}
            >
              {m.label} <span className="opacity-60">{modelCounts[m.id]}</span>
            </button>
          );
        })}
      </div>

      {/* Search + country */}
      <div className={variant === 'dashboard' ? 'flex flex-wrap items-center gap-2.5' : 'flex flex-col gap-2.5'}>
        <div className={variant === 'dashboard' ? 'relative min-w-[240px] flex-1' : 'relative'}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8a8a8a"
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
        <CountryMultiSelect
          countries={countries}
          selected={filters.country}
          onChange={(next) => setFilters({ country: next })}
          fullWidth={variant === 'sidebar'}
        />
        {single && hasCountryProfile(single) && (
          <button
            type="button"
            onClick={() => openCountry(countrySlug(single))}
            className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3 py-2 text-[12.5px] font-semibold text-text transition hover:border-a1"
          >
            View {single} →
          </button>
        )}
        {variant === 'dashboard' && (
          <>
            <button
              onClick={copyLink}
              title="Copy a link to this exact filtered view"
              className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold text-text transition hover:border-a1"
            >
              Copy link
            </button>
            <a
              href="/api/programs.json"
              className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold text-text transition hover:border-a1"
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
                style={active ? { background: s.color } : { background: 'rgba(16,16,16,.4)' }}
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
