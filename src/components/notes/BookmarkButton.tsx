import { Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  bookmarked: boolean;
  onToggle: () => void;
  /** Show the word as well as the icon */
  withLabel?: boolean;
  className?: string;
}

/** Bookmarks a paragraph, or removes its bookmark */
export function BookmarkButton({ bookmarked, onToggle, withLabel, className }: BookmarkButtonProps) {
  const label = bookmarked ? 'Remove bookmark' : 'Bookmark this paragraph';
  return (
    <button
      type="button"
      aria-pressed={bookmarked}
      aria-label={label}
      title={label}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        bookmarked && 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
        className,
      )}
    >
      <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
      {withLabel && <span className="text-sm">{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>}
    </button>
  );
}
