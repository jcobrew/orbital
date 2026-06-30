// Personal application-tracking vocabulary. A founder's saved programs each get
// one of these stages so /saved becomes a lightweight pipeline ("where am I with
// this place?"), not just a bookmark list. Pure module — no React, no storage —
// so it stays unit-testable and shared between the store and the UI.

export type TrackStage =
  | 'interested'
  | 'applying'
  | 'applied'
  | 'interviewing'
  | 'decision';

export interface TrackStageMeta {
  label: string;
  /** Hex color, drawn from the same palette family as lib/status.ts. */
  color: string;
}

/** Journey order — earliest intent first. Drives grouping + the segmented control. */
export const TRACK_STAGES: TrackStage[] = [
  'interested',
  'applying',
  'applied',
  'interviewing',
  'decision',
];

/** The stage a saved-but-untracked program defaults into. */
export const DEFAULT_STAGE: TrackStage = 'interested';

const META: Record<TrackStage, TrackStageMeta> = {
  interested: { label: 'Interested', color: '#4f9dff' },
  applying: { label: 'Applying', color: '#b388ff' },
  applied: { label: 'Applied', color: '#25e0a4' },
  interviewing: { label: 'Interviewing', color: '#ffc24b' },
  decision: { label: 'Decision', color: '#ff6fae' },
};

export function trackStageMeta(stage: TrackStage): TrackStageMeta {
  return META[stage] ?? { label: stage, color: '#9aa3bd' };
}

/** Type guard for hydrating untrusted (localStorage / URL) stage values. */
export function isTrackStage(v: unknown): v is TrackStage {
  return typeof v === 'string' && (TRACK_STAGES as string[]).includes(v);
}
