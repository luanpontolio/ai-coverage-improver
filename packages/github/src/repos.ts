export interface Repository {
  id: string;
  owner: string;
  name: string;
  defaultBranch: string;
}

const mockRepos: Repository[] = [
  { id: 'demo-repo', owner: 'octo-org', name: 'coverage-demo', defaultBranch: 'main' },
  { id: 'demo-repo-json', owner: 'octo-org', name: 'coverage-json', defaultBranch: 'main' },
];

export const listInstallationRepos = async (): Promise<Repository[]> => {
  return mockRepos;
};

export const findRepoById = async (repoId: string): Promise<Repository | undefined> => {
  return mockRepos.find((repo) => repo.id === repoId);
};

