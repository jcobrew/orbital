// Whole-sphere dot mesh for the ASCII/dot-matrix globe. Generates an evenly
// spaced lat/lng grid of points and flags each as land or ocean by testing it
// against the bundled Natural Earth country polygons. Land dots render bright,
// ocean dots dim, so the entire globe reads as one fine generated grid.
import worldGeo from '../data/world-110m.geo.json';

export interface Dot {
  lat: number;
  lng: number;
  land: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ring = number[][];
interface Feat {
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
  polys: Ring[][]; // list of polygons, each = [outerRing, ...holes]
}

function ringContains(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];
    const hit = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

// A point is in a polygon if it's inside the outer ring and not in any hole.
function polyContains(lng: number, lat: number, poly: Ring[]): boolean {
  if (!ringContains(lng, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) if (ringContains(lng, lat, poly[h])) return false;
  return true;
}

let FEATS: Feat[] | null = null;
function features(): Feat[] {
  if (FEATS) return FEATS;
  FEATS = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const f of (worldGeo as any).features as any[]) {
    const g = f.geometry;
    if (!g) continue;
    const polys: Ring[][] = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    if (!polys.length) continue;
    let minLng = 180,
      minLat = 90,
      maxLng = -180,
      maxLat = -90;
    for (const poly of polys)
      for (const pt of poly[0]) {
        if (pt[0] < minLng) minLng = pt[0];
        if (pt[0] > maxLng) maxLng = pt[0];
        if (pt[1] < minLat) minLat = pt[1];
        if (pt[1] > maxLat) maxLat = pt[1];
      }
    FEATS.push({ bbox: [minLng, minLat, maxLng, maxLat], polys });
  }
  return FEATS;
}

function isLand(lng: number, lat: number): boolean {
  for (const f of features()) {
    const b = f.bbox;
    if (lng < b[0] || lng > b[2] || lat < b[1] || lat > b[3]) continue;
    for (const poly of f.polys) if (polyContains(lng, lat, poly)) return true;
  }
  return false;
}

let DOTS: Dot[] | null = null;
/**
 * Build the dot grid once and cache it. `stepDeg` controls density (smaller =
 * finer/denser). Longitude samples scale with latitude so spacing stays roughly
 * even instead of bunching at the poles.
 */
export function sphereDots(stepDeg = 2): Dot[] {
  if (DOTS) return DOTS;
  const dots: Dot[] = [];
  for (let lat = -80; lat <= 80; lat += stepDeg) {
    const c = Math.cos((lat * Math.PI) / 180);
    const n = Math.max(1, Math.round((360 * c) / stepDeg));
    for (let i = 0; i < n; i++) {
      const lng = -180 + (360 * i) / n;
      dots.push({ lat, lng, land: isLand(lng, lat) });
    }
  }
  DOTS = dots;
  return dots;
}
