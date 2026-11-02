import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { StructuredNote } from '@/hooks/useStructuredNotes';
import type { Annotation } from '@/lib/annotations';
import { splitMatches } from '@/lib/highlight';
import { AnnotatedText } from '@/components/notes/AnnotatedText';
import { BookmarkButton } from '@/components/notes/BookmarkButton';
import { paragraphAnchor } from '@/lib/bookmarks';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: StructuredNote;
  /** Search text to highlight in the paragraph */
  highlight?: string;
  /** Highlight only where upper and lower case match the search */
  matchCase?: boolean;
  /** Where the paragraph comes from, shown above it when results mix texts */
  source?: string;
  /** The reader's own margin notes on this paragraph */
  annotations?: Annotation[];
  /** Whether the reader may add margin notes (signed in) */
  canAnnotate?: boolean;
  /** Whether the reader has bookmarked this paragraph */
  bookmarked?: boolean;
  /** Bookmarks the paragraph or removes its bookmark; no button without it */
  onToggleBookmark?: () => void;
}

/** `text` with each occurrence of `query` marked */
function Highlighted({ text, query, matchCase }: { text: string; query: string; matchCase?: boolean }) {
  return (
    <>
      {splitMatches(text, query, matchCase).map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-yellow-200 text-foreground rounded-sm px-0.5 -mx-0.5 dark:bg-yellow-500/40">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

function NoteCard({ note, highlight = '', matchCase, source, annotations, canAnnotate, bookmarked = false, onToggleBookmark }: NoteCardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const to = `/note/${encodeURIComponent(note.id)}`;

  // Clicking the paragraph opens it, unless the reader was selecting words to note
  const open = () => {
    if (window.getSelection()?.isCollapsed === false) return;
    navigate(to, { state: { from: location.search } });
  };

  return (
    <article
      id={paragraphAnchor(note.id)}
      onClick={open}
      className="group flex scroll-mt-24 gap-4 py-5 border-b border-border/40 last:border-b-0 hover:bg-muted/20 -mx-4 px-4 rounded-lg transition-colors cursor-pointer"
    >
      <div className="w-12 shrink-0 flex flex-col items-end gap-1.5">
        <h2 className="text-right text-sm font-bold text-muted-foreground tabular-nums leading-relaxed">
          <Link to={to} state={{ from: location.search }} onClick={(e) => e.stopPropagation()} className="hover:text-foreground">
            <Highlighted text={note.title} query={highlight} matchCase={matchCase} />
          </Link>
        </h2>
        {onToggleBookmark && (
          // Shown on hover with a mouse; always shown on touch screens, and once bookmarked
          <BookmarkButton
            bookmarked={bookmarked}
            onToggle={onToggleBookmark}
            className={cn(!bookmarked && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60')}
          />
        )}
      </div>
      <AnnotatedText
        noteSlug={note.id}
        text={note.content}
        highlight={highlight}
        matchCase={matchCase}
        annotations={annotations}
        canAnnotate={canAnnotate}
        header={source && <p className="mb-1 text-xs font-medium text-muted-foreground">{source}</p>}
        className="text-sm text-foreground/80 leading-relaxed"
      />
    </article>
  );
}

export { NoteCard };
