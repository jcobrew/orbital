import { noteApplyIntent } from '../stores/applyIntent';
import { applyUrgency, type UrgencyTone } from '../lib/applyUrgency';

const TONE: Record<UrgencyTone, string> = {
  urgent: 'border-[#ffc24b] text-[#ffc24b]',
  open: 'border-[#25e0a4] text-[#25e0a4]',
  upcoming: 'border-[#b388ff] text-[#b388ff]',
};

/**
 * Apply/Visit CTA with an inline deadline-urgency cue and apply-intent tracking.
 * Used on the program page (an Astro island); the React card/drawer surfaces wire
 * the same `noteApplyIntent` + `applyUrgency` helpers inline.
 */
export default function ApplyButton({
  slug,
  name,
  url,
  applyUrl,
  status,
  variant = 'page',
}: {
  slug: string;
  name: string;
  url: string;
  applyUrl?: string;
  status?: string;
  variant?: 'page' | 'pill';
}) {
  const href = applyUrl || url;
  const urgency = applyUrgency(slug, status);
  const radius = variant === 'pill' ? 'rounded-full' : 'rounded-[3px]';

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <a
        href={href}
        target="_blank"
        rel="noopener"
        onClick={() => noteApplyIntent({ slug, name })}
        className={`${radius} border border-transparent px-5 py-2.5 font-display text-[13px] font-bold text-[#0a0a0a] no-underline`}
        style={{ background: 'var(--grad)' }}
      >
        {applyUrl ? 'Apply' : 'Visit site'} →
      </a>
      {urgency && (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${TONE[urgency.tone]}`}
        >
          {urgency.label}
        </span>
      )}
    </span>
  );
}
