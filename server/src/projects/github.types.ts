/** Identifies a GitHub repository. */
export interface GithubRepoRef {
  owner: string;
  repo: string;
}

/** A source file fetched from a repository. */
export interface RepositoryFile {
  /** Path relative to the repository root, using forward slashes. */
  path: string;
  /** Raw UTF-8 source code. */
  content: string;
}

/** Subset of `GET /repos/{owner}/{repo}` that we use. */
export interface GithubRepoResponse {
  default_branch: string;
}

/** One entry of the Git trees API response. */
export interface GithubTreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
}

/** Subset of `GET /repos/{owner}/{repo}/git/trees/{sha}` that we use. */
export interface GithubTreeResponse {
  tree: GithubTreeEntry[];
  truncated: boolean;
}
