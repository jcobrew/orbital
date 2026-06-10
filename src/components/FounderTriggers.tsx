import { useStore } from '@nanostores/react';
import { TRIGGERS, type Trigger } from '../data/triggers';
import { EMPTY_FILTERS } from '../lib/filter';
import { $filters, applyPreset, filtersToQuery } from '../stores/filters';

function presetQuery(t: Trigger): string {
  const qs = filtersToQuery({ ...EMPTY_FILTERS, ...t.preset });
  return qs ? '/explore?' + qs : '/explore';
}

/**
 * "Why are you looking?" chips (handoff §8.2). On /explore (mode="apply") a chip
 * applies its filter preset in place; elsewhere (mode="link") it links to
 * /explore pre-filtered. Active chip is highlighted when its preset matches.
 */
export default function FounderTriggers({ mode = 'apply' }: { mode?: 'apply' | 'link' }) {
  const filters = useStore($filters);

  function isActive(t: Trigger): boolean {
    const f = filters as unknown as Record<string, string>;
    return Object.entries(t.preset).every(([k, v]) => f[k] === v);
  }

  return (
    <div>
      <div className="mb-2 font-display text-[12px] font-semibold uppercase tracking-wide text-muted">
        Why are you looking?
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TRIGGERS.map((t) => {
          const active = mode === 'apply' && isActive(t);
          const cls = `select-none rounded-full border px-3 py-[5px] text-[12px] font-semibold transition ${
            active ? 'border-transparent text-[#08101f]' : 'border-line2 text-muted hover:text-text hover:border-a1'
          }`;
          const style = active ? { background: 'var(--grad)' } : undefined;
          return mode === 'apply' ? (
            <button key={t.label} onClick={() => applyPreset(t.preset)} className={cls} style={style}>
              {t.label}
            </button>
          ) : (
            <a key={t.label} href={presetQuery(t)} className={cls + ' no-underline'} style={style}>
              {t.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
