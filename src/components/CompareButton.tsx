import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $compare, toggleCompare, initCompare, canAddCompare, COMPARE_MAX } from '../stores/compare';

/**
 * Add/remove a program from the side-by-side compare set. Mirrors SaveButton's
 * shape (over a link → stops propagation). Disabled once the compare cap is hit
 * and this program isn't already in the set.
 */
export default function CompareButton({
  slug,
  name,
  size = 'sm',
}: {
  slug: string;
  name: string;
  size?: 'sm' | 'md';
}) {
  const compare = useStore($compare);
  useEffect(() => {
    initCompare();
  }, []);

  const on = compare.includes(slug);
  const disabled = !on && !canAddCompare(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) toggleCompare(slug);
      }}
      aria-pressed={on}
      disabled={disabled}
      aria-label={on ? `Remove ${name} from compare` : `Add ${name} to compare`}
      title={
        on
          ? 'In compare — click to remove'
          : disabled
            ? `Compare is full (max ${COMPARE_MAX})`
            : 'Add to compare'
      }
      className={`flex-none rounded-full border leading-none transition ${
        size === 'md' ? 'px-2.5 py-1.5 text-[13px]' : 'px-1.5 py-1 text-[12px]'
      } ${
        on
          ? 'border-a2 text-a2'
          : disabled
            ? 'cursor-not-allowed border-line2 text-muted/40'
            : 'border-line2 text-muted hover:border-a1 hover:text-text'
      }`}
    >
      ⚖
    </button>
  );
}
