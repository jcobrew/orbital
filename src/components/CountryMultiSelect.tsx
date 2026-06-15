import { useEffect, useMemo, useRef, useState } from 'react';
import { countrySlug } from '../data/countries';
import { flagSrc } from '../lib/flag';

/** Round flag for a country name, falling back to the orbit-node marker. */
function Flag({ name, size = 18 }: { name: string; size?: number }) {
  const src = flagSrc(countrySlug(name));
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="flex-none rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return <span className="orbit-node flex-none" aria-hidden="true" />;
}

/**
 * Typeahead country picker: type to get name suggestions (each with a round
 * flag) drawn from the countries actually in the data, pick several, and they
 * show as removable chips. Replaces the old single-value country <select>.
 */
export default function CountryMultiSelect({
  countries,
  selected,
  onChange,
  fullWidth = false,
}: {
  countries: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  fullWidth?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries
      .filter((c) => !selected.includes(c) && (!q || c.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [countries, selected, query]);

  function add(name: string) {
    if (!name || selected.includes(name)) return;
    onChange([...selected, name]);
    setQuery('');
    setActive(0);
  }
  function remove(name: string) {
    onChange(selected.filter((c) => c !== name));
  }

  // Close the suggestion list on an outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (suggestions[active]) {
        e.preventDefault();
        add(suggestions[active]);
      }
    } else if (e.key === 'Backspace' && !query && selected.length) {
      remove(selected[selected.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={'relative ' + (fullWidth ? 'w-full' : 'min-w-[220px] flex-1')}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-line2 bg-[rgba(8,10,22,.6)] px-2 py-1.5 transition focus-within:border-a1">
        {selected.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-[rgba(255,255,255,.06)] py-0.5 pl-1.5 pr-1 text-[12px] font-semibold text-text"
          >
            <Flag name={c} size={15} />
            {c}
            <button
              type="button"
              aria-label={`Remove ${c}`}
              onClick={() => remove(c)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-[11px] leading-none text-muted transition hover:bg-[rgba(255,255,255,.12)] hover:text-text"
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected.length ? 'Add country…' : 'Enter country…'}
          aria-label="Filter by country"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="min-w-[110px] flex-1 bg-transparent px-1.5 py-1 text-[12.5px] text-text outline-none placeholder:text-muted"
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-[244px] overflow-y-auto rounded-[3px] border border-line2 bg-[#0b0e1c] py-1 shadow-[0_18px_50px_rgba(0,0,0,.6)]"
        >
          {suggestions.map((c, i) => (
            <li key={c} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => add(c)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] transition ${
                  i === active ? 'bg-[rgba(255,255,255,.08)] text-text' : 'text-muted'
                }`}
              >
                <Flag name={c} size={18} />
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
