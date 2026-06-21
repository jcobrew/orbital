// Turns a live WebGL <canvas> (the globe.gl globe) into an animated ASCII-art
// overlay, ascii-magic style: each frame is downsampled to a character grid and
// each cell's brightness picks a glyph from a dark→light ramp. Framework-agnostic
// so the React island just owns its lifecycle (start/stop/resize/destroy).

export interface AsciiRendererOptions {
  /** The source canvas to sample (globe.gl's WebGL canvas). */
  source: HTMLCanvasElement;
  /** The overlay canvas we paint the characters onto. */
  target: HTMLCanvasElement;
  /** Dark→light glyph ramp; first char ≈ darkest, last ≈ brightest. */
  ramp?: string;
  /** Approximate character cell height in CSS px (also the font size). */
  cell?: number;
  /** Frame cap. The globe auto-rotates slowly, so 30fps is plenty. */
  fps?: number;
  /** Tint each glyph by the sampled pixel colour. Off by default → grayscale. */
  colored?: boolean;
}

export interface AsciiRenderer {
  start(): void;
  stop(): void;
  /** Re-read the source size and rebuild the grid (call on resize). */
  resize(): void;
  destroy(): void;
}

// Dark→light glyph ramp, roughly ordered by ink coverage. The wider, more
// varied character set gives the globe surface texture instead of reading as a
// flat field of one or two symbols.
const DEFAULT_RAMP = ' .,:;~-+=<>i!lrcvznutfjoeswmICUXZ0Q*#%8B&WM@';
// Monospace advance width is ~0.6× the font size; keeps the globe un-squished.
const CHAR_ASPECT = 0.6;
// Gamma < 1 lifts the midtones so the mostly-grey land spreads across the ramp
// (more grey gradient + glyph variety) rather than clamping to the bright end.
const GAMMA = 0.72;

export function createAsciiRenderer(opts: AsciiRendererOptions): AsciiRenderer {
  const { source, target } = opts;
  const ramp = opts.ramp ?? DEFAULT_RAMP;
  const fontPx = Math.max(6, opts.cell ?? 11);
  const colWidth = Math.max(3, Math.round(fontPx * CHAR_ASPECT));
  const colored = opts.colored ?? false;
  const minFrameMs = 1000 / (opts.fps ?? 30);

  const tctx = target.getContext('2d')!;
  // Tiny offscreen buffer the browser downsamples the globe into — one texel per
  // character cell, so reading it back is cheap.
  const sample = document.createElement('canvas');
  const sctx = sample.getContext('2d', { willReadFrequently: true })!;

  let cols = 0;
  let rows = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;
  let running = false;

  function measure() {
    const w = source.clientWidth || source.width;
    const h = source.clientHeight || source.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cols = Math.max(1, Math.floor(w / colWidth));
    rows = Math.max(1, Math.floor(h / fontPx));
    sample.width = cols;
    sample.height = rows;
    target.width = Math.floor(w * dpr);
    target.height = Math.floor(h * dpr);
    target.style.width = `${w}px`;
    target.style.height = `${h}px`;
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.textBaseline = 'top';
    tctx.font = `${fontPx}px ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, monospace`;
  }

  function frame(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (now - last < minFrameMs) return;
    last = now;
    if (!source.width || !source.height) return;

    // Downsample the globe into the cell grid (browser averages the pixels).
    sctx.clearRect(0, 0, cols, rows);
    try {
      sctx.drawImage(source, 0, 0, cols, rows);
    } catch {
      return; // source not readable this frame — skip it
    }
    const px = sctx.getImageData(0, 0, cols, rows).data;

    tctx.clearRect(0, 0, target.width, target.height);
    const lastIdx = ramp.length - 1;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const a = px[i + 3];
        if (a < 24) continue; // transparent background → leave it black/empty
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum < 0.03) continue; // deep-shadow ocean → empty for contrast
        // Gamma-spread brightness drives both the glyph and its grey level, so
        // texture and shade move together as a coherent grayscale gradient.
        const shade = Math.pow(lum, GAMMA);
        const ch = ramp[Math.min(lastIdx, Math.round(shade * lastIdx))];
        if (ch === ' ') continue;
        if (colored) {
          // Lift very dark tints so coloured glyphs stay visible on black.
          tctx.fillStyle = `rgb(${Math.max(r, 60)},${Math.max(g, 60)},${Math.max(b, 60)})`;
        } else {
          // Grayscale: map shade to a grey floored at ~36 so dim cells still read.
          const v = 36 + Math.round(shade * 219);
          tctx.fillStyle = `rgb(${v},${v},${v})`;
        }
        tctx.fillText(ch, x * colWidth, y * fontPx);
      }
    }
  }

  return {
    start() {
      if (running) return;
      measure();
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      tctx.clearRect(0, 0, target.width, target.height);
    },
    resize() {
      if (running) measure();
    },
    destroy() {
      this.stop();
    },
  };
}
