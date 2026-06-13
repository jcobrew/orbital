import { openCountry } from '../stores/country';

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
  directoryCount,
}: {
  slug: string;
  name: string;
  region: string;
  summary: string;
  programCount: number;
  directoryCount: number;
}) {
  return (
    <a
      href={`/country/${slug}`}
      onClick={(e) => {
        e.preventDefault();
        openCountry(slug);
      }}
      className="flex flex-col rounded-2xl border border-line2 bg-[rgba(8,10,22,.5)] p-5 transition hover:border-a1"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-display text-[17px] font-bold text-text">{name}</span>
        <span className="text-[11px] text-muted">{region}</span>
      </div>
      <p className="mb-3 flex-1 text-[12.5px] leading-relaxed text-muted">{summary}</p>
      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted">
        <span className="rounded-[3px] border border-line2 px-2 py-0.5 font-semibold text-text">{programCount} programs</span>
        <span className="rounded-[3px] border border-line2 px-2 py-0.5">{directoryCount} directories</span>
      </div>
    </a>
  );
}
