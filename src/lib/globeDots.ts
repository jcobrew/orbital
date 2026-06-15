// Dot mesh for the globe. We generate an evenly spaced lat/lng grid, then color
// each dot by sampling real NASA earth imagery (blue-marble for landscape/ocean
// color) and lift it slightly by the topology relief map — so the globe reads as
// a detailed dotted earth with depth and roughness rather than a flat field.

export interface Dot {
  lat: number;
  lng: number;
  color: string; // sampled rgb, filled in once imagery loads
  alt: number; // small relief altitude from the topology map
  bright: number; // 0..1 luminance of the sampled imagery (drives the ASCII glyph ramp)
}

let GRID: Dot[] | null = null;
let GRID_STEP = 0;
/**
 * Build the dot grid once and cache it. `stepDeg` controls density (smaller =
 * finer/denser). Longitude samples scale with latitude so spacing stays roughly
 * even instead of bunching at the poles. Colors start dim and are replaced when
 * {@link sampleEarth} resolves.
 */
export function sphereGrid(stepDeg = 1.4): Dot[] {
  if (GRID && GRID_STEP === stepDeg) return GRID;
  const dots: Dot[] = [];
  for (let lat = -82; lat <= 82; lat += stepDeg) {
    const c = Math.cos((lat * Math.PI) / 180);
    const n = Math.max(1, Math.round((360 * c) / stepDeg));
    for (let i = 0; i < n; i++) {
      const lng = -180 + (360 * i) / n;
      dots.push({ lat, lng, color: '#1a1a1a', alt: 0.002, bright: 0 });
    }
  }
  GRID = dots;
  GRID_STEP = stepDeg;
  return dots;
}

function loadImageData(src: string, w: number, h: number): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(ctx.getImageData(0, 0, w, h));
      } catch {
        resolve(null); // tainted canvas / decode failure — fall back to flat dots
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const SAMPLE_W = 1024;
const SAMPLE_H = 512;

// Equirectangular lat/lng -> pixel index in a SAMPLE_W x SAMPLE_H buffer.
function idx(lat: number, lng: number): number {
  let x = Math.floor(((lng + 180) / 360) * SAMPLE_W);
  let y = Math.floor(((90 - lat) / 180) * SAMPLE_H);
  if (x < 0) x = 0;
  else if (x >= SAMPLE_W) x = SAMPLE_W - 1;
  if (y < 0) y = 0;
  else if (y >= SAMPLE_H) y = SAMPLE_H - 1;
  return (y * SAMPLE_W + x) * 4;
}

/**
 * Sample earth imagery and mutate each dot's `color`/`alt` in place. Returns true
 * if the color map loaded (caller should refresh the layer). Safe to fail: on any
 * error the dots keep their dim fallback color.
 */
export async function sampleEarth(dots: Dot[], reliefAmount = 0.05): Promise<boolean> {
  const [color, relief] = await Promise.all([
    loadImageData('/textures/earth-blue-marble.jpg', SAMPLE_W, SAMPLE_H),
    loadImageData('/textures/earth-topology.png', SAMPLE_W, SAMPLE_H),
  ]);
  if (!color) return false;
  const cd = color.data;
  const rd = relief?.data;
  for (const d of dots) {
    const i = idx(d.lat, d.lng);
    // Gentle contrast so land/coast detail pops against the black backdrop.
    const r = Math.min(255, Math.round(cd[i] * 1.12));
    const g = Math.min(255, Math.round(cd[i + 1] * 1.12));
    const b = Math.min(255, Math.round(cd[i + 2] * 1.12));
    d.color = `rgb(${r},${g},${b})`;
    // Luminance of the sampled imagery → ASCII density (land brighter than ocean).
    d.bright = (r + g + b) / 3 / 255;
    if (rd) {
      // Topology luminance (land elevation) -> a little altitude for relief.
      const lum = (rd[i] + rd[i + 1] + rd[i + 2]) / 3 / 255;
      d.alt = 0.002 + lum * reliefAmount;
    }
  }
  return true;
}
