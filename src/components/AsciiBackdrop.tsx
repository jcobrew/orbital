import { useEffect, useRef } from 'react';

const GLYPHS = ['·', '.', ':', '*', '+', '×', '°', '˙', '`', '"'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface Star {
  x: number;
  y: number;
  ch: string;
  size: number;
  base: number; // base opacity
  tw: number; // twinkle phase
  tws: number; // twinkle speed
  vx: number; // drift
  vy: number;
}

/**
 * Animated ASCII "starfield" rendered behind the globe — scattered mono glyphs
 * that slowly drift and twinkle for a generated/hacker backdrop. Honors
 * prefers-reduced-motion by drawing a single static field.
 */
export default function AsciiBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = prefersReducedMotion();
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // ~1 star per 4500 px², capped so big screens stay light.
      const count = Math.min(420, Math.floor((w * h) / 4500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
        size: 8 + Math.random() * 7,
        base: 0.06 + Math.random() * 0.22,
        tw: Math.random() * Math.PI * 2,
        tws: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
      }));
    };

    const draw = (dt: number, t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      for (const s of stars) {
        if (!reduce) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.x < -10) s.x = w + 10;
          else if (s.x > w + 10) s.x = -10;
          if (s.y < -10) s.y = h + 10;
          else if (s.y > h + 10) s.y = -10;
        }
        const flick = reduce ? 1 : 0.55 + 0.45 * Math.sin(s.tw + t * 0.001 * s.tws);
        ctx.font = `${s.size}px 'JetBrains Mono', ui-monospace, monospace`;
        ctx.fillStyle = `rgba(255,255,255,${(s.base * flick).toFixed(3)})`;
        ctx.fillText(s.ch, s.x, s.y);
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(dt, now);
      if (!reduce) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(() => {
      build();
      if (reduce) draw(0, 0); // redraw static field on resize
    });
    ro.observe(canvas);
    build();
    if (reduce) draw(0, 0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
