import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $filters, filtersToQuery } from '../stores/filters';
import { openIntro } from '../stores/ui';
import { $saved, initSaved } from '../stores/saved';

export type NavCurrent = 'globe' | 'map' | 'list' | 'countries' | 'dashboard' | 'about' | 'saved';

const VIEWS: { key: NavCurrent; href: string; label: string }[] = [
  { key: 'globe', href: '/', label: 'Globe' },
  { key: 'list', href: '/explore', label: 'List' },
];

/**
 * The one header used on every page (top of scroll pages, top of the globe/map
 * sidebars). Brand · Globe/Map/List view toggle · Countries · About. The toggle
 * carries the live filter query string so filters persist across views; About
 * opens the intro overlay (mounted once in the layout).
 */
export default function SiteNav({ current }: { current?: NavCurrent }) {
  const filters = useStore($filters);
  const saved = useStore($saved);
  const qs = filtersToQuery(filters);
  const suffix = qs ? '?' + qs : '';

  useEffect(() => {
    initSaved();
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <a href="/" className="font-display text-[14px] font-bold tracking-tight text-text no-underline">
        Orbital
      </a>

      <div
        className="inline-flex gap-1 rounded-[3px] border border-line2 bg-[rgba(8,10,22,.5)] p-1"
        role="tablist"
        aria-label="View"
      >
        {VIEWS.map((v) => {
          const active = v.key === current;
          return (
            <a
              key={v.key}
              href={v.href + suffix}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              className={`rounded-[2px] px-3 py-1 font-display text-[12px] font-semibold no-underline transition ${
                active ? 'text-[#0a0a0a]' : 'text-muted hover:text-text'
              }`}
              style={active ? { background: 'var(--grad)' } : undefined}
            >
              {v.label}
            </a>
          );
        })}
      </div>

      <nav className="ml-auto flex items-center gap-1" aria-label="Sections">
        <a
          href="/countries"
          aria-current={current === 'countries' ? 'page' : undefined}
          className={`rounded-[3px] px-2.5 py-1.5 font-display text-[12px] font-semibold no-underline transition ${
            current === 'countries' ? 'text-text' : 'text-muted hover:text-text'
          }`}
        >
          Countries
        </a>
        <a
          href="/saved"
          aria-current={current === 'saved' ? 'page' : undefined}
          className={`rounded-[3px] px-2.5 py-1.5 font-display text-[12px] font-semibold no-underline transition ${
            current === 'saved' ? 'text-text' : 'text-muted hover:text-text'
          }`}
        >
          Saved{saved.length > 0 ? ` (${saved.length})` : ''}
        </a>
        <button
          type="button"
          onClick={openIntro}
          aria-haspopup="dialog"
          className="rounded-[3px] px-2.5 py-1.5 font-display text-[12px] font-semibold text-muted transition hover:text-text"
        >
          About
        </button>
      </nav>
    </div>
  );
}
