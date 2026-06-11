// Intro-overlay visibility — shared across islands so the About control (in the
// nav) and the overlay itself (mounted once in the layout) stay in sync.
import { atom } from 'nanostores';

export const $introOpen = atom(false);

const SEEN_KEY = 'fa_intro_seen';

/** Open the overlay only if the visitor hasn't dismissed it before. */
export function autoOpenIntro(): void {
  try {
    if (!localStorage.getItem(SEEN_KEY)) $introOpen.set(true);
  } catch {
    $introOpen.set(true);
  }
}

export function openIntro(): void {
  $introOpen.set(true);
}

/** Close + remember, so it won't auto-open again. */
export function closeIntro(): void {
  $introOpen.set(false);
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage unavailable — fine */
  }
}
