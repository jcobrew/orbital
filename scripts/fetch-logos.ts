/**
 * Collect a self-hosted logo for every program domain.
 *
 * Logos were previously loaded at runtime from third-party services
 * (Clearbit → DuckDuckGo → Google favicon). Clearbit's free logo API has
 * since been retired, and runtime third-party fetches are slow + flaky. This
 * script downloads one icon per unique domain into public/logos/ and writes a
 * manifest (src/lib/logoManifest.json) that the logo loader prefers before
 * falling back to the remaining remote sources and finally initials.
 *
 * Run: npx tsx scripts/fetch-logos.ts
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOGO_DIR = resolve(ROOT, 'public/logos');
const MANIFEST = resolve(ROOT, 'src/lib/logoManifest.json');
const DATA = resolve(ROOT, 'src/data/programs-data.json');

interface Program { name: string; domain?: string }

const programs: Program[] = JSON.parse(readFileSync(DATA, 'utf8')).programs;
const domains = [...new Set(programs.map((p) => p.domain).filter(Boolean) as string[])].sort();

// Start clean so a re-run never leaves orphaned files when a domain's
// winning source (and therefore extension) changes between runs.
rmSync(LOGO_DIR, { recursive: true, force: true });
mkdirSync(LOGO_DIR, { recursive: true });

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
};

/** A source returns null when it has no usable branded icon. */
async function tryFetch(url: string): Promise<{ buf: Buffer; ext: string } | null> {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = EXT[type];
    if (!ext) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Reject empty / 1x1 transparent placeholders.
    if (buf.length < 100) return null;
    return { buf, ext };
  } catch {
    return null;
  }
}

const sources = (domain: string) => [
  `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  `https://logo.clearbit.com/${domain}`,
  // Last resort: the site's own well-known icon locations.
  `https://${domain}/favicon.ico`,
  `https://${domain}/favicon.png`,
  `https://${domain}/apple-touch-icon.png`,
];

const manifest: Record<string, string> = {};
const failed: string[] = [];

for (const domain of domains) {
  let saved = false;
  for (const url of sources(domain)) {
    const got = await tryFetch(url);
    if (!got) continue;
    const file = `${domain}.${got.ext}`;
    writeFileSync(resolve(LOGO_DIR, file), got.buf);
    manifest[domain] = `/logos/${file}`;
    console.log(`✓ ${domain.padEnd(34)} ${got.ext.toUpperCase().padEnd(4)} ${got.buf.length} B  (${url.split('/')[2]})`);
    saved = true;
    break;
  }
  if (!saved) {
    failed.push(domain);
    console.log(`✗ ${domain.padEnd(34)} no logo from any source`);
  }
}

const sorted: Record<string, string> = {};
for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

console.log(`\nCollected ${Object.keys(manifest).length}/${domains.length} logos.`);
if (failed.length) console.log(`Missing (${failed.length}): ${failed.join(', ')}`);
console.log(`Manifest → ${MANIFEST}`);
