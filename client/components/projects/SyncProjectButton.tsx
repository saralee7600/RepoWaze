'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { pluralize } from '@/lib/format';
import { getErrorMessage } from '@/services/api';
import { projectsService } from '@/services/projects';

interface SyncProjectButtonProps {
  projectId: number;
  repoName: string;
  /** Icon-only button, for dense layouts such as project cards. */
  compact?: boolean;
}

const SYNC_HINT = 'Re-read the repository on GitHub and update this map';

export function SyncProjectButton({ projectId, repoName, compact = false }: SyncProjectButtonProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = isSyncing || isRefreshing;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const project = await projectsService.sync(projectId);
      toast.success(`Synced ${repoName}`, {
        description: `${project.nodes.length} ${pluralize(project.nodes.length, 'node')} and ${project.edges.length} ${pluralize(project.edges.length, 'edge')} mapped from the latest code.`,
      });
      startRefresh(() => router.refresh());
    } catch (error) {
      toast.error(`Couldn't sync ${repoName}`, { description: getErrorMessage(error) });
    } finally {
      setIsSyncing(false);
    }
  };

  const icon = isBusy ? (
    <Loader2 className="animate-spin" aria-hidden="true" />
  ) : (
    <RefreshCw aria-hidden="true" />
  );

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleSync}
        disabled={isBusy}
        aria-label={`Sync ${repoName} with GitHub`}
        title={SYNC_HINT}
        className="relative z-10 text-muted-foreground hover:bg-primary/10 hover:text-primary"
      >
        {icon}
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleSync} disabled={isBusy} title={SYNC_HINT}>
      {icon}
      {isBusy ? 'Syncing…' : 'Sync with GitHub'}
    </Button>
  );
}
