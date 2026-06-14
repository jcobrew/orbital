// Logo helpers — ported from the legacy initials()/logoMarkup()/logoFallback().
// The React <Logo> uses logoSources()+initials(); the imperative Leaflet/Globe
// islands use logoMarkupHTML() because L.divIcon expects an HTML string.

// Self-hosted logos collected by scripts/fetch-logos.ts. When a domain has a
// local icon we serve that first (fast, reliable, no third-party round-trip),
// then fall back to the live favicon services and finally to initials.
import logoManifest from './logoManifest.json';

const manifest = logoManifest as Record<string, string>;

/** Local self-hosted logo path for a domain, if one was collected. */
export function localLogo(domain?: string): string | undefined {
  return domain ? manifest[domain] : undefined;
}

export function initials(name: string): string {
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

/** Ordered favicon/logo sources to try before falling back to initials. */
export function logoSources(domain?: string): string[] {
  if (!domain) return [];
  const local = manifest[domain];
  return [
    // Prefer the self-hosted logo; the remote services are runtime fallbacks
    // for domains we couldn't collect (and Clearbit is now retired).
    ...(local ? [local] : []),
    'https://icons.duckduckgo.com/ip3/' + domain + '.ico',
    'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128',
  ];
}

/** HTML-string version for L.divIcon markers (imperative map code). */
export function logoMarkupHTML(name: string, domain?: string): string {
  const ini = initials(name);
  const srcs = logoSources(domain);
  if (!srcs.length) return `<span class="ini">${ini}</span>`;
  const data = JSON.stringify(srcs).replace(/'/g, '&#39;');
  return `<img src="${srcs[0]}" data-s='${data}' data-i="0" data-ini="${ini}" onerror="__logoFallback(this)"/>`;
}

/** Global onerror handler used by logoMarkupHTML. Call installLogoFallback() once. */
export function installLogoFallback(): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __logoFallback?: (img: HTMLImageElement) => void };
  if (w.__logoFallback) return;
  w.__logoFallback = (img: HTMLImageElement) => {
    const s: string[] = JSON.parse(img.dataset.s || '[]');
    const i = parseInt(img.dataset.i || '0', 10) + 1;
    if (i < s.length) {
      img.dataset.i = String(i);
      img.src = s[i];
    } else {
      const sp = document.createElement('span');
      sp.className = 'ini';
      sp.textContent = img.dataset.ini || '';
      img.replaceWith(sp);
    }
  };
}
