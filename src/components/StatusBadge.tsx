import { statusMeta, shortStatusLabel } from '../lib/status';

interface Props {
  status: string;
  /** Use the full label (with "— check next cycle") instead of the short one. */
  full?: boolean;
}

export default function StatusBadge({ status, full = false }: Props) {
  const s = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[3px] px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ background: s.color, color: '#0a0a0a' }}
      title={s.label}
    >
      {full ? s.label : shortStatusLabel(status)}
    </span>
  );
}
