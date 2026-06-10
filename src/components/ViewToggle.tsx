import { useStore } from '@nanostores/react';
import { $filters } from '../stores/filters';
import { filtersToQuery } from '../stores/filters';

type View = 'list' | 'map' | 'globe';

const VIEWS: { key: View; href: string; label: string }[] = [
  { key: 'list', href: '/explore', label: 'List' },
  { key: 'map', href: '/map', label: 'Map' },
  { key: 'globe', href: '/globe', label: 'Globe' },
];

/**
 * List / Map / Globe switch. Links carry the current filter state as a query
 * string so filters persist when a founder moves between views.
 */
export default function ViewToggle({ current }: { current: View }) {
  const filters = useStore($filters);
  const qs = filtersToQuery(filters);
  const suffix = qs ? '?' + qs : '';
  return (
    <div className="inline-flex gap-1 rounded-md border border-line2 bg-[rgba(8,10,22,.5)] p-1" role="tablist" aria-label="View">
      {VIEWS.map((v) => {
        const active = v.key === current;
        return (
          <a
            key={v.key}
            href={v.href + suffix}
            role="tab"
            aria-selected={active}
            aria-current={active ? 'page' : undefined}
            className={`rounded-sm px-3.5 py-1.5 font-display text-[12.5px] font-semibold no-underline transition ${
              active ? 'text-[#08101f]' : 'text-muted hover:text-text'
            }`}
            style={active ? { background: 'var(--grad)' } : undefined}
          >
            {v.label}
          </a>
        );
      })}
    </div>
  );
}
