export interface Repository {
  id: string;
  owner: string;
  name: string;
  defaultBranch: string;
}

/**
 * List user's accessible repositories using GitHub API
 * Uses the user's OAuth token to fetch repos they have access to
 */
export const listInstallationRepos = async (accessToken: string): Promise<Repository[]> => {
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ai-coverage-improver',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repositories: ${response.statusText}`);
  }

  const repos = await response.json();

  return repos.map((repo: any) => ({
    id: String(repo.id),
    owner: repo.owner.login,
    name: repo.name,
    defaultBranch: repo.default_branch,
  }));
};

/**
 * Find a specific repository by ID
 */
export const findRepoById = async (repoId: string, accessToken: string): Promise<Repository | undefined> => {
  // For finding by ID, we need to get the repo info from GitHub
  // GitHub doesn't have a direct "get repo by numeric ID" endpoint,
  // so we'll need to search through the user's repos
  const repos = await listInstallationRepos(accessToken);
  return repos.find((repo) => repo.id === repoId);
};

export interface FileContent {
  content: string;
  path: string;
  sha: string;
  size: number;
}

/**
 * Fetch a file's content from a GitHub repository
 * Returns null if the file doesn't exist (404)
 *
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path within the repository
 * @param ref - Branch name or commit SHA
 * @param accessToken - GitHub OAuth token
 */
export const fetchFileContent = async (
  owner: string,
  repo: string,
  path: string,
  ref: string,
  accessToken: string,
): Promise<FileContent | null> => {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ai-coverage-improver',
    },
  });

  // 404 means file doesn't exist at this path
  if (response.status === 404) {
    return null;
  }

  // Other errors should be propagated
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GitHub API error (${response.status}): ${response.statusText}. ${errorBody}`
    );
  }

  const data = await response.json();

  // Check if it's a file (not a directory)
  if (data.type !== 'file') {
    return null;
  }

  // Decode content from base64
  const content = Buffer.from(data.content, 'base64').toString('utf-8');

  return {
    content,
    path: data.path,
    sha: data.sha,
    size: data.size,
  };
};

