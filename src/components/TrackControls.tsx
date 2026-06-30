import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $tracker, setStage, setNote, initTracker } from '../stores/tracker';
import { TRACK_STAGES, trackStageMeta, DEFAULT_STAGE } from '../lib/tracker';

/**
 * Per-program tracking control for the /saved shortlist: a stage segmented
 * control + an expandable private note. Writes straight to the tracker store
 * (localStorage); the note is debounced so we don't thrash storage on every key.
 */
export default function TrackControls({ slug }: { slug: string }) {
  const tracker = useStore($tracker);
  useEffect(() => {
    initTracker();
  }, []);

  const entry = tracker[slug];
  const stage = entry?.stage ?? DEFAULT_STAGE;

  const [noteOpen, setNoteOpen] = useState(Boolean(entry?.note));
  const [draft, setDraft] = useState(entry?.note ?? '');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the local draft in sync when the stored note changes elsewhere (e.g.
  // another tab) and we're not mid-edit.
  useEffect(() => {
    setDraft(entry?.note ?? '');
  }, [entry?.note]);

  function onNoteChange(v: string) {
    setDraft(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setNote(slug, v), 400);
  }

  return (
    <div className="mt-2 border-t border-line pt-2.5">
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Application stage">
        {TRACK_STAGES.map((s) => {
          const active = s === stage;
          const meta = trackStageMeta(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStage(slug, s)}
              aria-pressed={active}
              className={`rounded-full border px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide transition ${
                active ? 'border-transparent text-[#0a0a0a]' : 'border-line2 text-muted hover:text-text'
              }`}
              style={active ? { background: meta.color } : undefined}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setNoteOpen((v) => !v)}
        className="mt-2 text-[11px] font-semibold text-a2 hover:text-text"
        aria-expanded={noteOpen}
      >
        {draft ? '✎ Note' : '+ Add note'}
      </button>
      {noteOpen && (
        <textarea
          value={draft}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={2}
          placeholder="Private note — deadlines, contacts, why this one…"
          aria-label={`Private note`}
          className="mt-1.5 w-full rounded-md border border-line2 bg-[rgba(16,16,16,.6)] px-2.5 py-2 text-[12px] text-text outline-none transition focus:border-a1"
        />
      )}
    </div>
  );
}
