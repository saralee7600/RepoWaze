import Link from 'next/link';
import { ArrowLeft, Boxes, CalendarDays, ExternalLink, Waypoints } from 'lucide-react';
import { buttonStyles } from '@/components/ui/buttonStyles';
import { displayUrl, formatDate, formatNumber, pluralize } from '@/lib/format';

interface ProjectHeaderProps {
  repoName: string;
  repoUrl: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
}

export function ProjectHeader({ repoName, repoUrl, createdAt, nodeCount, edgeCount }: ProjectHeaderProps) {
  return (
    <header className="space-y-4">
      <Link href="/" className={buttonStyles({ variant: 'ghost', size: 'sm', className: '-ms-3' })}>
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        All projects
      </Link>

      <div className="space-y-2">
        {/* The app header already provides the page's <h1>. */}
        <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground" title={repoName}>
          {repoName}
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className="inline-flex items-center gap-1 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none"
          >
            {displayUrl(repoUrl)}
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <span className="inline-flex items-center gap-1.5">
            <Boxes className="size-4 text-primary" aria-hidden="true" />
            {formatNumber(nodeCount)} {pluralize(nodeCount, 'node')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Waypoints className="size-4 text-primary" aria-hidden="true" />
            {formatNumber(edgeCount)} {pluralize(edgeCount, 'relation')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden="true" />
            Imported <time dateTime={createdAt}>{formatDate(createdAt)}</time>
          </span>
        </div>
      </div>
    </header>
  );
}
