/**
 * Domain entity representing a GitHub repository
 * This is the domain representation, independent of GitHub API structure
 */
export class Repository {
  constructor(
    public readonly id: string,
    public readonly provider: string,
    public readonly owner: string,
    public readonly name: string,
    public readonly defaultBranch: string,
    public readonly installationId?: string,
  ) {}

  static fromGitHubRepo(githubRepo: any): Repository {
    console.log('githubRepo', githubRepo);
    return new Repository(
      githubRepo.id,
      'github',
      githubRepo.owner,
      githubRepo.name,
      githubRepo.defaultBranch,
      githubRepo.installationId,
    );
  }

  get qualifiedName(): string {
    return `${this.owner}/${this.name}`;
  }

  get fullName(): string {
    return this.qualifiedName;
  }
}

