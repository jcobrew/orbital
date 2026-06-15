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

/**
 * Discover icon URLs declared in a site's own HTML (<link rel="icon">,
 * apple-touch-icon, etc.). Catches branded favicons served from non-standard
 * paths that the favicon services miss — common for hacker-house / residency
 * sites built on Framer, Notion or Carrd. Skips og:image on purpose: those are
 * wide social cards that crop badly into the round globe markers.
 */
async function discoverFromHtml(domain: string): Promise<string[]> {
  try {
    const res = await fetch(`https://${domain}/`, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; founder-atlas-logos)' },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const base = new URL(res.url || `https://${domain}/`);
    const out: string[] = [];
    const linkRe = /<link\b[^>]*>/gi;
    for (const tag of html.match(linkRe) ?? []) {
      const rel = /\brel=["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? '';
      const href = /\bhref=["']([^"']+)["']/i.exec(tag)?.[1];
      if (!href || !/icon/.test(rel)) continue;
      try {
        out.push(new URL(href, base).href);
      } catch {
        /* ignore malformed href */
      }
    }
    // apple-touch-icon (often the highest-res square) first.
    return out.sort((a, b) => Number(b.includes('apple-touch')) - Number(a.includes('apple-touch')));
  } catch {
    return [];
  }
}

async function sources(domain: string): Promise<string[]> {
  return [
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    `https://logo.clearbit.com/${domain}`,
    // Icons declared in the site's own HTML (non-standard favicon paths).
    ...(await discoverFromHtml(domain)),
    // Last resort: the site's well-known icon locations.
    `https://${domain}/favicon.ico`,
    `https://${domain}/favicon.png`,
    `https://${domain}/apple-touch-icon.png`,
  ];
}

const manifest: Record<string, string> = {};
const failed: string[] = [];

for (const domain of domains) {
  let saved = false;
  for (const url of await sources(domain)) {
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
