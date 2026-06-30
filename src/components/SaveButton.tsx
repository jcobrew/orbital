import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $saved, toggleSaved, initSaved } from '../stores/saved';

/** Bookmark glyph — filled when saved, outline when not. */
function BookmarkIcon({ filled, px }: { filled: boolean; px: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 16 16"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.5L8 11l-4.5 2.5V3a.5.5 0 0 1 .5-.5Z" />
    </svg>
  );
}

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
      className={`flex flex-none items-center justify-center rounded-full border leading-none transition ${
        size === 'md' ? 'h-9 w-9' : 'h-7 w-7'
      } ${on ? 'border-a2 text-a2' : 'border-line2 text-muted hover:border-a1 hover:text-text'}`}
    >
      <BookmarkIcon filled={on} px={size === 'md' ? 16 : 13} />
    </button>
  );
}
