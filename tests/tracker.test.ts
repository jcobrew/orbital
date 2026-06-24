import { describe, it, expect } from 'vitest';
import {
  TRACK_STAGES,
  DEFAULT_STAGE,
  trackStageMeta,
  isTrackStage,
} from '@/lib/tracker';

describe('tracker stage vocabulary', () => {
  it('exposes the five journey stages in order', () => {
    expect(TRACK_STAGES).toEqual([
      'interested',
      'applying',
      'applied',
      'interviewing',
      'decision',
    ]);
  });

  it('defaults to "interested"', () => {
    expect(DEFAULT_STAGE).toBe('interested');
    expect(TRACK_STAGES).toContain(DEFAULT_STAGE);
  });

  it('gives every stage a label + color', () => {
    for (const s of TRACK_STAGES) {
      const meta = trackStageMeta(s);
      expect(meta.label).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('guards untrusted stage values', () => {
    expect(isTrackStage('applied')).toBe(true);
    expect(isTrackStage('nope')).toBe(false);
    expect(isTrackStage(undefined)).toBe(false);
    expect(isTrackStage(3)).toBe(false);
  });
});
