// Country startup-ecosystem profiles — the data behind /country/<slug> and
// /api/countries.json. These let a founder go one level up from individual
// programs to "what is it actually like to build here": visas, key orgs, links.
//
// ────────────────────────────────────────────────────────────────────────────
// CLOUD-DB SWAP POINT
// Today the source of truth is the local `countries-data.json` (committed, so it
// ships with the static build). When we move to an updatable cloud database,
// replace the JSON import below with a build-time fetch from that DB and keep the
// rest of this file unchanged — every consumer goes through `COUNTRIES` /
// `getCountry()` / `countrySlug()`, so nothing downstream needs to know.
// ────────────────────────────────────────────────────────────────────────────

import countriesRaw from './countries-data.json';
import { PROGRAMS } from './programs';

export interface CountryLink {
  label: string;
  url: string;
}

/** An external, country-specific startup-ecosystem directory/website we point out to. */
export interface CountryDirectory {
  label: string;
  url: string;
  description?: string;
}

export interface CountryVisa {
  name: string;
  description: string;
  url: string;
}

export interface CountryOrg {
  name: string;
  type: string;
  description: string;
  url: string;
}

/** A national startup-ecosystem profile as stored in the data source. */
export interface CountryRecord {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  summary: string;
  highlights: string[];
  visas: CountryVisa[];
  organizations: CountryOrg[];
  links: CountryLink[];
  /** External, country-specific startup-ecosystem directories we point founders to. */
  directories: CountryDirectory[];
  updatedAt: string;
  source: string;
}

/** A profile enriched with live program counts joined from the program datasets. */
export interface Country extends CountryRecord {
  /** Number of programs in this country across both datasets. */
  programCount: number;
  /** Per-dataset breakdown. */
  programsByDataset: { residential: number; traditional: number };
}

interface SourceFile {
  meta?: Record<string, unknown>;
  countries: CountryRecord[];
}

const raw = countriesRaw as SourceFile;

/** Turn a country display name into a URL-safe slug (`USA` → `usa`). */
export function countrySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Pre-count programs per country name so each profile can show how much is here.
const counts: Record<string, { residential: number; traditional: number }> = {};
for (const p of PROGRAMS) {
  const c = (counts[p.country] ??= { residential: 0, traditional: 0 });
  if (p.dataset === 'residential') c.residential += 1;
  else c.traditional += 1;
}

export const COUNTRIES: Country[] = raw.countries
  .map((c) => {
    const n = counts[c.name] ?? { residential: 0, traditional: 0 };
    return {
      ...c,
      // Never let a consumer hit undefined if an older record omits directories.
      directories: c.directories ?? [],
      programsByDataset: n,
      programCount: n.residential + n.traditional,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const BY_SLUG = new Map(COUNTRIES.map((c) => [c.slug, c]));

export function getCountry(slug: string): Country | undefined {
  return BY_SLUG.get(slug);
}

/** True if we have an ecosystem profile for a given program `country` value. */
export function hasCountryProfile(name: string): boolean {
  return BY_SLUG.has(countrySlug(name));
}
