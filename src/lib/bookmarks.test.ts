import { beforeEach, describe, expect, it } from 'vitest';
import { readLocalBookmarks, toggled, writeLocalBookmarks } from '@/lib/bookmarks';

describe('bookmarks', () => {
  beforeEach(() => localStorage.clear());

  it('adds newest first and removes', () => {
    const a = toggled([], 'a', true, new Date('2026-01-01'));
    const ab = toggled(a, 'b', true, new Date('2026-01-02'));
    expect(ab.map((b) => b.note_slug)).toEqual(['b', 'a']);
    expect(toggled(ab, 'a', false).map((b) => b.note_slug)).toEqual(['b']);
    // Bookmarking again moves it to the top rather than doubling it
    expect(toggled(ab, 'a', true).map((b) => b.note_slug)).toEqual(['a', 'b']);
  });

  it('keeps bookmarks in this browser and ignores damaged storage', () => {
    writeLocalBookmarks(toggled([], 'p-1', true));
    expect(readLocalBookmarks().map((b) => b.note_slug)).toEqual(['p-1']);
    localStorage.setItem('cwtext:bookmarks', '{not json');
    expect(readLocalBookmarks()).toEqual([]);
    localStorage.setItem('cwtext:bookmarks', '[{"note_slug":1}]');
    expect(readLocalBookmarks()).toEqual([]);
  });
});
