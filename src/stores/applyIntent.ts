// Apply-intent signal — set the moment a founder clicks an Apply CTA, so a
// globally-mounted toast can offer to mark the program as "Applied" in their
// tracker (closing the discovery → apply → track loop). In-memory only: it's a
// transient nudge, never persisted.
import { atom } from 'nanostores';

export interface ApplyIntent {
  slug: string;
  name: string;
}

export const $applyIntent = atom<ApplyIntent | null>(null);

/** Record that the user just opened a program's apply/visit link. */
export function noteApplyIntent(intent: ApplyIntent): void {
  $applyIntent.set(intent);
}

export function clearApplyIntent(): void {
  $applyIntent.set(null);
}
