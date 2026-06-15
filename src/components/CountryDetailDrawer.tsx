import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $selectedCountrySlug, closeCountry } from '../stores/country';
import { getCountry } from '../data/countries';
import { flagSrc } from '../lib/flag';

/**
 * Country detail drawer — the reusable pop-out shown when a founder clicks a
 * country (countries grid) or selects one in the filter sidebar. Mirrors
 * ProgramDetailDrawer's shell (scrim, right panel, Esc-to-close, focus-on-open).
 *
 * Orbital points OUT: the PRIMARY section here is external startup directories
 * we curate per country, not data we re-collect ourselves.
 */
export default function CountryDetailDrawer() {
  const slug = useStore($selectedCountrySlug);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!slug) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCountry();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [slug]);

  if (!slug) return null;
  const country = getCountry(slug);
  if (!country) return null;

  const dashboardHref = `/dashboard?country=${encodeURIComponent(country.name)}`;
  const count = country.programCount;
  const flag = flagSrc(country.slug);

  return (
    <div className="fixed inset-0 z-[1000]" role="presentation">
      <button aria-label="Close details" onClick={closeCountry} className="absolute inset-0 h-full w-full cursor-default bg-black/55" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${country.name} startup ecosystem`}
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line2 bg-[#0b0e1c] shadow-[0_24px_70px_rgba(0,0,0,.65)] max-[480px]:max-w-full"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-line p-5">
          {flag && (
            <img
              src={flag}
              alt={`${country.name} flag`}
              width={34}
              height={34}
              className="mt-0.5 h-[34px] w-[34px] shrink-0 rounded-full ring-1 ring-line2"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="m-0 font-display text-[17px] font-bold leading-tight text-text">{country.name}</h2>
            <div className="mt-1.5">
              <span className="rounded-full border border-line2 px-2.5 py-1 text-[11.5px] text-muted">{country.region}</span>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={closeCountry}
            aria-label="Close"
            className="rounded-sm border border-line2 px-2 py-1 text-[14px] leading-none text-muted hover:text-text"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Summary */}
          <p className="m-0 mb-5 text-[12.5px] leading-normal text-muted">{country.summary}</p>

          {/* PRIMARY: external startup directories */}
          <h3 className="m-0 mb-2 font-display text-[13px] font-bold text-text">Startup directories</h3>
          {country.directories.length > 0 ? (
            <div className="mb-5 flex flex-col gap-2.5">
              {country.directories.map((d) => (
                <a
                  key={d.url}
                  href={d.url}
                  target="_blank"
                  rel="noopener"
                  className="orbit-hover rounded-md border border-line2 bg-[rgba(8,10,22,.5)] p-4 transition hover:border-a1"
                >
                  <div className="mb-0.5 text-[13.5px] font-semibold text-text">{d.label} ↗</div>
                  {d.description && <div className="text-[12.5px] leading-relaxed text-muted">{d.description}</div>}
                </a>
              ))}
            </div>
          ) : (
            <p className="m-0 mb-5 rounded-md border border-line2 bg-[rgba(8,10,22,.5)] p-4 text-[12px] italic leading-relaxed text-muted">
              No external directories curated yet — help us add one.
            </p>
          )}

          {/* Compact link row */}
          <div className="mb-5 flex flex-col gap-1.5 text-[12.5px]">
            <a href={`/country/${country.slug}`} className="font-semibold text-a2 hover:text-text">
              {count} house{count === 1 ? '' : 's'} & residenc{count === 1 ? 'y' : 'ies'} here →
            </a>
            <a href={dashboardHref} className="font-semibold text-a2 hover:text-text">
              Filter the map →
            </a>
          </div>

          {/* SECONDARY: visas & organizations, condensed */}
          {country.visas.length > 0 && (
            <>
              <div className="orbit-divider my-4" aria-hidden="true" />
              <h3 className="m-0 mb-2 font-display text-[12px] font-bold uppercase tracking-wide text-muted">Visa & residency routes</h3>
              <ul className="orbit-list m-0 mb-4 list-none p-0 text-[12px]">
                {country.visas.map((v) => (
                  <li key={v.url} className="mt-1">
                    <a href={v.url} target="_blank" rel="noopener" className="text-a2">{v.name} ↗</a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {country.organizations.length > 0 && (
            <>
              <div className="orbit-divider my-4" aria-hidden="true" />
              <h3 className="m-0 mb-2 font-display text-[12px] font-bold uppercase tracking-wide text-muted">Key organizations</h3>
              <ul className="orbit-list m-0 mb-2 list-none p-0 text-[12px]">
                {country.organizations.map((o) => (
                  <li key={o.url} className="mt-1">
                    <a href={o.url} target="_blank" rel="noopener" className="text-a2">{o.name} ↗</a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="m-0 mt-4 text-[11px] italic text-muted">
            Last verified {country.updatedAt}. Directories and visa rules change often — confirm on the official source.
          </p>
        </div>
      </div>
    </div>
  );
}
