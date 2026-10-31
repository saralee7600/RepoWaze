'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/services/api';
import { projectsService } from '@/services/projects';
import type { ProjectSummary } from '@/types/api';

interface DeleteProjectDialogProps {
  project: Pick<ProjectSummary, 'id' | 'repoName'>;
}

/** Trash button on a project card that asks for confirmation, deletes the project, then refreshes the list. */
export function DeleteProjectDialog({ project }: DeleteProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = isDeleting || isRefreshing;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await projectsService.remove(project.id);
    } catch (error) {
      toast.error(`Couldn't delete ${project.repoName}`, { description: getErrorMessage(error) });
      setIsDeleting(false);
      return;
    }

    toast.success(`Deleted ${project.repoName}`);
    setIsDeleting(false);
    setOpen(false);
    // The dashboard list is rendered on the server; re-render it so the card disappears.
    startRefresh(() => router.refresh());
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isBusy && setOpen(next)}>
      <AlertDialogTrigger asChild>
        {/* `relative z-10` lifts the button above the card's stretched link. */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${project.repoName}`}
          title="Delete project"
          className="relative z-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{project.repoName}</span> and every node
            and relation mapped from it will be permanently removed. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) so the dialog stays open until the request settles. */}
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isBusy}>
            {isBusy ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            {isBusy ? 'Deleting…' : 'Delete project'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
