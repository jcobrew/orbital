import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import Globe from 'globe.gl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Program } from '../data/programs';
import { programModel } from '../data/programs';
import { passes, defaultSort } from '../lib/filter';
import { statusMeta, STATUS_ORDER } from '../lib/status';
import { logoMarkupHTML, installLogoFallback } from '../lib/logo';
import { $filters, initFiltersFromURL } from '../stores/filters';
import { openCountry } from '../stores/country';
import { countrySlug, hasCountryProfile } from '../data/countries';
import FilterSidebar from '../components/FilterSidebar';
import Logo from '../components/Logo';
import StatusBadge from '../components/StatusBadge';
import SiteNav from '../components/SiteNav';
import BootSequence from '../components/BootSequence';
import { useTypewriter } from '../lib/useTypewriter';
import worldGeo from '../data/world-110m.geo.json';

// Country polygons (Natural Earth 110m) for the white border outlines; each
// feature keeps { name, iso } so borders can become per-country interactive
// later. Cast: the bundled JSON isn't a typed GeoJSON module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND_FEATURES = (worldGeo as any).features as any[];

// Natural-Earth polygon names don't always match the dataset's `country` values
// (which the country profiles are keyed on). Bridge the handful that differ so a
// click on the globe resolves to the right country card.
const GEO_NAME_ALIAS: Record<string, string> = {
  'United States of America': 'USA',
  'United Kingdom': 'UK',
  'United Arab Emirates': 'UAE',
};

/** Dataset country name for a polygon feature, or null if we have no profile. */
function countryFromFeature(feat: { properties?: { name?: string } } | undefined): string | null {
  const geoName = feat?.properties?.name;
  if (!geoName) return null;
  const name = GEO_NAME_ALIAS[geoName] ?? geoName;
  return hasCountryProfile(name) ? name : null;
}

const TITLE_ALL = {
  t: 'Where founders gather',
  s: 'Spin the globe or pick a residency to fly there; the houses with the strongest pull are mapped below. Status as of June 2026 — verify on each site.',
};
const MODEL_TITLES: Record<string, string> = {
  'co-living': 'Live-in residencies',
  'co-working': 'Co-working bases',
  both: 'Live & build together',
};
/** Heading when a living/working model is selected. */
function titleFor(model: string): { t: string; s: string } {
  if (!model || !MODEL_TITLES[model]) return TITLE_ALL;
  const t = MODEL_TITLES[model];
  return { t, s: `${t} — spin or pick a place to fly there; dense cities are mapped below.` };
}

// Dense regions can get their own crisp, interactive minimap (shown one at a
// time). Membership is by lat/lng box. `pin` optionally places the clickable
// globe marker off-coast so it isn't buried under the program pins it summarizes.
// A marker only appears when the region actually clusters programs (see MIN_DENSITY).
const CLUSTERS = [
  { id: 'sf', label: 'SF Bay Area', bounds: [[37.2, -122.65], [37.95, -121.7]], pin: [37.55, -123.7] },
  { id: 'nyc', label: 'New York', bounds: [[40.45, -74.2], [40.95, -73.65]] },
  { id: 'ldn', label: 'London', bounds: [[51.25, -0.55], [51.72, 0.3]], pin: [51.45, 1.95] },
  { id: 'blr', label: 'Bangalore', bounds: [[12.78, 77.4], [13.18, 77.85]] },
] as const;
const DEFAULT_CITY = 'sf';
// A minimap/marker is only worthwhile where programs cluster too tightly to
// click apart on the globe — i.e. this many or more in the box. At 3 the pins
// already crowd into each other, so that's where the minimap takes over.
const MIN_DENSITY = 3;
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
  // Pins are a fixed pixel size, so any two programs sitting within a degree or
  // so of each other (e.g. FR8 in Espoo and Founders House in Helsinki) render
  // as one overlapping blob on the globe — not just exact-coordinate dupes.
  // Group every set of near-neighbours and fan them out evenly around the
  // group's centre so each reads as a distinct node.
  //
  // Programs inside a defined dense-cluster box are skipped: they collapse into
  // that city's minimap, and nudging them could change the box's program count
  // (which drives the minimap threshold).
  const PROX = 0.9; // ≈ how close two programs must be to collide as pins
  const SPREAD = 0.5; // ring radius the group fans out to
  type Cluster = { lat: number; lng: number; members: Program[] };
  const clusters: Cluster[] = [];
  arr.forEach((p) => {
    if (CLUSTERS.some((c) => inBounds(p, c.bounds))) return;
    const near = clusters.find(
      (cl) => Math.abs(cl.lat - p.lat) < PROX && Math.abs(cl.lng - p.lng) < PROX,
    );
    if (near) near.members.push(p);
    else clusters.push({ lat: p.lat, lng: p.lng, members: [p] });
  });
  clusters.forEach((c) => {
    if (c.members.length < 2) return;
    const cLat = c.members.reduce((s, p) => s + p.lat, 0) / c.members.length;
    const cLng = c.members.reduce((s, p) => s + p.lng, 0) / c.members.length;
    const step = (2 * Math.PI) / c.members.length;
    c.members.forEach((p, i) => {
      const a = i * step;
      p.lat = cLat + SPREAD * Math.cos(a);
      p.lng = cLng + SPREAD * Math.sin(a);
    });
  });
}

