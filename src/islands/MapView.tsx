import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@nanostores/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Program } from '../data/programs';
import { passes, defaultSort } from '../lib/filter';
import { statusMeta, STATUS_ORDER } from '../lib/status';
import { logoMarkupHTML, installLogoFallback } from '../lib/logo';
import { $filters, initFiltersFromURL } from '../stores/filters';
import FilterSidebar from '../components/FilterSidebar';
import Logo from '../components/Logo';

const TITLES: Record<string, { t: string; s: string }> = {
  all: {
    t: 'Where founders build, worldwide',
    s: 'Find the best places to relocate and the startup support waiting there — click a pin or list item for details. Status as of June 2026 — verify on each site.',
  },
  residential: {
    t: 'Residencies, Hacker Houses & Startup Campuses',
    s: 'Programs that house or relocate founders. Click a pin for details. Status as of June 2026 — verify on each site.',
  },
  traditional: {
    t: 'Traditional Accelerators & Incubators',
    s: 'Accelerators, incubators & talent investors — no live-in component. Status as of June 2026 — verify on each site.',
  },
};

// Off-coast cluster callouts for dense regions (ported from index.html).
// `place` is an open-ocean lat/lng where the card floats; `anchor` is the true
// location the leader line points back to — keeps cards off land pins.
const CLUSTERS = [
  { id: 'sf', label: 'SF Bay Area', bounds: [[37.2, -122.65], [37.95, -121.7]], anchor: [37.62, -122.1], place: [32.0, -132.0] }, // Eastern Pacific
  { id: 'nyc', label: 'New York', bounds: [[40.45, -74.2], [40.95, -73.65]], anchor: [40.71, -74.01], place: [39.0, -57.0] }, // North Atlantic
  { id: 'ldn', label: 'London', bounds: [[51.25, -0.55], [51.72, 0.3]], anchor: [51.51, -0.12], place: [52.0, -40.0] }, // North Atlantic, above NYC
  { id: 'blr', label: 'Bangalore', bounds: [[12.78, 77.4], [13.18, 77.85]], anchor: [12.97, 77.59], place: [3.0, 80.0] }, // Indian Ocean
] as const;
const INSET_MIN_MEMBERS = 3;
const INSET_SHOW_MAX_ZOOM = 5;

// Spread markers sharing a coordinate so they don't fully overlap.
function jitter(arr: Program[]) {
  const seen: Record<string, number> = {};
  arr.forEach((p) => {
    const k = p.lat.toFixed(4) + ',' + p.lng.toFixed(4);
    if (seen[k]) {
      const n = seen[k]++;
      const a = n * 2.3;
      p.lat += 0.012 * Math.cos(a);
      p.lng += 0.012 * Math.sin(a);
    } else seen[k] = 1;
  });
}

function popupHTML(p: Program): string {
  const s = statusMeta(p.status);
  const r = (ic: string, label: string, val: string) =>
    `<div class="row"><span class="ic">${ic}</span><div><b>${label}</b>${val}</div></div>`;
  return `<div class="pop">
    <div class="pop-head"><div class="pop-logo">${logoMarkupHTML(p.name, p.domain)}</div>
      <div><div class="pop-title">${p.name}</div><div class="pop-type">${p.type}</div></div></div>
    <span class="badge" style="background:${s.color}"><span class="k"></span>${s.label}</span>
    <div class="rows">
      ${r('📍', 'Location: ', p.city + ', ' + p.country)}
      ${r('🎯', 'Focus: ', p.focus)}
      ${r('🧭', 'Run by: ', p.operator || 'Not publicly listed')}
      ${r('🌱', 'Stage: ', p.stage)}
      ${p.status_detail ? r('📋', 'Details: ', p.status_detail) : ''}
    </div>
    ${p.highlight ? `<div class="hl">${p.highlight}</div>` : ''}
    <a class="pop-link" href="${p.url}" target="_blank" rel="noopener">Visit program →</a>
  </div>`;
}

const keyOf = (p: Program) => p.dataset + '|' + p.name;

