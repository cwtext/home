import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MarginNotes } from '@/components/notes/MarginNotes';
import { locate, segments, selectionIn, topAt, type Annotation, type NoteRange } from '@/lib/annotations';
import { cn } from '@/lib/utils';

interface AnnotatedTextProps {
  noteSlug: string;
  text: string;
  /** Search text to highlight */
  highlight?: string;
  matchCase?: boolean;
  /** The reader's own notes on this paragraph */
  annotations?: Annotation[];
  /** Whether the reader may add notes (signed in) */
  canAnnotate?: boolean;
  /** Shown above the text, e.g. where it comes from */
  header?: ReactNode;
  className?: string;
}

/**
 * A paragraph with search matches marked, the words the reader has notes on
 * underlined, and their notes in the margin (under the text on narrow screens).
 * Selecting words offers a note on them.
 */
export function AnnotatedText({ noteSlug, text, highlight = '', matchCase = false, annotations = [], canAnnotate = false, header, className }: AnnotatedTextProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<NoteRange | null>(null);
  // How far down the paragraph each note's words are, so the note can sit beside them
  const [tops, setTops] = useState<Record<string, number>>({});

  const located = useMemo(
    () => annotations.map((a) => ({ id: a.id, range: locate(a, text) })),
    [annotations, text],
  );
  const parts = useMemo(
    () => segments(text, highlight, matchCase, located.flatMap((l) => (l.range ? [l.range] : []))),
    [located, text, highlight, matchCase],
  );

  useLayoutEffect(() => {
    const row = rowRef.current;
    const textEl = textRef.current;
    if (!row || !textEl) return;
    const measure = () => {
      const offset = textEl.getBoundingClientRect().top - row.getBoundingClientRect().top;
      const next: Record<string, number> = {};
      for (const { id, range } of located) next[id] = range ? offset + topAt(textEl, range.start) : 0;
      if (selection) next.new = offset + topAt(textEl, selection.start);
      setTops((prev) => {
        const same = Object.keys(next).length === Object.keys(prev).length
          && Object.entries(next).every(([k, v]) => prev[k] === v);
        return same ? prev : next;
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [located, parts, selection]);

  const showMargin = canAnnotate || annotations.length > 0;
  const capture = () => {
    if (canAnnotate && textRef.current) setSelection(selectionIn(textRef.current));
  };

  return (
    <div ref={rowRef} className={cn('flex flex-col', showMargin && 'lg:flex-row lg:gap-8')}>
      <div className="max-w-prose">
        {header}
        <div
          ref={textRef}
          className={cn('whitespace-pre-line', className)}
          onMouseUp={capture}
          onKeyUp={capture}
          onTouchEnd={() => setTimeout(capture, 0)}
        >
          {parts.map((part, i) => {
            if (!part.match && !part.noted) return part.text;
            const noted = part.noted && 'underline decoration-amber-500/80 decoration-2 underline-offset-2';
            return part.match ? (
              <mark key={i} className={cn('bg-yellow-200 text-foreground rounded-sm px-0.5 -mx-0.5 dark:bg-yellow-500/40', noted)}>
                {part.text}
              </mark>
            ) : (
              <span key={i} className={cn('bg-amber-100/60 dark:bg-amber-500/15', noted)}>{part.text}</span>
            );
          })}
        </div>
      </div>
      {showMargin && (
        <MarginNotes
          noteSlug={noteSlug}
          annotations={annotations}
          tops={tops}
          canAnnotate={canAnnotate}
          selection={selection}
          onSelectionUsed={() => setSelection(null)}
        />
      )}
    </div>
  );
}
