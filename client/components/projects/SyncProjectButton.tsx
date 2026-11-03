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
}

export function SyncProjectButton({ projectId, repoName }: SyncProjectButtonProps) {
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

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isBusy}
      title="Re-read the repository on GitHub and update this map"
    >
      {isBusy ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw aria-hidden="true" />
      )}
      {isBusy ? 'Syncing…' : 'Sync with GitHub'}
    </Button>
  );
}