export default function MapView({ programs }: { programs: Program[] }) {
  const filters = useStore($filters);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const insetsRef = useRef<{ cfg: (typeof CLUSTERS)[number]; card: HTMLElement; mini: L.Map; members: Program[] }[]>([]);
  const insetCovered = useRef<Set<string>>(new Set());
  const leaderSvgRef = useRef<SVGSVGElement | null>(null);

  // jitter once
  const data = useMemo(() => {
    const copy = programs.map((p) => ({ ...p }));
    jitter(copy);
    return copy;
  }, [programs]);

  const shown = useMemo(() => defaultSort(data.filter((p) => passes(p, filters))), [data, filters]);

  function focusProgram(p: Program) {
    const map = mapRef.current;
    const m = markers.current.get(keyOf(p));
    if (!map) return;
    map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 5), { duration: 0.8 });
    setTimeout(() => m && m.openPopup(), 350);
  }

  // ---- mount: build the map, markers, insets, legend ----
  useEffect(() => {
    initFiltersFromURL();
    installLogoFallback();
    if (!mapEl.current || mapRef.current) return;

    const map = L.map(mapEl.current, { worldCopyJump: true, minZoom: 2, zoomControl: true }).setView([28, 4], 2.4);
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    const tint = document.createElement('div');
    tint.className = 'map-tint';
    map.getContainer().appendChild(tint);
    const markerLayer = L.layerGroup().addTo(map);

    data.forEach((p) => {
      const color = statusMeta(p.status).color;
      const icon = L.divIcon({
        className: '',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -22],
        html: `<div class="pin" style="--ring:${color}"><div class="pin-inner">${logoMarkupHTML(p.name, p.domain)}</div></div>`,
      });
      const m = L.marker([p.lat, p.lng], { icon, riseOnHover: true });
      m.bindPopup(popupHTML(p), { maxWidth: 320 });
      m.addTo(markerLayer);
      markers.current.set(keyOf(p), m);
    });

    // legend
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const d = L.DomUtil.create('div', 'legend');
      let h = '<b>Recruiting status</b>';
      STATUS_ORDER.forEach((k) => {
        const s = statusMeta(k);
        h += `<div><span class="k" style="background:${s.color}"></span>${s.label}</div>`;
      });
      d.innerHTML = h;
      return d;
    };
    legend.addTo(map);

    // inset leader svg
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'inset-leaders');
    map.getContainer().appendChild(svg);
    leaderSvgRef.current = svg;

    map.on('move zoom moveend zoomend resize', updateInsets);
    window.addEventListener('resize', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      map.remove();
      mapRef.current = null;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ---- inset (off-coast callout) system ----
  function inBounds(p: Program, b: readonly (readonly number[])[]) {
    return p.lat >= b[0][0] && p.lat <= b[1][0] && p.lng >= b[0][1] && p.lng <= b[1][1];
  }
  function clearInsets() {
    insetsRef.current.forEach((o) => {
      o.mini.remove();
      o.card.remove();
    });
    insetsRef.current = [];
    if (leaderSvgRef.current) leaderSvgRef.current.innerHTML = '';
  }
  function buildInsets(active: Program[]) {
    const map = mapRef.current;
    if (!map) return;
    clearInsets();
    const cont = map.getContainer();
    CLUSTERS.forEach((cfg) => {
      const members = active.filter((p) => inBounds(p, cfg.bounds));
      if (members.length < INSET_MIN_MEMBERS) return;
      const card = document.createElement('div');
      card.className = 'inset-card';
      card.dataset.id = cfg.id;
      card.innerHTML = `<div class="inset-head"><span class="lbl">${cfg.label}</span><b>${members.length}</b></div><div class="inset-map"></div>`;
      cont.appendChild(card);
      const miniEl = card.querySelector('.inset-map') as HTMLElement;
      const mini = L.map(miniEl, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        fadeAnimation: false,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(mini);
      members.forEach((p) => {
        const color = statusMeta(p.status).color;
        const icon = L.divIcon({
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          html: `<div class="pin" style="--ring:${color}"><div class="pin-inner">${logoMarkupHTML(p.name, p.domain)}</div></div>`,
        });
        L.marker([p.lat, p.lng], { icon, riseOnHover: true })
          .on('click', () => {
            map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 12), { duration: 0.8 });
            const mk = markers.current.get(keyOf(p));
            setTimeout(() => mk && mk.openPopup(), 650);
          })
          .addTo(mini);
      });
      const b = L.latLngBounds(members.map((p) => [p.lat, p.lng] as [number, number]));
      const fit = () => {
        if (miniEl.clientWidth && miniEl.clientHeight) {
          mini.invalidateSize();
          mini.fitBounds(b, { maxZoom: 13, padding: [14, 14] });
        }
      };
      new ResizeObserver(fit).observe(miniEl);
      requestAnimationFrame(fit);
      insetsRef.current.push({ cfg, card, mini, members });
    });
    updateInsets();
  }
  function updateInsets() {
    const map = mapRef.current;
    const svg = leaderSvgRef.current;
    if (!map || !svg) return;
    const cont = map.getContainer();
    const W = cont.clientWidth;
    const H = cont.clientHeight;
    const M = 24;
    svg.setAttribute('width', String(W));
    svg.setAttribute('height', String(H));
    svg.innerHTML = '';
    const zoomOK = map.getZoom() <= INSET_SHOW_MAX_ZOOM;
    const covered = new Set<string>();
    insetsRef.current.forEach((o) => {
      const ap = map.latLngToContainerPoint([...o.cfg.anchor] as L.LatLngTuple);
      if (zoomOK) o.members.forEach((p) => covered.add(keyOf(p)));
      const anchorVisible = ap.x >= -40 && ap.x <= W + 40 && ap.y >= -40 && ap.y <= H + 40;
      if (!zoomOK || !anchorVisible) {
        o.card.classList.add('hidden');
        return;
      }
      o.card.classList.remove('hidden');
      const cw = o.card.offsetWidth || 190;
      const ch = o.card.offsetHeight || 178;
      // Position the card centered over its open-ocean `place` point; the leader
      // still draws from `ap` (the true anchor) so the link to the city stays clear.
      const pp = map.latLngToContainerPoint([...o.cfg.place] as L.LatLngTuple);
      let left = pp.x - cw / 2;
      let top = pp.y - ch / 2;
      left = Math.max(M, Math.min(left, W - cw - M));
      top = Math.max(M, Math.min(top, H - ch - M));
      o.card.style.left = left + 'px';
      o.card.style.top = top + 'px';
      const tx = Math.max(left, Math.min(ap.x, left + cw));
      const ty = Math.max(top, Math.min(ap.y, top + ch));
      const ns = 'http://www.w3.org/2000/svg';
      const ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', String(ap.x));
      ln.setAttribute('y1', String(ap.y));
      ln.setAttribute('x2', String(tx));
      ln.setAttribute('y2', String(ty));
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', String(ap.x));
      dot.setAttribute('cy', String(ap.y));
      dot.setAttribute('r', '3');
      svg.appendChild(ln);
      svg.appendChild(dot);
    });
    insetCovered.current.forEach((k) => {
      if (!covered.has(k)) {
        const m = markersByKey(k);
        if (m && m._icon) m._icon.style.display = '';
      }
    });
    covered.forEach((k) => {
      const m = markersByKey(k);
      if (m && m._icon) m._icon.style.display = 'none';
    });
    insetCovered.current = covered;
  }
  function markersByKey(k: string): (L.Marker & { _icon?: HTMLElement }) | undefined {
    return markers.current.get(k) as (L.Marker & { _icon?: HTMLElement }) | undefined;
  }

  // ---- react to filter changes: toggle marker visibility + rebuild insets ----
  useEffect(() => {
    if (!mapRef.current) return;
    const pass = new Set(shown.map(keyOf));
    markers.current.forEach((m, k) => {
      const mk = m as L.Marker & { _icon?: HTMLElement };
      const ok = pass.has(k);
      m.setOpacity(ok ? 1 : 0);
      if (mk._icon) {
        mk._icon.style.pointerEvents = ok ? 'auto' : 'none';
        mk._icon.style.display = ok ? '' : 'none';
      }
    });
    buildInsets(shown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const title = TITLES[filters.dataset] ?? TITLES.all;

  return (
    <div className="flex h-screen">
      <aside className="relative z-[5] flex w-[360px] min-w-[360px] flex-col border-r border-line bg-panel backdrop-blur-[18px] max-[760px]:hidden">
        <div className="border-b border-line px-5 pb-3 pt-[18px]">
          <div className="mb-2 font-display text-[10.5px] font-semibold uppercase tracking-[.22em] text-a2">
            Founder Atlas · 2026
          </div>
          <div className="mb-2.5">
            <nav className="viewnav" aria-label="Views">
              <a href="/">Home</a>
              <a href="/explore">Explore</a>
              <a href="/map" className="active" aria-current="page">Map</a>
              <a href="/globe">Globe</a>
              <a href="/dashboard">Dashboard</a>
            </nav>
          </div>
          <h1
            className="m-0 mb-2 font-display text-[19px] font-bold leading-[1.18]"
            style={{ color: 'var(--text)' }}
          >
            {title.t}
          </h1>
          <div className="max-w-[300px] text-[11.5px] leading-normal text-muted">{title.s}</div>
        </div>
        <div className="px-5 py-3">
          <FilterSidebar programs={programs} variant="sidebar" />
        </div>
        <div className="px-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          {shown.length} of {data.length} programs
        </div>
        <div className="flex-1 overflow-y-auto pb-3.5">
          {shown.map((p) => {
            const s = statusMeta(p.status);
            return (
              <button
                key={keyOf(p)}
                onClick={() => focusProgram(p)}
                className="flex w-full items-center gap-3 border-l-2 border-transparent px-5 py-2.5 text-left transition hover:border-a1 hover:bg-[rgba(124,92,255,.10)]"
              >
                <Logo name={p.name} domain={p.domain} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">
                    {p.city}, {p.country} · {p.type}
                  </span>
                </span>
                <span className="h-[9px] w-[9px] flex-[0_0_9px] rounded-full" style={{ background: s.color }} title={s.label} />
              </button>
            );
          })}
        </div>
      </aside>
      <div ref={mapEl} className="h-full flex-1 bg-bg0" />
    </div>
  );
}
