// Program-type explainer content — shared by the /about page and the intro
// overlay so there's one source of truth. Secondary education: a founder mostly
// already knows what the app is for; this just clarifies the categories.
export interface ProgramTypeInfo {
  name: string;
  best: string;
  helps: string[];
  q: string;
}

export const PROGRAM_TYPES: ProgramTypeInfo[] = [
  {
    name: 'Live-in residency',
    best: 'Best when you want to step out of your old life and live full-time inside a founder cohort.',
    helps: ['Housing', 'Live-in cohort', 'Deep focus', 'Peer accountability', 'Going full-time'],
    q: 'residency',
  },
  {
    name: 'Hacker house',
    best: 'Best when you want proximity to other builders and fast daily momentum under one roof.',
    helps: ['Builder density', 'Serendipity', 'Cofounder discovery', 'Shared space', 'Community'],
    q: 'hacker house',
  },
  {
    name: 'Co-living program',
    best: 'Best when you want to build where you sleep — work and home in the same orbit.',
    helps: ['Housing', 'Coworking', 'Shared meals', 'Daily momentum', 'Long-term network'],
    q: 'co-living',
  },
  {
    name: 'Focus retreat',
    best: 'Best when you need a temporary place built entirely around shipping, away from distraction.',
    helps: ['Deep focus', 'Housing', 'Small cohort', 'Coaching', 'No noise'],
    q: 'retreat',
  },
  {
    name: 'Founder community',
    best: 'Best when you want the gravity of a tight group — people who pull you to build with them.',
    helps: ['Community', 'Cofounder discovery', 'Belonging', 'Long-term network', 'Serendipity'],
    q: 'community',
  },
];
