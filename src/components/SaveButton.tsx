import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $saved, toggleSaved, initSaved } from '../stores/saved';

/** Bookmark toggle. Used on cards (over a link, so it stops propagation). */
export default function SaveButton({ slug, name, size = 'sm' }: { slug: string; name: string; size?: 'sm' | 'md' }) {
  const saved = useStore($saved);
  useEffect(() => {
    initSaved();
  }, []);
  const on = saved.includes(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(slug);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from saved` : `Save ${name}`}
      title={on ? 'Saved — click to remove' : 'Save'}
      className={`flex-none rounded-full border leading-none transition ${
        size === 'md' ? 'px-2.5 py-1.5 text-[15px]' : 'px-1.5 py-1 text-[13px]'
      } ${on ? 'border-a2 text-a2' : 'border-line2 text-muted hover:border-a1 hover:text-text'}`}
    >
      {on ? '★' : '☆'}
    </button>
  );
}
