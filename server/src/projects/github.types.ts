export interface GithubRepoRef {
  owner: string;
  repo: string;
}

export interface RepositoryFile {
  path: string;
  content: string;
}

export interface GithubRepoResponse {
  default_branch: string;
}

export interface GithubTreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
}

export interface GithubTreeResponse {
  tree: GithubTreeEntry[];
  truncated: boolean;
}
