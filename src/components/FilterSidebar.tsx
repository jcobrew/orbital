import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import type { Program } from '../data/programs';
import { STATUS_ORDER, statusMeta, shortStatusLabel } from '../lib/status';
import { passes } from '../lib/filter';
import { $filters, setFilters, initFiltersFromURL } from '../stores/filters';
import { hasCountryProfile, countrySlug } from '../data/countries';
import { openCountry } from '../stores/country';
import { sectorsInData, sectorLabel } from '../data/sectors';
import { flagSrc } from '../lib/flag';
import CheckboxDropdown from './CheckboxDropdown';

type Variant = 'dashboard' | 'sidebar';

const inputCls =
  'w-full rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3 py-2.5 text-[13px] text-text outline-none transition focus:border-a1';

const toolBtn =
  'inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(16,16,16,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold text-text no-underline transition hover:border-a1';

/** Round flag for a country, used as the per-row icon in the country dropdown. */
function Flag({ name }: { name: string }) {
  const src = flagSrc(countrySlug(name));
  if (src) {
    return <img src={src} alt="" aria-hidden="true" className="h-[15px] w-[15px] flex-none rounded-full object-cover" />;
  }
  return <span className="orbit-node flex-none" aria-hidden="true" />;
}

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

  // Filter options are drawn from the data so a pick always yields results.
  const countries = useMemo(() => [...new Set(programs.map((p) => p.country))].sort(), [programs]);
  const sectors = useMemo(() => sectorsInData(programs), [programs]);

  // Status-chip counts honour the active sector/country/search (everything but status).
  const slice = useMemo(
    () => programs.filter((p) => passes(p, { ...filters, status: '' })),
    [programs, filters],
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

  /** Download the currently-filtered programs as a JSON file. */
  function exportJSON() {
    const filtered = programs.filter((p) => passes(p, filters));
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orbital-programs.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const single = filters.country.length === 1 ? filters.country[0] : null;
  const rowCls = variant === 'dashboard' ? 'flex flex-wrap items-center gap-2.5' : 'flex flex-col gap-2.5';

  return (
    <div className="flex flex-col gap-3">
      {/* Search + sector + country */}
      <div className={rowCls}>
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

        <CheckboxDropdown
          label="Sector"
          options={sectors.map((id) => ({ value: id, label: sectorLabel(id) }))}
          selected={filters.sector}
          onChange={(next) => setFilters({ sector: next })}
          fullWidth={variant === 'sidebar'}
        />

        <CheckboxDropdown
          label="Country"
          options={countries.map((c) => ({ value: c, label: c }))}
          selected={filters.country}
          onChange={(next) => setFilters({ country: next })}
          renderIcon={(v) => <Flag name={v} />}
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
            <button onClick={copyLink} title="Copy a link to this exact filtered view" className={toolBtn}>
              Copy link
            </button>
            <button onClick={exportJSON} title="Download the filtered programs as JSON" className={toolBtn}>
              ↓ Export
            </button>
            <a href="/api/programs.json" className={toolBtn}>
              {'{ }'} API
            </a>
            <a href="/llms.txt" className={toolBtn} title="Machine-readable summary for AI agents">
              Agents
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
