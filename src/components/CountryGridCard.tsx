import { openCountry } from '../stores/country';
import { flagSrc } from '../lib/flag';

/**
 * Client island for a country card on /countries. Visually identical to the
 * static Astro card, but clicking opens the shared country drawer instead of
 * navigating. The real `href` is preserved for SEO and no-JS fallback —
 * we only preventDefault when JS is running and intercepts the click.
 */
export default function CountryGridCard({
  slug,
  name,
  region,
  summary,
  programCount,
  hasGuides = false,
}: {
  slug: string;
  name: string;
  region: string;
  summary: string;
  programCount: number;
  hasGuides?: boolean;
}) {
  const flag = flagSrc(slug);
  return (
    <a
      href={`/country/${slug}`}
      onClick={(e) => {
        e.preventDefault();
        openCountry(slug);
      }}
      className="orbit-hover flex flex-col rounded-md border border-line2 bg-[rgba(16,16,16,.5)] p-5 transition hover:border-a1"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          {flag && (
            <img
              src={flag}
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] shrink-0 rounded-full ring-1 ring-line2"
            />
          )}
          <span className="truncate font-display text-[17px] font-bold text-text">{name}</span>
        </span>
        <span className="shrink-0 text-[11px] text-muted">{region}</span>
      </div>
      <p className="mb-3 flex-1 text-[12.5px] leading-relaxed text-muted">{summary}</p>
      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted">
        <span className="rounded-full border border-line2 px-2 py-0.5 font-semibold text-text">{programCount} houses</span>
        {hasGuides && <span className="rounded-full border border-line2 px-2 py-0.5">guides</span>}
      </div>
    </a>
  );
}
