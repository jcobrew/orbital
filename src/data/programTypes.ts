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
    name: 'Accelerator',
    best: 'Best when you have a product, early traction, or a fundraise coming up.',
    helps: ['Mentorship', 'Investor access', 'Pitch & demo day', 'Funding', 'Go-to-market pressure'],
    q: 'accelerator',
  },
  {
    name: 'Incubator',
    best: 'Best when you are still turning an idea into a company.',
    helps: ['MVP development', 'Workspace', 'Early mentorship', 'Business model', 'Lab/community resources'],
    q: 'incubator',
  },
  {
    name: 'Residency',
    best: 'Best when you need focus and a temporary environment built around building.',
    helps: ['Housing', 'Coworking', 'Peer accountability', 'Coaching', 'Going full-time'],
    q: 'residency',
  },
  {
    name: 'Hacker house',
    best: 'Best when you want proximity to other builders and fast daily momentum.',
    helps: ['Builder density', 'Serendipity', 'Cofounder discovery', 'Hackathons', 'Community'],
    q: 'hacker house',
  },
  {
    name: 'Fellowship',
    best: 'Best when you are high-potential but early — often pre-idea or pre-product.',
    helps: ['Founder-market fit', 'Exploration', 'Mentorship', 'Grants or investment', 'Long-term network'],
    q: 'fellowship',
  },
];
