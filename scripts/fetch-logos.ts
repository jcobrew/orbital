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
 * Sources tried per domain: a hand-researched OVERRIDES entry, DuckDuckGo,
 * Google favicon, Clearbit, icons declared in the site's own HTML, then the
 * well-known favicon paths. Any domain that still has nothing gets a generated
 * SVG monogram, so every program marker on the globe renders a clean icon.
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

// First program name per domain — used to draw a monogram for the handful of
// domains that publish no logo anywhere, so every marker on the globe renders a
// clean icon instead of a broken-favicon flash.
const nameFor = new Map<string, string>();
for (const p of programs) if (p.domain && !nameFor.has(p.domain)) nameFor.set(p.domain, p.name);

/** Same initials rule as src/lib/logo.ts, kept in sync by hand. */
function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/[—-].*$/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** A self-hosted SVG monogram matching the app's initials fallback styling. */
function monogramSvg(name: string): string {
  const ini = initials(name) || '?';
  const size = ini.length > 1 ? 46 : 60;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">` +
    `<rect width="128" height="128" fill="#1a2036"/>` +
    `<text x="64" y="68" font-family="Inter,system-ui,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${ini}</text>` +
    `</svg>\n`;
}

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
    // Send a same-origin Referer so hotlink-protected site assets still serve.
    const ref = (() => { try { return new URL(url).origin + '/'; } catch { return undefined; } })();
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; founder-atlas-logos)', ...(ref ? { referer: ref } : {}) },
    });
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

// Hand-researched logo sources for programs the favicon services don't index
// (popular but small/new houses, sites that are down, or logos served as a
// plain <img> rather than a <link rel="icon">). Tried before everything else.
// Keep the comment next to each so the source is auditable on a re-run.
const OVERRIDES: Record<string, string> = {
  'conviction.com': 'https://conviction.com/applogo.png', // Conviction icon (<img>, not a favicon link)
  'biopunklab.com': 'https://biopunklab.com/images/logo.png', // 1080² square brand logo
  'vinnova.se': 'https://www.vinnova.se/Static/build/images/apple-touch-icon.png', // square app icon (favicon.ico is 403)
  'aigrant.com': 'https://aigrant.com/img/card.png', // AI Grant — only branded asset they publish
  'fr8.so': 'https://unavatar.io/x/shipfr8', // fr8.so favicon is white-on-transparent (invisible on the white marker); X avatar is the black FR8 mark
  'founders-house.fi': 'https://founders-house.fi/favicon.ico', // real red mark; favicon services return a generic icon for this domain
};

async function sources(domain: string): Promise<string[]> {
  return [
    ...(OVERRIDES[domain] ? [OVERRIDES[domain]] : []),
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
    // No real logo anywhere — draw a monogram so the marker still renders.
    const file = `${domain}.svg`;
    writeFileSync(resolve(LOGO_DIR, file), monogramSvg(nameFor.get(domain) ?? domain));
    manifest[domain] = `/logos/${file}`;
    failed.push(domain);
    console.log(`◑ ${domain.padEnd(34)} SVG  monogram (no logo published)`);
  }
}

const sorted: Record<string, string> = {};
for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

const real = Object.keys(manifest).length - failed.length;
console.log(`\nEvery domain has a logo: ${real}/${domains.length} real + ${failed.length} monogram.`);
if (failed.length) console.log(`Monograms (no logo published): ${failed.join(', ')}`);
console.log(`Manifest → ${MANIFEST}`);
