import Link from 'next/link';
import { Download, FolderSearch, SearchX } from 'lucide-react';
import { buttonStyles } from '@/components/ui/buttonStyles';

interface EmptyStateProps {
  /** Active search text. When set, the state explains that nothing matched. */
  query?: string;
  /** Resets the search; the "Clear search" button only shows while searching. */
  onClearSearch?: () => void;
}

export function EmptyState({ query = '', onClearSearch }: EmptyStateProps) {
  const searching = query.trim().length > 0;
  const Icon = searching ? SearchX : FolderSearch;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>

      <h3 className="mt-4 text-base font-semibold text-foreground">
        {searching ? 'No projects match your search' : 'No projects yet'}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {searching ? (
          <>
            Nothing matched <span className="font-medium text-foreground">“{query.trim()}”</span>.
            Try a different name or URL, or import a new repository.
          </>
        ) : (
          'Import a GitHub repository to parse its entities and explore how they relate to each other.'
        )}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {searching && onClearSearch && (
          <button type="button" onClick={onClearSearch} className={buttonStyles({ variant: 'outline' })}>
            Clear search
          </button>
        )}
        <Link href="/import" className={buttonStyles()}>
          <Download className="size-4" aria-hidden="true" />
          Import Project
        </Link>
      </div>
    </div>
  );
}
