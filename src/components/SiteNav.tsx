import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $filters, filtersToQuery } from '../stores/filters';
import { $saved, initSaved } from '../stores/saved';
import { openIntro } from '../stores/ui';

export type NavCurrent = 'globe' | 'map' | 'list' | 'countries' | 'dashboard' | 'about' | 'saved';

const VIEWS: { key: NavCurrent; href: string; label: string }[] = [
  { key: 'globe', href: '/', label: 'Globe' },
  { key: 'list', href: '/explore', label: 'List' },
];

/**
 * The one header used on every page (top of scroll pages, top of the globe/map
 * sidebars). Brand · Globe/List view toggle · About. Countries lives off the
 * globe (in List mode and beyond) to keep the globe panel uncluttered; the
 * toggle carries the live filter query so filters persist across views.
 */
export default function SiteNav({ current }: { current?: NavCurrent }) {
  const filters = useStore($filters);
  const saved = useStore($saved);
  useEffect(() => {
    initSaved();
  }, []);
  const qs = filtersToQuery(filters);
  const suffix = qs ? '?' + qs : '';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <a href="/" className="inline-flex items-center gap-1.5 font-display text-[14px] font-bold tracking-tight text-text no-underline">
        <span className="orbit-node" aria-hidden="true" />
        0rbital
      </a>

      <div
        className="inline-flex gap-1 rounded-full border border-line2 bg-[rgba(16,16,16,.5)] p-1"
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
              className={`rounded-full px-3 py-1 font-display text-[12px] font-semibold no-underline transition active:scale-95 ${
                active
                  ? 'text-[#0a0a0a] shadow-[0_2px_10px_rgba(0,0,0,.4)]'
                  : 'text-a2 hover:bg-[rgba(255,255,255,.07)] hover:text-text'
              }`}
              style={active ? { background: 'var(--grad)' } : undefined}
            >
              {v.label}
            </a>
          );
        })}
      </div>

      <nav className="ml-auto flex items-center gap-1" aria-label="Sections">
        {/* Countries is soft-hidden from production for now (the dedicated
            pages aren't ready). Country data still surfaces in-context via the
            globe's country info drawer and the data API. */}
        {/* Saved shortlist — the bookmark buttons live on every card and on the globe's
            program popup, so every view (the globe included) needs a way back to
            the list they fill; shows a live count when non-empty. */}
        <a
          href="/saved"
          aria-current={current === 'saved' ? 'page' : undefined}
          className={`inline-flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 font-display text-[12px] font-semibold no-underline transition ${
            current === 'saved' ? 'text-text' : 'text-a2 hover:text-text'
          }`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill={saved.length ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.5L8 11l-4.5 2.5V3a.5.5 0 0 1 .5-.5Z" />
          </svg>
          Saved
          {saved.length > 0 && (
            <span className="rounded-full border border-line2 px-1.5 text-[10px] leading-[1.4] text-muted">
              {saved.length}
            </span>
          )}
        </a>
        <button
          type="button"
          onClick={openIntro}
          aria-haspopup="dialog"
          className="rounded-[3px] px-2.5 py-1.5 font-display text-[12px] font-semibold text-a2 transition hover:text-text"
        >
          About
        </button>
      </nav>
    </div>
  );
}
