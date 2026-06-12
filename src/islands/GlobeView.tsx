import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import Globe from 'globe.gl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Program } from '../data/programs';
import { passes, defaultSort } from '../lib/filter';
import { statusMeta, STATUS_ORDER } from '../lib/status';
import { logoMarkupHTML, installLogoFallback } from '../lib/logo';
import { $filters, initFiltersFromURL } from '../stores/filters';
import FilterSidebar from '../components/FilterSidebar';
import Logo from '../components/Logo';
import StatusBadge from '../components/StatusBadge';
import SiteNav from '../components/SiteNav';
import BootSequence from '../components/BootSequence';
import AsciiBackdrop from '../components/AsciiBackdrop';
import { useTypewriter } from '../lib/useTypewriter';
import { sphereDots, type Dot } from '../lib/globeDots';
import worldGeo from '../data/world-110m.geo.json';

// Country polygons (Natural Earth 110m) for the white border outlines; each
// feature keeps { name, iso } so borders can become per-country interactive
// later. Cast: the bundled JSON isn't a typed GeoJSON module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND_FEATURES = (worldGeo as any).features as any[];

const TITLES: Record<string, { t: string; s: string }> = {
  all: { t: 'Where founders build, worldwide', s: 'Spin the globe or pick a program to fly there; dense cities are mapped below. Status as of June 2026 — verify on each site.' },
  residential: { t: 'Residencies, Hacker Houses & Startup Campuses', s: 'Programs that house or relocate founders. Spin or pick a program to fly there; dense cities are mapped below.' },
  traditional: { t: 'Traditional Accelerators & Incubators', s: 'Accelerators, incubators & talent investors — no live-in component. Dense cities are mapped below.' },
};

// Dense regions get their own crisp, interactive minimap in the dock below the
// globe (one shown at a time, defaulting to SF). Membership is by lat/lng box.
const CLUSTERS = [
  { id: 'sf', label: 'SF Bay Area', bounds: [[37.2, -122.65], [37.95, -121.7]] },
  { id: 'nyc', label: 'New York', bounds: [[40.45, -74.2], [40.95, -73.65]] },
  { id: 'ldn', label: 'London', bounds: [[51.25, -0.55], [51.72, 0.3]] },
  { id: 'blr', label: 'Bangalore', bounds: [[12.78, 77.4], [13.18, 77.85]] },
] as const;
const DEFAULT_CITY = 'sf';
function inBounds(p: Program, b: readonly (readonly number[])[]) {
  return p.lat >= b[0][0] && p.lat <= b[1][0] && p.lng >= b[0][1] && p.lng <= b[1][1];
}

// Beacon rings pulse from the dense hubs (cluster centers) by default; a focused
// program gets its own ring layered on top.
const RING_SEEDS = CLUSTERS.map((c) => ({
  lat: (c.bounds[0][0] + c.bounds[1][0]) / 2,
  lng: (c.bounds[0][1] + c.bounds[1][1]) / 2,
}));

function jitter(arr: Program[]) {
  const seen: Record<string, number> = {};
  arr.forEach((p) => {
    const k = p.lat.toFixed(4) + ',' + p.lng.toFixed(4);
    if (seen[k]) {
      const n = seen[k]++;
      const a = n * 2.3;
      p.lat += 0.16 * Math.cos(a);
      p.lng += 0.16 * Math.sin(a);
    } else seen[k] = 1;
  });
}

const keyOf = (p: Program) => p.dataset + '|' + p.name;

