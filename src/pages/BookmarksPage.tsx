import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { BookmarkButton } from '@/components/notes/BookmarkButton';
import { useCurator } from '@/hooks/useCurator';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useStructuredNotes } from '@/hooks/useStructuredNotes';
import { useNoteWorks } from '@/hooks/useWorks';
import { sourceLine } from '@/lib/works';
import { bookmarkLink } from '@/lib/bookmarks';

/** The reader's bookmarked paragraphs, newest first, each a link back to its place in the text */
export function BookmarksPage() {
  const { userId } = useCurator();
  const { bookmarks, toggleBookmark, isBookmarked, inAccount, isLoading } = useBookmarks(userId);
  const { data: notes, isLoading: notesLoading } = useStructuredNotes();
  const { workById, workOf } = useNoteWorks(notes);

  useSeoMeta({ title: 'Bookmarks — Selected Texts of C.G. Jung' });

  const items = useMemo(() => {
    const bySlug = new Map((notes ?? []).map((n) => [n.id, n]));
    return bookmarks.map((b) => {
      const note = bySlug.get(b.note_slug);
      const workId = note ? workOf(note) : null;
      const work = workId ? workById.get(workId) : undefined;
      const to = bookmarkLink(b.note_slug, work);
      return { ...b, note, work, to };
    });
  }, [bookmarks, notes, workOf, workById]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between gap-3 h-16">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Texts</Link>
            </Button>
            <h1 className="text-xl font-bold">Bookmarks</h1>
          </div>
          <AccountMenu />
        </div>
      </header>

      <main className="container py-6 max-w-3xl">
        {isLoading || (bookmarks.length > 0 && notesLoading) ? (
          <div className="space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-full" /></div>
        ) : bookmarks.length === 0 ? (
          <p className="text-muted-foreground">
            You haven’t bookmarked any paragraphs yet. Use the bookmark beside a paragraph’s number to mark your place,
            and it will be listed here.
          </p>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''},{' '}
              {inAccount ? 'saved to your account.' : 'saved in this browser only. Sign in to keep them with your account.'}
            </p>
            <ul className="divide-y divide-border/40">
              {items.map(({ note_slug, note, work, to }) => (
                <li key={note_slug} className="flex gap-3 py-4">
                  <BookmarkButton
                    bookmarked={isBookmarked(note_slug)}
                    onToggle={() => toggleBookmark(note_slug)}
                    className="mt-0.5 h-fit"
                  />
                  <Link to={to} className="group min-w-0 flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-semibold group-hover:underline">
                        {note ? `¶ ${note.title}` : 'A paragraph that has since been removed'}
                      </span>
                      {work && <span className="text-muted-foreground"> · {sourceLine(work)}</span>}
                    </p>
                    {note && <p className="text-sm text-foreground/80 line-clamp-2">{note.content}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
