import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import Globe from 'globe.gl';
import type { Program } from '../data/programs';
import { passes, defaultSort } from '../lib/filter';
import { statusMeta } from '../lib/status';
import { logoMarkupHTML, installLogoFallback } from '../lib/logo';
import { $filters, initFiltersFromURL } from '../stores/filters';
import FilterSidebar from '../components/FilterSidebar';
import Logo from '../components/Logo';
import StatusBadge from '../components/StatusBadge';

const TITLES: Record<string, { t: string; s: string }> = {
  all: { t: 'Founder programs worldwide', s: 'Spin the globe or pick a program to fly there. Status as of June 2026 — verify on each site.' },
  residential: { t: 'Residencies, Hacker Houses & Startup Campuses', s: 'Programs that house or relocate founders. Spin or pick a program to fly there.' },
  traditional: { t: 'Traditional Accelerators & Incubators', s: 'Accelerators, incubators & talent investors — no live-in component.' },
};

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeInstance = any;

export default function GlobeView({ programs }: { programs: Program[] }) {
  const filters = useStore($filters);
  const stageEl = useRef<HTMLDivElement>(null);
  const globeEl = useRef<HTMLDivElement>(null);
  const worldRef = useRef<GlobeInstance>(null);
  const [selected, setSelected] = useState<Program | null>(null);
  const [spinning, setSpinning] = useState(true);
  const [loading, setLoading] = useState(true);

  const data = useMemo(() => {
    const copy = programs.map((p) => ({ ...p }));
    jitter(copy);
    return copy;
  }, [programs]);

  const shown = useMemo(() => defaultSort(data.filter((p) => passes(p, filters))), [data, filters]);

  function openDetail(p: Program) {
    setSelected(p);
    const world = worldRef.current;
    if (world) {
      world.controls().autoRotate = false;
      setSpinning(false);
      world.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.7 }, 900);
    }
  }

  useEffect(() => {
    initFiltersFromURL();
    installLogoFallback();
    if (!globeEl.current || !stageEl.current || worldRef.current) return;

    // globe.gl's factory call signature isn't well typed; cast to call it.
    const world: GlobeInstance = (Globe as unknown as () => (el: HTMLElement) => GlobeInstance)()(globeEl.current)
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#7c5cff')
      .atmosphereAltitude(0.2)
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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    worldRef.current = world;

    const fit = () => world.width(stageEl.current!.clientWidth).height(stageEl.current!.clientHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stageEl.current);
    const t = setTimeout(() => setLoading(false), 1400);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // react to filter changes
  useEffect(() => {
    if (worldRef.current) worldRef.current.htmlElementsData(shown);
  }, [shown]);

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
  }

  const title = TITLES[filters.dataset] ?? TITLES.all;
  const btn =
    'inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-[rgba(14,18,40,.78)] px-3 py-2 text-[12px] font-semibold text-text backdrop-blur transition hover:border-a1';

  return (
    <div className="flex h-screen">
      <aside className="relative z-[5] flex w-[360px] min-w-[360px] flex-col border-r border-line bg-panel backdrop-blur-[18px] max-[760px]:hidden">
        <div className="border-b border-line px-5 pb-3 pt-[18px]">
          <div className="mb-2 font-display text-[10.5px] font-semibold uppercase tracking-[.22em] text-a2">
            Founder LAB MAP · 3D · 2026
          </div>
          <div className="mb-2.5">
            <nav className="viewnav" aria-label="Views">
              <a href="/dashboard">Dashboard</a>
              <a href="/">Map</a>
              <a href="/startup-programs-globe" className="active" aria-current="page">Globe</a>
            </nav>
          </div>
          <h1
            className="m-0 mb-2 font-display text-[19px] font-bold leading-[1.18]"
            style={{ background: 'linear-gradient(100deg,#fff 10%,#c9c2ff 55%,#9be9ff 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
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
                onClick={() => openDetail(p)}
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

      <div ref={stageEl} className="relative flex-1 overflow-hidden">
        <div ref={globeEl} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center text-[13px] text-muted">Loading globe…</div>
        )}
        <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
          <button className={`${btn} ${spinning ? '' : 'opacity-70'}`} onClick={toggleSpin}>
            <span className="h-2 w-2 rounded-full" style={{ background: spinning ? 'var(--a2)' : '#555', boxShadow: spinning ? '0 0 8px var(--a2)' : 'none' }} />
            Auto-rotate
          </button>
          <button className={btn} onClick={reset}>↺ Reset view</button>
        </div>
        <div className="absolute bottom-4 left-4 z-20 rounded-[10px] border border-line bg-[rgba(14,18,40,.6)] px-2.5 py-1.5 text-[11px] text-muted backdrop-blur">
          Drag to rotate · scroll to zoom · toggle datasets in the sidebar
        </div>

        {selected && (
          <div className="absolute right-[18px] top-1/2 z-[25] w-[330px] -translate-y-1/2 rounded-[18px] border border-line2 bg-[rgba(12,16,36,.94)] p-[18px] shadow-[0_24px_70px_rgba(0,0,0,.65)] backdrop-blur-[18px]">
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
              <div>📨 <b className="text-muted">Recruiting: </b>{selected.status_detail}</div>
            </div>
            {selected.highlight && (
              <div className="mt-3 border-t border-line pt-3 text-[11.5px] italic leading-normal text-muted">{selected.highlight}</div>
            )}
            <a
              href={selected.url}
              target="_blank"
              rel="noopener"
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-[#08101f] no-underline"
              style={{ background: 'var(--grad)' }}
            >
              Visit program →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
