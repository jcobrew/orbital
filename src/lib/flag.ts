// Round country-flag icons collected by scripts/fetch-flags.ts. Keyed by the
// country slug used in countries-data.json so every consumer (drawer, grid,
// profile page) resolves a flag the same way, with a graceful undefined when a
// country has no flag yet.
import flagManifest from './flagManifest.json';

const manifest = flagManifest as Record<string, string>;

/** Local round-flag SVG path for a country slug, if one was collected. */
export function flagSrc(slug?: string): string | undefined {
  return slug ? manifest[slug] : undefined;
}
