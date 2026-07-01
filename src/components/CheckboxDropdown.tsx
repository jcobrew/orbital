import { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
}

/**
 * A compact multi-select shown as a pill button that opens a checkbox list.
 * Options come from the data (the caller passes only values actually present),
 * so the filter always yields results. Used for both the Sector and Country
 * filters. `renderIcon` lets the country variant show a round flag per row.
 */
export default function CheckboxDropdown({
  label,
  options,
  selected,
  onChange,
  renderIcon,
  fullWidth = false,
}: {
  label: string;
  options: DropdownOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  renderIcon?: (value: string) => React.ReactNode;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }

  const count = selected.length;
  const byValue = new Map(options.map((o) => [o.value, o.label]));

  return (
    <div ref={rootRef} className={'relative ' + (fullWidth ? 'w-full' : 'min-w-[180px]')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center gap-2 rounded-full border bg-[rgba(16,16,16,.6)] px-3.5 py-2.5 text-[12.5px] font-semibold transition hover:border-a1 ${
          count ? 'border-a1 text-text' : 'border-line2 text-muted'
        }`}
      >
        <span className="truncate">
          {label}
          {count > 0 && count <= 2 && (
            <span className="text-muted"> · {selected.map((v) => byValue.get(v) ?? v).join(', ')}</span>
          )}
        </span>
        {count > 2 && (
          <span className="rounded-full bg-[rgba(255,255,255,.12)] px-1.5 text-[11px] leading-[1.5] text-text">{count}</span>
        )}
        <svg className="ml-auto flex-none opacity-60" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={open ? 'M3.5 9.5l4.5-4 4.5 4' : 'M3.5 6.5l4.5 4 4.5-4'} />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute left-0 z-50 mt-1 max-h-[300px] min-w-[220px] overflow-y-auto rounded-[6px] border border-line2 bg-[#0c0c0c] p-1 shadow-[0_18px_50px_rgba(0,0,0,.6)]"
        >
          {count > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mb-1 w-full rounded-[4px] px-2.5 py-1.5 text-left text-[11.5px] font-semibold text-muted transition hover:bg-[rgba(255,255,255,.06)] hover:text-text"
            >
              Clear selection
            </button>
          )}
          {options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => toggle(o.value)}
                className={`flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-left text-[12.5px] transition ${
                  on ? 'text-text' : 'text-muted hover:text-text'
                } hover:bg-[rgba(255,255,255,.06)]`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 flex-none items-center justify-center rounded-[3px] border text-[10px] leading-none ${
                    on ? 'border-a1 bg-[rgba(255,255,255,.14)] text-text' : 'border-line2'
                  }`}
                >
                  {on ? '✓' : ''}
                </span>
                {renderIcon?.(o.value)}
                <span className="flex-1 truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
