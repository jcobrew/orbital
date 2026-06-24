import { describe, it, expect, beforeEach } from 'vitest';
import {
  $compare,
  COMPARE_MAX,
  toggleCompare,
  removeCompare,
  clearCompare,
  canAddCompare,
} from '@/stores/compare';

// The store guards storage access in try/catch, so it runs fine under node
// (no sessionStorage) — we exercise the in-memory selection + cap logic.
describe('compare selection store', () => {
  beforeEach(() => clearCompare());

  it('adds and removes slugs', () => {
    toggleCompare('a');
    toggleCompare('b');
    expect($compare.get()).toEqual(['a', 'b']);
    toggleCompare('a'); // toggle off
    expect($compare.get()).toEqual(['b']);
    removeCompare('b');
    expect($compare.get()).toEqual([]);
  });

  it('caps the selection at COMPARE_MAX', () => {
    for (let i = 0; i < COMPARE_MAX + 3; i++) toggleCompare(`p${i}`);
    expect($compare.get()).toHaveLength(COMPARE_MAX);
  });

  it('canAddCompare reflects the cap but always allows already-selected', () => {
    for (let i = 0; i < COMPARE_MAX; i++) toggleCompare(`p${i}`);
    expect(canAddCompare('new')).toBe(false);
    expect(canAddCompare('p0')).toBe(true); // already in → still toggleable
  });

  it('clearCompare empties the selection', () => {
    toggleCompare('a');
    clearCompare();
    expect($compare.get()).toEqual([]);
  });
});
