// Shared "show what we know, say Unknown otherwise" formatting — used by the
// detail drawer and the program profile page so they never drift.
import type { Program } from '../data/programs';

export const UNKNOWN = 'Unknown';

export function displayVal(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === '') return UNKNOWN;
  return String(v);
}

export function displayBool(v: boolean | null | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return UNKNOWN;
}

export function displayDuration(p: Program): string {
  if (p.durationWeeksMin && p.durationWeeksMax)
    return p.durationWeeksMin === p.durationWeeksMax
      ? `${p.durationWeeksMin} weeks`
      : `${p.durationWeeksMin}–${p.durationWeeksMax} weeks`;
  if (p.durationWeeksMin) return `${p.durationWeeksMin}+ weeks`;
  return UNKNOWN;
}

/** "What you get" — only the perks we can confirm are provided. */
export const PROVIDES: { key: keyof Program; label: string }[] = [
  { key: 'providesFunding', label: 'Funding' },
  { key: 'providesHousing', label: 'Housing' },
  { key: 'providesWorkspace', label: 'Workspace' },
  { key: 'providesMentorship', label: 'Mentorship' },
  { key: 'providesInvestorAccess', label: 'Investor access' },
  { key: 'providesDemoDay', label: 'Demo day' },
  { key: 'providesVisaSupport', label: 'Visa / relocation support' },
];

export function whatYouGet(p: Program): string[] {
  return PROVIDES.filter(({ key }) => p[key] === true).map(({ label }) => label);
}
