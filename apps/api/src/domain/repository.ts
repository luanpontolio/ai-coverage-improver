/**
 * Domain entity representing a GitHub repository
 * This is the domain representation, independent of GitHub API structure
 */
export class Repository {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly owner: string,
    public readonly defaultBranch: string,
    public readonly fullName: string,
  ) {}

  static fromGitHubRepo(githubRepo: any): Repository {
    return new Repository(
      githubRepo.id,
      githubRepo.name,
      githubRepo.owner,
      githubRepo.defaultBranch,
      githubRepo.fullName,
    );
  }

  get qualifiedName(): string {
    return `${this.owner}/${this.name}`;
  }
}

