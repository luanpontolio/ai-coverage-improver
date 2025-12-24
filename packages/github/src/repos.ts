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

