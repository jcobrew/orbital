// Cross-island state for the country detail drawer. Astro islands are isolated,
// so the countries grid, the filter sidebar and the drawer itself (mounted once
// in the layout) share which country is open through this nanostore. We store
// only the slug; the drawer resolves the full record via getCountry().
import { atom } from 'nanostores';

export const $selectedCountrySlug = atom<string | null>(null);

/** Open the country drawer for a given country slug. */
export function openCountry(slug: string): void {
  $selectedCountrySlug.set(slug);
}

/** Close the country drawer. */
export function closeCountry(): void {
  $selectedCountrySlug.set(null);
}
