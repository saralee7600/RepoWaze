'use client';

import { useMemo, useState } from 'react';
import { Boxes, FolderGit2, Search, Waypoints, X } from 'lucide-react';
import { pluralize } from '@/lib/format';
import type { Project } from '@/types/project';
import { EmptyState } from './EmptyState';
import { MetricCard } from './MetricCard';
import { ProjectCard } from './ProjectCard';

interface DashboardViewProps {
  projects: Project[];
}

function matchesQuery(project: Project, normalizedQuery: string): boolean {
  if (normalizedQuery === '') return true;
  return (
    project.repoName.toLowerCase().includes(normalizedQuery) ||
    project.repoUrl.toLowerCase().includes(normalizedQuery)
  );
}

export function DashboardView({ projects }: DashboardViewProps) {
  const [query, setQuery] = useState('');

  const totals = useMemo(
    () => ({
      projects: projects.length,
      nodes: projects.reduce((sum, p) => sum + p.nodes.length, 0),
      edges: projects.reduce((sum, p) => sum + p.edges.length, 0),
    }),
    [projects],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => matchesQuery(project, normalized));
  }, [projects, query]);

  const isFiltering = query.trim() !== '';

  return (
    <div className="space-y-8">
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total projects"
          value={totals.projects}
          hint="Repositories imported so far"
          icon={FolderGit2}
        />
        <MetricCard
          label="Exposed nodes"
          value={totals.nodes}
          hint="Entities, models and services"
          icon={Boxes}
        />
        <MetricCard
          label="Mapped edges"
          value={totals.edges}
          hint="Relations between nodes"
          icon={Waypoints}
        />
      </section>

      <section aria-label="Projects" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Projects</h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isFiltering
                ? `${filtered.length} of ${projects.length} ${pluralize(projects.length, 'project')}`
                : `${projects.length} ${pluralize(projects.length, 'project')}`}
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or URL…"
              aria-label="Search projects by name or URL"
              className="h-9 w-full rounded-md border border-input bg-card ps-9 pe-9 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {query !== '' && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute inset-y-0 end-1.5 my-auto flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState query={query} onClearSearch={() => setQuery('')} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => (
              <li key={project.id} className="flex">
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
