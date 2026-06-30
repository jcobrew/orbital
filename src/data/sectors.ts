// Sector tags, derived non-destructively from a program's free-text `focus`
// (and the sparse, explicit `sectorFocus` array when present). The dataset's
// `focus` field is human-written prose — only ~2% of programs carry structured
// `sectorFocus` — so a clean Sector filter has to *derive* tags by keyword.
// This mirrors the approach in `normalizeProgram.ts`: read the legacy text,
// produce canonical IDs, never mutate the source.

import type { Program } from './programs';

/** One canonical sector. `match` is a list of lowercase keyword stems. */
export interface SectorDef {
  id: string;
  label: string;
  match: string[];
}

// Order = display order in the filter. Keep the list short and founder-legible;
// these are the sectors that actually recur across the dataset's focus text.
export const SECTORS: SectorDef[] = [
  { id: 'ai', label: 'AI / ML', match: ['ai', 'ml', 'llm', 'genai', 'machine learning', 'artificial intelligence'] },
  { id: 'deep-tech', label: 'Deep tech', match: ['deep tech', 'deep-tech', 'deeptech', 'deep science', 'deep-science', 'frontier tech', 'frontier research', 'hard tech', 'science-based', 'science & deep', 'science-driven', 'phd', 'r&d'] },
  { id: 'biotech', label: 'Biotech / Health', match: ['biotech', 'biolab', 'health', 'healthtech', 'medtech', 'life science', 'longevity', 'agrifood', 'agritech'] },
  { id: 'hardware', label: 'Hardware / Robotics', match: ['hardware', 'robot', 'robotics', 'humanoid', 'bci', 'prototype', 'electronics', 'manufacturing'] },
  { id: 'crypto', label: 'Crypto / Web3', match: ['crypto', 'web3', 'web 3', 'blockchain', 'token', 'defi', 'metaverse'] },
  { id: 'climate', label: 'Climate / Energy', match: ['climate', 'cleantech', 'clean tech', 'greentech', 'energy', 'renewable', 'sustainab', 'carbon', 'co2', 'conservation'] },
  { id: 'fintech', label: 'Fintech', match: ['fintech', 'financial', 'finance', 'adtech', 'payments'] },
  { id: 'saas', label: 'SaaS / Dev tools', match: ['saas', 'b2b', 'dev tools', 'developer', 'enterprise', 'infrastructure', 'infra', 'marketplace', 'indie hacker'] },
  { id: 'space', label: 'Space', match: ['space', 'spacetech', 'aerospace', 'rocket', 'esa-bic'] },
  { id: 'gaming', label: 'Gaming / AR-VR', match: ['game', 'gaming', 'ar', 'vr', 'xr', 'augmented', 'virtual reality'] },
  { id: 'consumer', label: 'Consumer', match: ['consumer', 'b2c'] },
  { id: 'creative', label: 'Creative / Arts', match: ['artist', 'arts', 'creative', 'creator', 'edtech'] },
  { id: 'agnostic', label: 'Sector-agnostic', match: ['all sectors', 'all-sector', 'multi-sector', 'multi sector', 'multidisciplinary', 'any sector', 'sector-agnostic', 'all-vertical', 'all vertical', 'multi-vertical', 'cross-sector'] },
];

// Short / ambiguous tokens need a full word boundary on BOTH sides so they don't
// match inside longer words (e.g. "ai" must not fire on "Spain"/"chain", "ar"
// must not fire on "hardware"). Longer stems use a left boundary + prefix match
// so "health" catches "healthtech" and "sustainab" catches "sustainability".
const EXACT = new Set(['ai', 'ml', 'ar', 'vr', 'xr', 'b2b', 'b2c', 'co2']);

function compile(keyword: string): RegExp {
  const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const trailing = EXACT.has(keyword) ? '(?![a-z0-9])' : '';
  // Left boundary via a group (broad browser support, unlike lookbehind).
  return new RegExp('(^|[^a-z0-9])' + esc + trailing);
}

const COMPILED: { id: string; res: RegExp[] }[] = SECTORS.map((s) => ({
  id: s.id,
  res: s.match.map(compile),
}));

const BY_ID = new Map(SECTORS.map((s) => [s.id, s]));

/** Human label for a sector id (falls back to the id). */
export function sectorLabel(id: string): string {
  return BY_ID.get(id)?.label ?? id;
}

/**
 * Derive the sector ids for a program from its explicit `sectorFocus` tags plus
 * keyword matches over the free-text `focus`. Returns a de-duped id list in
 * canonical order (may be empty when nothing matches — those programs simply
 * don't surface under a sector filter).
 */
export function programSectors(p: Pick<Program, 'focus' | 'sectorFocus'>): string[] {
  const hay = ((p.focus ?? '') + ' ' + (p.sectorFocus?.join(' ') ?? '')).toLowerCase();
  const ids: string[] = [];
  for (const s of COMPILED) {
    if (s.res.some((re) => re.test(hay))) ids.push(s.id);
  }
  return ids;
}

/** The sector ids actually present in a dataset, in canonical display order. */
export function sectorsInData(programs: Pick<Program, 'focus' | 'sectorFocus'>[]): string[] {
  const present = new Set<string>();
  for (const p of programs) for (const id of programSectors(p)) present.add(id);
  return SECTORS.filter((s) => present.has(s.id)).map((s) => s.id);
}