const keyOf = (p: Program) => (p.canonicalType ?? 'other') + '|' + p.name;

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

// HTML-string twin of <IconMinimap> for the clickable city markers rendered as
// globe.gl htmlElements (which take raw DOM, not React).
const MINIMAP_SVG =
  '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.3l4-1.6 4 1.6 4-1.6v9l-4 1.6-4-1.6-4 1.6z"/><path d="M6 2.7v9M10 4.3v9"/></svg>';

// Escape user/data strings before injecting into the imperative pin markup.
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

const iconBtn =
  'flex h-9 w-9 items-center justify-center rounded-full border border-line2 bg-[rgba(16,16,16,.78)] text-muted backdrop-blur transition hover:border-a1 hover:bg-[rgba(255,255,255,.07)] hover:text-text active:scale-90';
// Pressed/active (selected) look for a toggle icon button.
const iconBtnOn = 'border-a1 bg-[rgba(255,255,255,.12)] text-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeInstance = any;
type MiniRec = { map: L.Map; layer: L.LayerGroup; fitted: boolean };

export default function GlobeView({ programs }: { programs: Program[] }) {
  const filters = useStore($filters);
  const globeWrapEl = useRef<HTMLDivElement>(null);
  const globeEl = useRef<HTMLDivElement>(null);
  const worldRef = useRef<GlobeInstance>(null);
  // Currently hovered country polygon (for the hover highlight + pointer cursor).
  const hoverPolyRef = useRef<unknown>(null);
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
  // Floating country-name tooltip (follows the cursor over the globe).
  const countryTipEl = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    const copy = programs.map((p) => ({ ...p }));
    jitter(copy);
    return copy;
  }, [programs]);

  const shown = useMemo(() => defaultSort(data.filter((p) => passes(p, filters))), [data, filters]);

  // Dock membership tracks the program-type filter only (not search/status), so
  // each dense-city minimap is a stable overview and doesn't rebuild on every keystroke.
  const cityData = useMemo(
    () => data.filter((p) => !filters.model || programModel(p) === filters.model),
    [data, filters.model],
  );
  const cityCounts = useMemo(() => {
    const m: Record<string, number> = {};
    CLUSTERS.forEach((c) => {
      m[c.id] = cityData.filter((p) => inBounds(p, c.bounds)).length;
    });
    return m;
  }, [cityData]);

  // Regions dense enough to be represented by a single minimap button instead
  // of a cluster of overlapping program pins.
  const denseClusters = useMemo(
    () => CLUSTERS.filter((c) => (cityCounts[c.id] ?? 0) >= MIN_DENSITY),
    [cityCounts],
  );

  // Clickable minimap markers — one per dense region, placed off-coast (via
  // `pin`) where defined so they're not buried under the pins they replace.
  const cityMarkers = useMemo(
    () =>
      denseClusters.map((c) => {
        const at: readonly [number, number] =
          'pin' in c
            ? (c.pin as readonly [number, number])
            : [(c.bounds[0][0] + c.bounds[1][0]) / 2, (c.bounds[0][1] + c.bounds[1][1]) / 2];
        return {
          marker: true as const,
          id: c.id,
          label: c.label,
          count: cityCounts[c.id] ?? 0,
          lat: at[0],
          lng: at[1],
        };
      }),
    [denseClusters, cityCounts],
  );
  // Globe pins = individual programs NOT inside a dense cluster (those collapse
  // into the cluster's minimap button), plus the city markers themselves.
  const globePins = useMemo(() => {
    const loose = shown.filter((p) => !denseClusters.some((c) => inBounds(p, c.bounds)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [...(loose as any[]), ...cityMarkers];
  }, [shown, denseClusters, cityMarkers]);
  const activeCluster = CLUSTERS.find((c) => c.id === activeCity) ?? CLUSTERS[0];

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

  // Open a city's round minimap (triggered by its globe marker) and fly there.
  function openCity(id: string) {
    setActiveCity(id);
    setDockOpen(true);
    const world = worldRef.current;
    const c = CLUSTERS.find((x) => x.id === id);
    if (world && c) {
      const lat = (c.bounds[0][0] + c.bounds[1][0]) / 2;
      const lng = (c.bounds[0][1] + c.bounds[1][1]) / 2;
      world.controls().autoRotate = false;
      setSpinning(false);
      world.pointOfView({ lat, lng, altitude: 1.7 }, 900);
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
      // Plain monochrome globe: light-grey land filled over a near-black ocean
      // sphere for heavy contrast, with crisp white coastlines and borders.
      .backgroundColor('rgba(0,0,0,0)')
      .showGlobe(true)
      .showGraticules(false)
      // Filled land polygons (the land/ocean contrast) + clickable countries.
      .polygonsData(LAND_FEATURES)
      .polygonCapColor((feat: unknown) =>
        feat === hoverPolyRef.current && countryFromFeature(feat as never)
          ? 'rgba(246,246,246,1)'
          : 'rgba(202,202,202,0.97)',
      )
      .polygonSideColor(() => 'rgba(150,150,150,0.28)')
      .polygonStrokeColor((feat: unknown) =>
        feat === hoverPolyRef.current && countryFromFeature(feat as never)
          ? 'rgba(255,255,255,0.95)'
          : 'rgba(255,255,255,0.6)',
      )
      .polygonAltitude(0.01)
      .onPolygonClick((feat: unknown) => {
        const name = countryFromFeature(feat as never);
        if (name) openCountry(countrySlug(name));
      })
      .onPolygonHover((feat: unknown) => {
        hoverPolyRef.current = feat ?? null;
        const hasProfile = !!countryFromFeature(feat as never);
        if (globeEl.current) globeEl.current.style.cursor = hasProfile ? 'pointer' : '';
        // Show the country name in the floating tooltip (hint arrow if clickable).
        const tip = countryTipEl.current;
        const geoName = (feat as { properties?: { name?: string } } | null)?.properties?.name;
        if (tip) {
          if (geoName) {
            tip.textContent = geoName;
            tip.classList.toggle('has-profile', hasProfile);
            tip.style.opacity = '1';
          } else {
            tip.style.opacity = '0';
          }
        }
        // Re-evaluate cap/stroke so the hovered country lights up.
        world.polygonCapColor(world.polygonCapColor());
        world.polygonStrokeColor(world.polygonStrokeColor());
      })
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .htmlElement((d: any) => {
        // City minimap marker (orbital node) — opens that city's round minimap.
        if (d.marker) {
          const el = document.createElement('div');
          el.className = 'city-pin';
          el.innerHTML =
            `<span class="city-pin-ic">${MINIMAP_SVG}</span>` +
            (d.count ? `<span class="city-pin-ct">${d.count}</span>` : '') +
            `<span class="pin-label">${esc(d.label)}</span>`;
          el.onclick = (ev) => {
            ev.stopPropagation();
            openCity(d.id);
          };
          return el;
        }
        const el = document.createElement('div');
        el.className = 'pin';
        el.style.setProperty('--ring', statusMeta(d.status).color);
        el.innerHTML = `<div class="pin-inner">${logoMarkupHTML(d.name, d.domain)}</div><span class="pin-label">${esc(d.name)}</span>`;
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

    world.htmlElementsData(globePins);
    world.pointOfView({ lat: 22, lng: 8, altitude: 1.9 }, 0);
    const controls = world.controls();
    controls.autoRotate = !reduceMotion;
    if (reduceMotion) setSpinning(false);
    controls.autoRotateSpeed = 0.45;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    // Clamp zoom so the dot grid stays legible — close-up detail lives in the minimaps.
    controls.minDistance = 185;
    controls.maxDistance = 560;
    // Touch devices (coarse pointer) get OrbitControls' native two-finger pinch
    // zoom — still clamped by min/maxDistance. Mice/trackpads keep the custom
    // wheel zoom below: trackpad pinch arrives as ctrl+wheel, so we intercept it
    // to stop the browser page-zooming ("ruins the view") and dolly smoothly,
    // with a finer factor than a plain wheel/scroll.
    const coarsePointer =
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    controls.enableZoom = !!coarsePointer;
    const camera = world.camera();
    const zoomEl = globeEl.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const intensity = e.ctrlKey ? 0.01 : 0.0025;
      const scale = Math.exp(e.deltaY * intensity);
      const tgt = controls.target;
      const off = camera.position.clone().sub(tgt);
      const len = off.length();
      const next = Math.max(controls.minDistance, Math.min(controls.maxDistance, len * scale));
      off.multiplyScalar(next / len);
      camera.position.copy(tgt).add(off);
      controls.update();
    };
    if (!coarsePointer) zoomEl.addEventListener('wheel', onWheel, { passive: false });
    // Keep the country-name tooltip pinned to the cursor over the globe.
    const onPointerMove = (e: PointerEvent) => {
      const tip = countryTipEl.current;
      if (!tip || !globeWrapEl.current) return;
      const r = globeWrapEl.current.getBoundingClientRect();
      tip.style.left = `${e.clientX - r.left}px`;
      tip.style.top = `${e.clientY - r.top}px`;
    };
    zoomEl.addEventListener('pointermove', onPointerMove);
    try {
      const gm = world.globeMaterial();
      if (gm?.color?.set) {
        // Near-black ocean sphere for heavy contrast against the light-grey land.
        gm.color.set('#0c0c0c');
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
      if (!coarsePointer) zoomEl.removeEventListener('wheel', onWheel);
      zoomEl.removeEventListener('pointermove', onPointerMove);
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // react to filter changes (globe pins + city markers)
  useEffect(() => {
    if (worldRef.current) worldRef.current.htmlElementsData(globePins);
  }, [globePins]);

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
        const map = L.map(el, { zoomControl: false, attributionControl: false, fadeAnimation: false });
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
          html: `<div class="pin" style="--ring:${color}"><div class="pin-inner">${logoMarkupHTML(p.name, p.domain)}</div><span class="pin-label">${esc(p.name)}</span></div>`,
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
    world.pointOfView({ lat: 22, lng: 8, altitude: 1.9 }, 900);
    world.controls().autoRotate = true;
    setSpinning(true);
    seedRings(null);
  }

  const title = titleFor(filters.model);
  const tagline = useTypewriter('~/ some places pull you into orbit', { speed: 46, startDelay: 2600, loop: true });

  return (
    // The globe is the homepage: it fills the viewport, and every other surface
    // (programs panel, minimaps, legend) is a toggleable overlay on top of it.
    // 100dvh (not 100vh) so mobile browser chrome doesn't crop the controls.
    <div className="relative h-[100dvh] overflow-hidden">
      <div ref={globeWrapEl} className="absolute inset-0 overflow-hidden bg-black">
        {/* z-[1] gives the globe its own stacking context so pin z-indexes stay below the overlay UI */}
        <div ref={globeEl} className="absolute inset-0 z-[1]" />
        {/* Cursor-following country-name tooltip (positioned imperatively). */}
        <div ref={countryTipEl} className="country-tip" aria-hidden="true" />
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
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-line2 bg-[rgba(16,16,16,.78)] px-3 py-2 font-display text-[13px] font-bold text-text backdrop-blur transition hover:border-a1"
        >
          <IconMenu />
          <span className="orbit-node" aria-hidden="true" />
          <span>Orbital</span>
        </button>
      )}

      {/* Top-right: icon controls — rotate / reset, then panel toggles */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
        <button
          className={`${iconBtn} ${spinning ? iconBtnOn : ''}`}
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
          className={`${iconBtn} ${dockOpen ? iconBtnOn : ''}`}
          onClick={() => setDockOpen((v) => !v)}
          aria-pressed={dockOpen}
          aria-label="Toggle city minimaps"
          title="City minimaps"
        >
          <IconMinimap />
        </button>
        <button
          className={`${iconBtn} ${legendOpen ? iconBtnOn : ''}`}
          onClick={() => setLegendOpen((v) => !v)}
          aria-pressed={legendOpen}
          aria-label="Toggle status legend"
          title="Status legend"
        >
          <IconLegend />
        </button>
      </div>

      {/* Bottom-left interaction hint (pointer devices only) */}
      <div className="term pointer-events-none absolute bottom-4 left-4 z-10 rounded-[3px] border border-line bg-[rgba(16,16,16,.6)] px-2.5 py-1.5 text-[11px] text-muted backdrop-blur max-[760px]:hidden">
        drag to rotate · pinch to zoom · click a ◍ to map a city
      </div>

      {/* Mobile: a clear way into the programs list once the globe has set the
          orbital tone. Hidden on desktop (the left wordmark opens the panel). */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          aria-label="Open programs panel"
          className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-line2 bg-[rgba(16,16,16,.85)] px-4 py-2.5 font-display text-[13px] font-bold text-text backdrop-blur transition hover:border-a1 max-[760px]:inline-flex"
        >
          <span className="orbit-node" aria-hidden="true" />
          Enter the orbit · {data.length}
          <span aria-hidden="true">↑</span>
        </button>
      )}

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
        <div className="orbit-overlay">
          <div className="orbit-stage">
            {/* white ball orbiting the card */}
            <div className="orbit-card-ring">
              <span className="orbit-ball" />
            </div>
            <div className="orbit-card">
              <button className="orbit-close" onClick={() => setSelected(null)} aria-label="Close">
                ✕
              </button>
              <Logo name={selected.name} domain={selected.domain} size={46} />
              <div className="mt-2 font-display text-[17px] font-bold leading-tight">{selected.name}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-a2">{selected.type}</div>
              <div className="mt-2.5">
                <StatusBadge status={selected.status} full />
              </div>
              <div className="orbit-meta">
                <div className="text-text">📍 {selected.city}, {selected.country}</div>
                <div>🎯 {selected.focus}</div>
                <div>🧭 {selected.operator || 'Not publicly listed'}</div>
                <div>🌱 {selected.stage}</div>
                {selected.status_detail && <div>📋 {selected.status_detail}</div>}
              </div>
              {selected.highlight && <div className="orbit-highlight">{selected.highlight}</div>}
              <a
                href={selected.url}
                target="_blank"
                rel="noopener"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold text-[#0a0a0a] no-underline"
                style={{ background: 'var(--grad)' }}
              >
                Visit house →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* City minimap — a round, bottom-right "orbital" window. Cities are picked
          by clicking their markers on the globe; this shows the active one. */}
      {dockOpen && (
        <div className="minimap-orb absolute bottom-6 right-6 z-20">
          <div className="minimap-orb-map">
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
          <div className="minimap-orb-label">
            <span className="led" />
            {activeCluster.label} <b>{cityCounts[activeCity] ?? 0}</b>
          </div>
          <button onClick={() => setDockOpen(false)} aria-label="Close minimap" className="minimap-orb-close">
            <IconClose />
          </button>
        </div>
      )}

      {/* Programs panel — slides in over the globe from the left */}
      <aside
        aria-hidden={!panelOpen}
        className={`absolute left-0 top-0 z-30 flex h-full w-[360px] min-w-[360px] flex-col border-r border-line bg-panel backdrop-blur-[18px] transition-transform duration-300 max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:border-r-0 ${
          panelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-line px-5 pb-3 pt-3">
          <div className="mb-2 flex justify-end">
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close panel"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line2 text-muted transition hover:border-a1 hover:text-text"
            >
              <IconClose />
            </button>
          </div>
          <div className="mb-3">
            <SiteNav current="globe" />
          </div>
          <div className="relative mb-2">
            <span
              className="orbit-ring orbit-ring--node orbit-ring--spin pointer-events-none absolute -right-2 -top-3 h-12 w-12 opacity-60"
              aria-hidden="true"
            />
            <div className="mb-1 inline-flex items-center gap-1.5 font-display text-[9.5px] font-semibold uppercase tracking-[.22em] text-a2">
              <span className="orbit-node" aria-hidden="true" />
              live map
            </div>
            <h1 className="relative z-[1] m-0 font-display text-[19px] font-bold leading-[1.18]" style={{ color: 'var(--text)' }}>
              {title.t}
            </h1>
          </div>
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
          {shown.length} of {data.length} in orbit
        </div>
        <div className="flex-1 overflow-y-auto pb-3.5">
          {shown.map((p) => {
            const s = statusMeta(p.status);
            return (
              <button
                key={keyOf(p)}
                onClick={() => {
                  openDetail(p);
                  // On mobile the panel is full-screen, so close it to reveal the
                  // globe flight + the bottom-sheet detail card.
                  if (window.matchMedia('(max-width: 760px)').matches) setPanelOpen(false);
                }}
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