/** Best-effort WebGL capability check for the no-WebGL fallback (handoff §19/§28). */
function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// ---- minimal inline icons for the globe's floating controls ----
const svg = { width: 17, height: 17, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const IconMenu = () => (<svg {...svg}><path d="M2 4h12M2 8h12M2 12h12" /></svg>);
const IconClose = () => (<svg {...svg}><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>);
const IconRotate = () => (<svg {...svg}><path d="M13.5 8a5.5 5.5 0 1 1-1.7-3.97" /><path d="M13.6 2.3v2.4h-2.4" /></svg>);
const IconReset = () => (<svg {...svg}><circle cx="8" cy="8" r="5.3" /><path d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15" /></svg>);
const IconMinimap = () => (<svg {...svg}><path d="M2 4.3l4-1.6 4 1.6 4-1.6v9l-4 1.6-4-1.6-4 1.6z" /><path d="M6 2.7v9M10 4.3v9" /></svg>);
const IconLegend = () => (<svg {...svg}><circle cx="3.3" cy="4" r="1.3" /><circle cx="3.3" cy="8" r="1.3" /><circle cx="3.3" cy="12" r="1.3" /><path d="M6.6 4h7.4M6.6 8h7.4M6.6 12h7.4" /></svg>);

const iconBtn =
  'flex h-9 w-9 items-center justify-center rounded-xl border border-line2 bg-[rgba(16,16,16,.78)] text-muted backdrop-blur transition hover:border-a1 hover:text-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeInstance = any;
type MiniRec = { map: L.Map; layer: L.LayerGroup; fitted: boolean };

export default function GlobeView({ programs }: { programs: Program[] }) {
  const filters = useStore($filters);
  const globeWrapEl = useRef<HTMLDivElement>(null);
  const globeEl = useRef<HTMLDivElement>(null);
  const worldRef = useRef<GlobeInstance>(null);
  const [selected, setSelected] = useState<Program | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [loading, setLoading] = useState(true);
  const [webgl, setWebgl] = useState(true);
  const [activeCity, setActiveCity] = useState<string>(DEFAULT_CITY);

  // Everything but the globe starts minimized so the homepage opens on a clean
  // globe; each surface has its own toggle in the floating controls.
  const [panelOpen, setPanelOpen] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // city dock (Leaflet minimaps, managed imperatively)
  const cityElRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cityMaps = useRef<Record<string, MiniRec>>({});

  const data = useMemo(() => {
    const copy = programs.map((p) => ({ ...p }));
    jitter(copy);
    return copy;
  }, [programs]);

  const shown = useMemo(() => defaultSort(data.filter((p) => passes(p, filters))), [data, filters]);

  // Dock membership tracks the dataset toggle only (not search/status), so each
  // dense-city minimap is a stable overview and doesn't rebuild on every keystroke.
  const cityData = useMemo(
    () => data.filter((p) => filters.dataset === 'all' || p.dataset === filters.dataset),
    [data, filters.dataset],
  );
  const cityCounts = useMemo(() => {
    const m: Record<string, number> = {};
    CLUSTERS.forEach((c) => {
      m[c.id] = cityData.filter((p) => inBounds(p, c.bounds)).length;
    });
    return m;
  }, [cityData]);

  function seedRings(focus: Program | null) {
    const world = worldRef.current;
    if (!world) return;
    const rings: { lat: number; lng: number }[] = RING_SEEDS.map((r) => ({ ...r }));
    if (focus) rings.push({ lat: focus.lat, lng: focus.lng });
    world.ringsData(rings);
  }

  function openDetail(p: Program) {
    setSelected(p);
    const world = worldRef.current;
    if (world) {
      world.controls().autoRotate = false;
      setSpinning(false);
      world.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.7 }, 900);
      seedRings(p);
    }
  }

  // ---- mount the globe ----
  useEffect(() => {
    initFiltersFromURL();
    installLogoFallback();
    if (!globeEl.current || !globeWrapEl.current || worldRef.current) return;

    // No-WebGL fallback: skip globe init and show the list-view escape hatch.
    if (!hasWebGL()) {
      setWebgl(false);
      setLoading(false);
      return;
    }
    const reduceMotion = prefersReducedMotion();

    // globe.gl's factory call signature isn't well typed; cast to call it.
    const world: GlobeInstance = (Globe as unknown as (cfg?: object) => (el: HTMLElement) => GlobeInstance)({ animateIn: false })(globeEl.current)
      // Whole-sphere fine dot mesh (land bright, ocean dim) + white country
      // borders, over a transparent (page-black) backdrop. No photo textures.
      .backgroundColor('rgba(0,0,0,0)')
      .showGlobe(true)
      .showGraticules(false)
      .pointsData(sphereDots(2))
      .pointLat('lat')
      .pointLng('lng')
      .pointColor((d: Dot) => (d.land ? '#f2f2f2' : '#242424'))
      .pointAltitude(0.003)
      .pointRadius((d: Dot) => (d.land ? 0.34 : 0.28))
      .pointResolution(6)
      .pointsMerge(true)
      // Country borders (identifiable for future per-country interactivity).
      .polygonsData(LAND_FEATURES)
      .polygonCapColor(() => 'rgba(0,0,0,0)')
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(() => 'rgba(255,255,255,0.42)')
      .polygonAltitude(0.006)
      .showAtmosphere(true)
      .atmosphereColor('#ffffff')
      .atmosphereAltitude(0.13)
      // Beacon rings = the "support signal" pulsing where founders can land.
      .ringColor(() => (t: number) => `rgba(255,255,255,${1 - t})`)
      .ringMaxRadius(3.4)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1400)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.012)
      .htmlElement((d: Program) => {
        const el = document.createElement('div');
        el.className = 'pin';
        el.style.setProperty('--ring', statusMeta(d.status).color);
        el.innerHTML = `<div class="pin-inner">${logoMarkupHTML(d.name, d.domain)}</div>`;
        el.title = d.name;
        el.onclick = (ev) => {
          ev.stopPropagation();
          openDetail(d);
        };
        return el;
      })
      .htmlElementVisibilityModifier((el: HTMLElement, isVisible: boolean) => {
        el.style.opacity = isVisible ? '1' : '0';
        el.style.pointerEvents = isVisible ? 'auto' : 'none';
      });

    world.htmlElementsData(shown);
    world.pointOfView({ lat: 22, lng: 8, altitude: 2.4 }, 0);
    const controls = world.controls();
    controls.autoRotate = !reduceMotion;
    if (reduceMotion) setSpinning(false);
    controls.autoRotateSpeed = 0.45;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    // Clamp zoom so the dot grid stays legible — close-up detail lives in the minimaps.
    controls.minDistance = 185;
    controls.maxDistance = 560;
    try {
      const gm = world.globeMaterial();
      if (gm?.color?.set) {
        // Near-black sphere so only the white dots and rings read.
        gm.color.set('#050505');
        if (gm.emissive?.set) gm.emissive.set('#000000');
        if (gm.shininess != null) gm.shininess = 0;
      }
    } catch {
      /* material not ready yet — non-fatal */
    }
    worldRef.current = world;
    seedRings(null);

    const fit = () => world.width(globeWrapEl.current!.clientWidth).height(globeWrapEl.current!.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(globeWrapEl.current);
    // Hold the boot splash long enough for the terminal lines to type out.
    const t = setTimeout(() => setLoading(false), 2400);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // react to filter changes (globe pins)
  useEffect(() => {
    if (worldRef.current) worldRef.current.htmlElementsData(shown);
  }, [shown]);

  // ---- city minimaps: build the active one lazily, keep markers in sync ----
  // Only while the dock is open; tear the Leaflet maps down when it closes so
  // they rebuild cleanly (and correctly sized) on the next open.
  useEffect(() => {
    if (!dockOpen) {
      Object.values(cityMaps.current).forEach((r) => r.map.remove());
      cityMaps.current = {};
      return;
    }
    CLUSTERS.forEach((cfg) => {
      const el = cityElRefs.current[cfg.id];
      if (!el) return;
      const members = cityData.filter((p) => inBounds(p, cfg.bounds));
      const isActive = cfg.id === activeCity;
      let rec = cityMaps.current[cfg.id];

      if (members.length === 0) {
        if (rec) {
          rec.map.remove();
          delete cityMaps.current[cfg.id];
        }
        return;
      }
      if (!rec) {
        if (!isActive) return; // build only when its tab is first opened
        const map = L.map(el, { zoomControl: true, attributionControl: false, fadeAnimation: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19 }).addTo(map);
        const layer = L.layerGroup().addTo(map);
        rec = { map, layer, fitted: false };
        cityMaps.current[cfg.id] = rec;
      }
      rec.layer.clearLayers();
      members.forEach((p) => {
        const color = statusMeta(p.status).color;
        const icon = L.divIcon({
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          html: `<div class="pin" style="--ring:${color}"><div class="pin-inner">${logoMarkupHTML(p.name, p.domain)}</div></div>`,
        });
        L.marker([p.lat, p.lng], { icon, riseOnHover: true }).on('click', () => openDetail(p)).addTo(rec!.layer);
      });
      if (isActive) {
        const b = L.latLngBounds(members.map((p) => [p.lat, p.lng] as [number, number]));
        const r = rec;
        requestAnimationFrame(() => {
          r.map.invalidateSize();
          if (!r.fitted) {
            r.map.fitBounds(b, { maxZoom: 13, padding: [20, 20] });
            r.fitted = true;
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dockOpen, activeCity, cityData]);

  // tear down minimaps on unmount
  useEffect(
    () => () => {
      Object.values(cityMaps.current).forEach((r) => r.map.remove());
      cityMaps.current = {};
    },
    [],
  );

  function toggleSpin() {
    const world = worldRef.current;
    if (!world) return;
    const c = world.controls();
    c.autoRotate = !c.autoRotate;
    setSpinning(c.autoRotate);
  }
  function reset() {
    const world = worldRef.current;
    setSelected(null);
    if (!world) return;
    world.pointOfView({ lat: 22, lng: 8, altitude: 2.4 }, 900);
    world.controls().autoRotate = true;
    setSpinning(true);
    seedRings(null);
  }

  const title = TITLES[filters.dataset] ?? TITLES.all;
  const tagline = useTypewriter('~/ wherever you land, you can build', { speed: 46, startDelay: 2600, loop: true });

  return (
    // The globe is the homepage: it fills the viewport, and every other surface
    // (programs panel, minimaps, legend) is a toggleable overlay on top of it.
    <div className="relative h-screen overflow-hidden">
      <div ref={globeWrapEl} className="absolute inset-0 overflow-hidden bg-black">
        {/* Drifting ASCII starfield sits behind the globe (z-0). */}
        {webgl && <AsciiBackdrop />}
        {/* z-[1] gives the globe its own stacking context so pin z-indexes stay below the overlay UI */}
        <div ref={globeEl} className="absolute inset-0 z-[1]" />
        {/* Terminal boot-up loader, faded out once the globe is ready. */}
        {webgl && (
          <div
            className={`absolute inset-0 z-40 flex items-center justify-center bg-black transition-opacity duration-700 ${loading ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <BootSequence count={data.length} />
          </div>
        )}
        {!webgl && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="font-display text-[16px] font-bold text-text">3D globe unavailable</div>
            <p className="m-0 max-w-[360px] text-[13px] text-muted">
              Your browser or device can't render the 3D globe. You can still browse every program in list view.
            </p>
            <a
              href={`/explore${typeof window !== 'undefined' ? window.location.search : ''}`}
              className="rounded-md border border-transparent px-4 py-2.5 font-display text-[13px] font-bold text-[#0a0a0a] no-underline"
              style={{ background: 'var(--grad)' }}
            >
              Browse in list view →
            </a>
          </div>
        )}
      </div>

      {/* Top-left: brand wordmark that opens the programs panel (hidden while it's open) */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          aria-label="Open programs panel"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-xl border border-line2 bg-[rgba(16,16,16,.78)] px-3 py-2 font-display text-[13px] font-bold text-text backdrop-blur transition hover:border-a1"
        >
          <IconMenu />
          <span>Founder&nbsp;Atlas</span>
        </button>
      )}

      {/* Top-right: icon controls — rotate / reset, then panel toggles */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button
          className={`${iconBtn} ${spinning ? 'border-a1 text-a2' : ''}`}
          onClick={toggleSpin}
          aria-pressed={spinning}
          aria-label="Toggle auto-rotate"
          title={spinning ? 'Auto-rotate: on' : 'Auto-rotate: off'}
        >
          <IconRotate />
        </button>
        <button className={iconBtn} onClick={reset} aria-label="Reset view" title="Reset view">
          <IconReset />
        </button>
        <div className="mx-auto my-0.5 h-px w-5 bg-line2" />
        <button
          className={`${iconBtn} ${dockOpen ? 'border-a1 text-a2' : ''}`}
          onClick={() => setDockOpen((v) => !v)}
          aria-pressed={dockOpen}
          aria-label="Toggle city minimaps"
          title="City minimaps"
        >
          <IconMinimap />
        </button>
        <button
          className={`${iconBtn} ${legendOpen ? 'border-a1 text-a2' : ''}`}
          onClick={() => setLegendOpen((v) => !v)}
          aria-pressed={legendOpen}
          aria-label="Toggle status legend"
          title="Status legend"
        >
          <IconLegend />
        </button>
      </div>

      {/* Bottom-left interaction hint */}
      <div className="term pointer-events-none absolute bottom-4 left-4 z-10 rounded-[3px] border border-line bg-[rgba(16,16,16,.6)] px-2.5 py-1.5 text-[11px] text-muted backdrop-blur">
        drag to rotate · scroll to zoom
      </div>

      {/* Legend (toggle) — bottom-left, above the hint, clear of the minimap window */}
      {legendOpen && (
        <div className="legend absolute bottom-14 left-4 z-20">
          <b>Recruiting status</b>
          {STATUS_ORDER.map((k) => {
            const s = statusMeta(k);
            return (
              <div key={k}>
                <span className="k" style={{ background: s.color }} />
                {s.label}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="absolute right-[18px] top-1/2 z-[25] w-[330px] -translate-y-1/2 rounded-[3px] border border-line2 bg-[rgba(10,10,10,.94)] p-[18px] shadow-[0_24px_70px_rgba(0,0,0,.65)] backdrop-blur-[18px]">
          <button className="absolute right-3.5 top-3 border-none bg-transparent text-[18px] text-muted hover:text-white" onClick={() => setSelected(null)}>
            ✕
          </button>
          <div className="mb-2.5 flex items-center gap-3">
            <Logo name={selected.name} domain={selected.domain} size={48} />
            <div>
              <div className="font-display text-[16px] font-bold leading-tight">{selected.name}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-a2">{selected.type}</div>
            </div>
          </div>
          <div className="mb-3">
            <StatusBadge status={selected.status} full />
          </div>
          <div className="flex flex-col gap-2 text-[12px] leading-snug">
            <div>📍 <b className="text-muted">Location: </b>{selected.city}, {selected.country}</div>
            <div>🎯 <b className="text-muted">Focus: </b>{selected.focus}</div>
            <div>🧭 <b className="text-muted">Run by: </b>{selected.operator || 'Not publicly listed'}</div>
            <div>🌱 <b className="text-muted">Stage: </b>{selected.stage}</div>
            {selected.status_detail && (
              <div>📋 <b className="text-muted">Details: </b>{selected.status_detail}</div>
            )}
          </div>
          {selected.highlight && (
            <div className="mt-3 border-t border-line pt-3 text-[11.5px] italic leading-normal text-muted">{selected.highlight}</div>
          )}
          <a
            href={selected.url}
            target="_blank"
            rel="noopener"
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-[#0a0a0a] no-underline"
            style={{ background: 'var(--grad)' }}
          >
            Visit program →
          </a>
        </div>
      )}

      {/* City minimap — a bottom-right floating window (so the left programs
          panel never covers it, and it doesn't swallow the whole bottom edge). */}
      {dockOpen && (
        <div className="absolute bottom-4 right-4 z-20 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[3px] border border-line2 bg-[rgba(10,10,10,.92)] shadow-[0_18px_50px_rgba(0,0,0,.6)] backdrop-blur">
          <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
            <div className="flex flex-1 flex-wrap gap-1.5">
              {CLUSTERS.map((c) => (
                <button key={c.id} className={`citytab ${activeCity === c.id ? 'active' : ''}`} onClick={() => setActiveCity(c.id)}>
                  <span className="led" />
                  {c.label} <b>{cityCounts[c.id] ?? 0}</b>
                </button>
              ))}
            </div>
            <button
              onClick={() => setDockOpen(false)}
              aria-label="Close minimaps"
              className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-line2 text-muted transition hover:border-a1 hover:text-text"
            >
              <IconClose />
            </button>
          </div>
          <div className="relative h-[260px]">
            {CLUSTERS.map((c) => {
              const empty = (cityCounts[c.id] ?? 0) === 0;
              return (
                <div
                  key={c.id}
                  ref={(el) => {
                    cityElRefs.current[c.id] = el;
                  }}
                  className={`citymap ${activeCity === c.id ? 'active' : ''} ${empty ? 'empty' : ''}`}
                >
                  {empty ? 'No programs in this dataset' : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Programs panel — slides in over the globe from the left */}
      <aside
        aria-hidden={!panelOpen}
        className={`absolute left-0 top-0 z-30 flex h-full w-[360px] min-w-[360px] flex-col border-r border-line bg-panel backdrop-blur-[18px] transition-transform duration-300 max-[760px]:hidden ${
          panelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-line px-5 pb-3 pt-3">
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close panel"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line2 text-muted transition hover:border-a1 hover:text-text"
            >
              <IconClose />
            </button>
          </div>
          <div className="mb-3">
            <SiteNav current="globe" />
          </div>
          <h1 className="m-0 mb-2 font-display text-[19px] font-bold leading-[1.18]" style={{ color: 'var(--text)' }}>
            {title.t}
          </h1>
          <div className="term mb-1.5 text-[11px] text-a2">
            {tagline}
            <span className="term-cursor" />
          </div>
          <div className="max-w-[300px] text-[11.5px] leading-normal text-muted">{title.s}</div>
        </div>
        <div className="px-5 py-3">
          <FilterSidebar programs={programs} variant="sidebar" />
        </div>
        <div className="term px-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          {shown.length} of {data.length} programs
        </div>
        <div className="flex-1 overflow-y-auto pb-3.5">
          {shown.map((p) => {
            const s = statusMeta(p.status);
            return (
              <button
                key={keyOf(p)}
                onClick={() => openDetail(p)}
                className="flex w-full items-center gap-3 border-l-2 border-transparent px-5 py-2.5 text-left transition hover:border-a1 hover:bg-[rgba(255,255,255,.06)]"
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
    </div>
  );
}
