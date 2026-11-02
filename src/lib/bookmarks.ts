/** A bookmarked paragraph (a row of `bookmarks`, see supabase/bookmarks.sql) */
export interface Bookmark {
  note_slug: string;
  created_at: string;
}

const KEY = 'cwtext:bookmarks';

/** Bookmarks kept in this browser, for readers who aren't signed in */
export function readLocalBookmarks(): Bookmark[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(
      (b): b is Bookmark => typeof b?.note_slug === 'string' && typeof b?.created_at === 'string',
    );
  } catch {
    return [];
  }
}

export function writeLocalBookmarks(bookmarks: Bookmark[]): void {
  try {
    if (bookmarks.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(bookmarks));
  } catch {
    // Storage can be blocked (private windows); bookmarks then last until the page closes
  }
}

/** `bookmarks` with `slug` added (newest first) or taken away */
export function toggled(bookmarks: Bookmark[], slug: string, on: boolean, now = new Date()): Bookmark[] {
  const rest = bookmarks.filter((b) => b.note_slug !== slug);
  return on ? [{ note_slug: slug, created_at: now.toISOString() }, ...rest] : rest;
}

/** The element id a paragraph has in a list of paragraphs, for links back to it */
export function paragraphAnchor(slug: string): string {
  return `p-${slug}`;
}

/**
 * Where a bookmark leads: its paragraph among the rest of its text, or the
 * paragraph on its own when it belongs to no text
 */
export function bookmarkLink(slug: string, work: { id: string; volume: string | null } | undefined): string {
  if (!work) return `/note/${encodeURIComponent(slug)}`;
  const params = new URLSearchParams();
  if (work.volume) params.set('vol', work.volume);
  params.set('text', work.id);
  return `/?${params}#${paragraphAnchor(slug)}`;
}
