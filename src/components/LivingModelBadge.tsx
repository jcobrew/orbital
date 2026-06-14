import type { ProgramFormat } from '../data/programs';
import { livingModelLabel } from '../lib/living';

// Live-in / Relocation get a brighter outline (they're the location-committing
// ones a relocating founder filters for); the rest are quieter.
const STRONG: Partial<Record<ProgramFormat, boolean>> = { 'live-in': true, relocation: true, hybrid: true };

export default function LivingModelBadge({ format }: { format?: ProgramFormat | null }) {
  const label = livingModelLabel(format ?? undefined);
  if (!label) return null;
  const strong = !!(format && STRONG[format]);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${
        strong ? 'border-a2 text-a2' : 'border-line2 text-muted'
      }`}
      title="Living model"
    >
      {label}
    </span>
  );
}
