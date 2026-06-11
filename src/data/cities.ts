// City groupings derived from the program data — the source for /cities/<slug>
// and for linking a program (or country) to its city. Mirrors countries.ts.
// City names don't currently collide across countries, so the city name alone
// is a safe slug.
import { PROGRAMS, programSlug, type Program } from './programs';

export interface City {
  city: string;
  country: string;
  slug: string;
  count: number;
  programs: Program[];
}

export function citySlug(city: string): string {
  return programSlug(city);
}

const byKey = new Map<string, City>();
for (const p of PROGRAMS) {
  if (!p.city) continue;
  const slug = citySlug(p.city);
  let c = byKey.get(slug);
  if (!c) {
    c = { city: p.city, country: p.country, slug, count: 0, programs: [] };
    byKey.set(slug, c);
  }
  c.programs.push(p);
  c.count++;
}

/** All cities, most programs first. */
export const CITIES: City[] = [...byKey.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));

const BY_SLUG = new Map(CITIES.map((c) => [c.slug, c]));

export function getCity(slug: string): City | undefined {
  return BY_SLUG.get(slug);
}

/** Cities in a given country, most programs first. */
export function citiesInCountry(country: string): City[] {
  return CITIES.filter((c) => c.country === country);
}
