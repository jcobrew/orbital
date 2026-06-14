import { useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Terminal-style boot loader shown over the globe while it initializes. Types
 * out log lines, then the parent fades it away once the globe is ready. The
 * program count is woven in so the splash reflects the live dataset.
 */
export default function BootSequence({ count }: { count: number }) {
  const lines = [
    '> orbital v1.0 :: init',
    '> mapping gravity wells ..... ok',
    `> locating ${count} houses / residencies · 6 continents ... ok`,
    '> some places pull founders into orbit.',
    '> spinning up globe',
  ];

  const reduce = prefersReducedMotion();
  // How many lines are fully revealed; the last visible one carries the cursor.
  const [shown, setShown] = useState(reduce ? lines.length : 0);

  useEffect(() => {
    if (reduce) return;
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= lines.length) clearInterval(id);
    }, 360);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = lines.slice(0, Math.max(shown, 1));

  return (
    <div className="term pointer-events-none flex select-none items-start gap-4 text-[12.5px] leading-[1.7] text-text">
      {!reduce && <span className="orbit-loader mt-0.5 flex-none" aria-hidden="true" />}
      <div className="w-[min(440px,82vw)]">
        {visible.map((ln, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {ln}
            {i === visible.length - 1 && <span className="term-cursor" />}
          </div>
        ))}
      </div>
    </div>
  );
}
