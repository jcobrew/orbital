import { useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Types `text` out one character at a time. When `loop` is set, it pauses at
 * the end then erases and retypes. Honors prefers-reduced-motion by rendering
 * the full string immediately (no animation).
 */
export function useTypewriter(
  text: string,
  { speed = 42, startDelay = 0, loop = false, holdMs = 2600 }: { speed?: number; startDelay?: number; loop?: boolean; holdMs?: number } = {},
): string {
  const reduce = prefersReducedMotion();
  const [out, setOut] = useState(reduce ? text : '');

  useEffect(() => {
    if (reduce) {
      setOut(text);
      return;
    }
    setOut('');
    let i = 0;
    let erasing = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!erasing) {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          if (!loop) return;
          timer = setTimeout(() => {
            erasing = true;
            tick();
          }, holdMs);
          return;
        }
        timer = setTimeout(tick, speed);
      } else {
        i -= 1;
        setOut(text.slice(0, i));
        if (i <= 0) {
          erasing = false;
          timer = setTimeout(tick, speed * 6);
          return;
        }
        timer = setTimeout(tick, speed / 1.8);
      }
    };

    timer = setTimeout(tick, startDelay);
    return () => clearTimeout(timer);
  }, [text, speed, startDelay, loop, holdMs, reduce]);

  return out;
}
