import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GithubRepoRef,
  GithubRepoResponse,
  GithubTreeEntry,
  GithubTreeResponse,
  RepositoryFile,
} from './github.types';

const GITHUB_API = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15_000;
const FETCH_CONCURRENCY = 8;
/** Hard cap so a pathological repository cannot trigger thousands of requests. */
const MAX_ENTITY_FILES = 500;
/** Entity files are small; anything larger is almost certainly not hand-written. */
const MAX_FILE_BYTES = 1_000_000;

const ENTITY_FILE_PATTERN = /\.entity\.ts$/;
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage']);
const NAME_PATTERN = /^[\w.-]+$/;

/**
 * Talks to the GitHub REST API to discover and download TypeORM entity files.
 * Uses Node's built-in `fetch`; an optional `GITHUB_TOKEN` env var raises rate
 * limits and enables private repositories.
 */
@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly token: string | undefined;

  constructor(config: ConfigService) {
    this.token = config.get<string>('GITHUB_TOKEN') || undefined;
  }

  /**
   * Extracts `{ owner, repo }` from a GitHub URL. Accepts https URLs (with an
   * optional `.git` suffix or `/tree/...` path), `git@github.com:owner/repo.git`
   * and the `owner/repo` shorthand.
   */
  parseRepoUrl(rawUrl: string): GithubRepoRef {
    const input = rawUrl.trim();

    const ssh = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/.exec(input);
    const shorthand = /^([^/\s:]+)\/([^/\s:]+)$/.exec(input);

    let owner: string | undefined;
    let repo: string | undefined;

    if (ssh) {
      [, owner, repo] = ssh;
    } else if (shorthand) {
      [, owner, repo] = shorthand;
    } else {
      let url: URL;
      try {
        url = new URL(input);
      } catch {
        throw new BadRequestException(`"${rawUrl}" is not a valid GitHub repository URL`);
      }
      const isGithubHost = ['github.com', 'www.github.com'].includes(url.hostname);
      if (!['http:', 'https:'].includes(url.protocol) || !isGithubHost) {
        throw new BadRequestException('Only github.com repositories are supported');
      }
      [owner, repo] = url.pathname.split('/').filter(Boolean);
    }

    repo = repo?.replace(/\.git$/, '');
    const isValid = (part: string | undefined): part is string =>
      !!part && NAME_PATTERN.test(part) && part !== '.' && part !== '..';

    if (!isValid(owner) || !isValid(repo)) {
      throw new BadRequestException(
        `Could not determine owner and repository from "${rawUrl}"`,
      );
    }
    return { owner, repo };
  }

  /**
   * Downloads every `*.entity.ts` file found on the repository's default branch.
   * Returns an empty array when the repository contains none.
   */
  async fetchEntityFiles(ref: GithubRepoRef): Promise<RepositoryFile[]> {
    const branch = await this.getDefaultBranch(ref);
    const entries = await this.listEntityFiles(ref, branch);

    this.logger.log(
      `Fetching ${entries.length} entity file(s) from ${ref.owner}/${ref.repo}@${branch}`,
    );

    return this.mapWithConcurrency(entries, FETCH_CONCURRENCY, async (entry) => ({
      path: entry.path,
      content: await this.fetchBlob(ref, entry.sha),
    }));
  }

  private async getDefaultBranch(ref: GithubRepoRef): Promise<string> {
    const repo = await this.getJson<GithubRepoResponse>(
      `/repos/${ref.owner}/${ref.repo}`,
    );
    return repo.default_branch;
  }

  /** Reads the full recursive git tree and keeps only entity files. */
  private async listEntityFiles(
    ref: GithubRepoRef,
    branch: string,
  ): Promise<GithubTreeEntry[]> {
    const tree = await this.getJson<GithubTreeResponse>(
      `/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    );

    if (tree.truncated) {
      this.logger.warn(
        `Git tree of ${ref.owner}/${ref.repo} was truncated by GitHub; some entities may be missing`,
      );
    }

    const matches = tree.tree.filter((entry) => this.isEntityFile(entry));

    if (matches.length > MAX_ENTITY_FILES) {
      this.logger.warn(
        `Found ${matches.length} entity files; only the first ${MAX_ENTITY_FILES} will be imported`,
      );
    }
    return matches.slice(0, MAX_ENTITY_FILES);
  }

  private isEntityFile(entry: GithubTreeEntry): boolean {
    if (entry.type !== 'blob' || !ENTITY_FILE_PATTERN.test(entry.path)) {
      return false;
    }
    if (entry.path.split('/').some((segment) => IGNORED_DIRECTORIES.has(segment))) {
      return false;
    }
    if (entry.size !== undefined && entry.size > MAX_FILE_BYTES) {
      this.logger.warn(`Skipping ${entry.path}: file is too large (${entry.size} bytes)`);
      return false;
    }
    return true;
  }

  /** Downloads a file's raw content by blob SHA (immutable, so no path encoding needed). */
  private async fetchBlob(ref: GithubRepoRef, sha: string): Promise<string> {
    const response = await this.request(
      `/repos/${ref.owner}/${ref.repo}/git/blobs/${sha}`,
      'application/vnd.github.raw+json',
    );
    return response.text();
  }

  private async getJson<T>(path: string): Promise<T> {
    const response = await this.request(path, 'application/vnd.github+json');
    // The response body is trusted to match the documented GitHub schema.
    return (await response.json()) as T;
  }

  /** Performs an authenticated GET and maps GitHub failures to Nest HTTP exceptions. */
  private async request(path: string, accept: string): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: accept,
      'User-Agent': 'RepoWaze',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${GITHUB_API}${path}`, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new BadGatewayException(`Could not reach GitHub: ${reason}`);
    }

    if (response.ok) {
      return response;
    }
    throw this.toException(response);
  }

  private toException(response: Response): HttpException {
    const rateLimited =
      response.status === 429 ||
      (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0');

    if (rateLimited) {
      return new HttpException(
        'GitHub API rate limit exceeded. Set GITHUB_TOKEN or try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    switch (response.status) {
      case 404:
        return new NotFoundException(
          'Repository not found (if it is private, configure a valid GITHUB_TOKEN)',
        );
      case 403:
        return new ForbiddenException('GitHub denied access to this repository');
      case 401:
        return new BadGatewayException('The configured GITHUB_TOKEN was rejected by GitHub');
      default:
        return new BadGatewayException(`GitHub API responded with status ${response.status}`);
    }
  }

  /** Maps `items` with at most `limit` promises in flight, preserving order. */
  private async mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array<R>(items.length);
    let next = 0;

    const worker = async (): Promise<void> => {
      while (next < items.length) {
        const index = next++;
        results[index] = await mapper(items[index]);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(limit, items.length) }, () => worker()),
    );
    return results;
  }
}
