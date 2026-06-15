/**
 * Collect a round flag icon for every country profile.
 *
 * Uses the MIT-licensed HatScripts/circle-flags set (pre-rounded circular SVG
 * flags) so the country drawer / grid / profile pages can show a flag without a
 * runtime third-party request. Downloads one SVG per country into public/flags/
 * and writes src/lib/flagManifest.json (slug -> local path).
 *
 * Run: npx tsx scripts/fetch-flags.ts
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FLAG_DIR = resolve(ROOT, 'public/flags');
const MANIFEST = resolve(ROOT, 'src/lib/flagManifest.json');
const DATA = resolve(ROOT, 'src/data/countries-data.json');

// Country slug (as stored in countries-data.json) -> ISO 3166-1 alpha-2 code.
const ISO: Record<string, string> = {
  usa: 'us', uk: 'gb', singapore: 'sg', uae: 'ae', estonia: 'ee',
  france: 'fr', germany: 'de', canada: 'ca', australia: 'au', austria: 'at',
  finland: 'fi', sweden: 'se', switzerland: 'ch', india: 'in', indonesia: 'id',
  malaysia: 'my', vietnam: 'vn', mexico: 'mx', colombia: 'co', argentina: 'ar',
};

interface Country { slug: string; name: string }
const countries: Country[] = JSON.parse(readFileSync(DATA, 'utf8')).countries;

rmSync(FLAG_DIR, { recursive: true, force: true });
mkdirSync(FLAG_DIR, { recursive: true });

const manifest: Record<string, string> = {};
const failed: string[] = [];

for (const { slug, name } of countries) {
  const code = ISO[slug];
  if (!code) {
    failed.push(`${slug} (no ISO mapping — add it to scripts/fetch-flags.ts)`);
    continue;
  }
  try {
    const url = `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/${code}.svg`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const svg = await res.text();
    if (!svg.includes('<svg')) throw new Error('not an SVG');
    writeFileSync(resolve(FLAG_DIR, `${slug}.svg`), svg);
    manifest[slug] = `/flags/${slug}.svg`;
    console.log(`✓ ${slug.padEnd(14)} ${code}  ${name}`);
  } catch (err) {
    failed.push(`${slug} (${(err as Error).message})`);
    console.log(`✗ ${slug.padEnd(14)} ${code}  ${(err as Error).message}`);
  }
}

const sorted: Record<string, string> = {};
for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

console.log(`\nCollected ${Object.keys(manifest).length}/${countries.length} flags.`);
if (failed.length) console.log(`Missing: ${failed.join(', ')}`);
console.log(`Manifest → ${MANIFEST}`);
