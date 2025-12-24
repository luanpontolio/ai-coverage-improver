import { Injectable, UnauthorizedException } from '@nestjs/common';
import { GitHubReposAdapter } from '../../infrastructure/github/repos.adapter';
import { RepositoryRepository } from '../../infrastructure/db/repository.repository';
import { Repository } from '../../domain/repository';

export interface ListInstallationRepositoriesInput {
  accessToken: string;
  installationId?: string;
}

/**
 * Operation: List Installation Repositories
 * 
 * Lists all repositories accessible by the user via GitHub OAuth
 * and ensures they're persisted in the database
 */
@Injectable()
export class ListInstallationRepositoriesOperation {
  constructor(
    private readonly githubReposAdapter: GitHubReposAdapter,
    private readonly repositoryRepository: RepositoryRepository,
  ) {}

  async execute(input: ListInstallationRepositoriesInput): Promise<Repository[]> {
    if (!input.accessToken) {
      throw new UnauthorizedException('Access token required');
    }

    const githubRepos = await this.githubReposAdapter.listInstallationRepositories(input.accessToken);
    console.log('=============== githubRepos ===============', githubRepos);
    // Persist each repository and get database ID
    const persistedRepos = await Promise.all(
      githubRepos.map(async (repo) => {
        const dbRepo = await this.repositoryRepository.upsert({
          provider: 'github',
          owner: repo.owner,
          name: repo.name,
          defaultBranch: repo.defaultBranch,
          installationId: input.installationId || null,
        });
        // Return repository with database ID
        return new Repository(
          dbRepo.id, // Use database CUID instead of GitHub ID
          dbRepo.provider,
          dbRepo.owner,
          dbRepo.name,
          dbRepo.defaultBranch,
          dbRepo.installationId || undefined,
        );
      })
    );
    const filteredRepos = persistedRepos.filter((repo): repo is Repository => repo !== undefined);
    return filteredRepos;
  }
}
