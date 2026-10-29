'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { FormTextField } from '@/components/common/FormTextField';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup, FieldSet } from '@/components/ui/field';
import {
  MAX_PROJECT_NAME_LENGTH,
  importProjectDefaults,
  importProjectSchema,
  toImportRequest,
  type ImportProjectFormValues,
} from '@/lib/schemas/import-project.schema';
import { getErrorMessage } from '@/services/api';
import { projectsService } from '@/services/projects';
import { pluralize } from '@/lib/format';

export function ImportProjectForm() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ImportProjectFormValues>({
    resolver: zodResolver(importProjectSchema),
    defaultValues: importProjectDefaults,
    mode: 'onTouched',
  });

  // `isSubmitSuccessful` keeps the form locked while the redirect to the dashboard happens.
  const isBusy = isSubmitting || isSubmitSuccessful;
  const serverError = errors.root?.server?.message;

  const onSubmit = async (values: ImportProjectFormValues) => {
    clearErrors('root.server');
    try {
      const project = await projectsService.importProject(toImportRequest(values));
      toast.success(`Imported ${project.repoName}`, {
        description: `${project.nodes.length} ${pluralize(project.nodes.length, 'node')} and ${project.edges.length} ${pluralize(project.edges.length, 'edge')} mapped.`,
      });
      router.push('/');
    } catch (error) {
      setError('root.server', { type: 'server', message: getErrorMessage(error) });
    }
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      {/* `contents` keeps CardHeader/Content/Footer as direct flex children of the Card. */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isBusy} className="contents">
        <CardHeader>
          <CardTitle>Import a GitHub repository</CardTitle>
          <CardDescription>
            We read the repository&apos;s TypeORM <code>*.entity.ts</code> files and turn them into a
            graph of tables and relations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>Import failed</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <FieldSet disabled={isBusy}>
            <FieldGroup>
              <FormTextField
                control={control}
                name="repoUrl"
                label="Repository URL"
                type="url"
                inputMode="url"
                placeholder="https://github.com/owner/repo"
                autoComplete="off"
                autoFocus
              />
              <FormTextField
                control={control}
                name="name"
                label="Project name (optional)"
                placeholder="Defaults to owner/repo"
                description="Shown on the dashboard instead of the repository name."
                maxLength={MAX_PROJECT_NAME_LENGTH}
                autoComplete="off"
              />
            </FieldGroup>
          </FieldSet>
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={isBusy}>
            {isBusy ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Download aria-hidden="true" />
            )}
            {isSubmitting ? 'Importing…' : isSubmitSuccessful ? 'Redirecting…' : 'Import repository'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
