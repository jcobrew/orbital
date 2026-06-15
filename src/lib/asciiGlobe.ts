// The globe's surface rendered as ASCII. We build a single THREE.Points whose
// fragment shader stamps one character per point, picked from a density ramp by
// the point's sampled-imagery brightness (land = dense glyphs, ocean = sparse).
// The points sit just above globe.gl's near-black sphere so the back hemisphere
// is depth-occluded — it reads as a real globe made of characters that rotates
// with everything else. Added to the globe scene; all globe.gl layers
// (polygons, pins, rings, controls) are untouched.
import * as THREE from 'three';
import type { Dot } from './globeDots';

// Matches three-globe's GLOBE_RADIUS + polar→cartesian convention so our glyphs
// line up exactly with globe.gl's country polygons and pins.
const GLOBE_RADIUS = 100;
function polar2Cartesian(lat: number, lng: number, relAlt: number): [number, number, number] {
  const r = GLOBE_RADIUS * (1 + relAlt);
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

// Density ramp: blank → dense. Leading space means dark ocean dots draw nothing.
const RAMP = ' .:-=+*#%@';

/** Build a horizontal glyph atlas (one square cell per ramp char), white on transparent. */
function buildAtlas(ramp: string, cell = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = cell * ramp.length;
  canvas.height = cell;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(cell * 0.82)}px 'JetBrains Mono', ui-monospace, monospace`;
  for (let i = 0; i < ramp.length; i++) {
    ctx.fillText(ramp[i], i * cell + cell / 2, cell / 2 + 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false; // keep canvas (top-left origin) aligned with gl_PointCoord
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

const VERT = /* glsl */ `
  attribute float aBright;
  varying float vBright;
  uniform float uPointScale;
  uniform float uMinPx;
  uniform float uMaxPx;
  void main() {
    vBright = aBright;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uPointScale / -mv.z, uMinPx, uMaxPx);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform sampler2D uAtlas;
  uniform float uGlyphCount;
  uniform vec3 uColor;
  varying float vBright;
  void main() {
    // Map brightness → ramp cell (slight gamma spreads the mid-tones).
    float b = pow(clamp(vBright, 0.0, 1.0), 0.85);
    float i = floor(b * (uGlyphCount - 1.0) + 0.5);
    vec2 uv = vec2((i + gl_PointCoord.x) / uGlyphCount, gl_PointCoord.y);
    float a = texture2D(uAtlas, uv).a;
    if (a < 0.12) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

export interface AsciiGlobe {
  object: THREE.Points;
  /** Re-read dots[*].bright into the geometry after imagery loads. */
  refreshBrightness(): void;
  dispose(): void;
}

/**
 * Build the ASCII glyph point-cloud for the given dot grid. Positions are fixed;
 * brightness is read from each dot now and can be refreshed once imagery loads.
 */
export function createAsciiGlobe(dots: Dot[], opts: { altitude?: number } = {}): AsciiGlobe {
  const alt = opts.altitude ?? 0.01;
  const n = dots.length;
  const positions = new Float32Array(n * 3);
  const bright = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const d = dots[k];
    const [x, y, z] = polar2Cartesian(d.lat, d.lng, alt);
    positions[k * 3] = x;
    positions[k * 3 + 1] = y;
    positions[k * 3 + 2] = z;
    bright[k] = d.bright;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const brightAttr = new THREE.BufferAttribute(bright, 1);
  geometry.setAttribute('aBright', brightAttr);

  const atlas = buildAtlas(RAMP);
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: atlas },
      uGlyphCount: { value: RAMP.length },
      uColor: { value: new THREE.Color('#f4f4f4') },
      // Distance-attenuated glyph size, scaled by DPR so HiDPI stays crisp.
      uPointScale: { value: 2600 * dpr },
      uMinPx: { value: 2 * dpr },
      uMaxPx: { value: 24 * dpr },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });

  const object = new THREE.Points(geometry, material);
  object.frustumCulled = false; // it's the whole globe; never cull it out

  return {
    object,
    refreshBrightness() {
      for (let k = 0; k < n; k++) bright[k] = dots[k].bright;
      brightAttr.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      atlas.dispose();
    },
  };
}
