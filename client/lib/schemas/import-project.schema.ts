import { z } from 'zod';
import type { IImportProjectRequest } from '@repowaze/shared';

export const MAX_PROJECT_NAME_LENGTH = 255;

const SSH_URL = /^git@github\.com:[^/]+\/.+$/;
const SHORTHAND = /^[^/\s:]+\/[^/\s:]+$/;
const GITHUB_HOSTS = ['github.com', 'www.github.com'];

export function isGithubRepoReference(value: string): boolean {
  if (SSH_URL.test(value) || SHORTHAND.test(value)) return true;
  try {
    const url = new URL(value);
    const segments = url.pathname.split('/').filter(Boolean);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      GITHUB_HOSTS.includes(url.hostname) &&
      segments.length >= 2
    );
  } catch {
    return false;
  }
}

export const importProjectSchema = z.object({
  repoUrl: z
    .string()
    .trim()
    .min(1, 'Repository URL is required')
    .refine(isGithubRepoReference, {
      message: 'Enter a GitHub repository, e.g. https://github.com/owner/repo',
    }),
  name: z
    .string()
    .trim()
    .max(MAX_PROJECT_NAME_LENGTH, `Name must be at most ${MAX_PROJECT_NAME_LENGTH} characters`),
});

export type ImportProjectFormValues = z.infer<typeof importProjectSchema>;

export const importProjectDefaults: ImportProjectFormValues = { repoUrl: '', name: '' };

export function toImportRequest({ repoUrl, name }: ImportProjectFormValues): IImportProjectRequest {
  return name === '' ? { repoUrl } : { repoUrl, name };
}
