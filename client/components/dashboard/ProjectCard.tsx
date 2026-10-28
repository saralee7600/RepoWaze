import { Boxes, CalendarDays, ExternalLink, FolderGit2, Waypoints } from 'lucide-react';
import { displayUrl, formatDate, formatNumber, pluralize } from '@/lib/format';
import type { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
}

interface CountBadgeProps {
  icon: typeof Boxes;
  count: number;
  singular: string;
  plural: string;
}

function CountBadge({ icon: Icon, count, singular, plural }: CountBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
      <Icon className="size-3.5 text-primary" aria-hidden="true" />
      <span className="tabular-nums">{formatNumber(count)}</span>
      <span className="text-muted-foreground">{pluralize(count, singular, plural)}</span>
    </span>
  );
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { repoName, repoUrl, createdAt, nodes, edges } = project;

  return (
    <article className="group relative flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
          <FolderGit2 className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight text-foreground" title={repoName}>
            {repoName}
          </h3>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            title={repoUrl}
            className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
          >
            <span className="truncate">{displayUrl(repoUrl)}</span>
            <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CountBadge icon={Boxes} count={nodes.length} singular="node" plural="nodes" />
        <CountBadge icon={Waypoints} count={edges.length} singular="relation" plural="relations" />
      </div>

      <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" aria-hidden="true" />
        <span>Imported</span>
        <time dateTime={createdAt} className="text-foreground/80">
          {formatDate(createdAt)}
        </time>
      </div>
    </article>
  );
}
