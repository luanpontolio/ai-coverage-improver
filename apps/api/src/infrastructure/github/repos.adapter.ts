import { Injectable } from '@nestjs/common';
import { findRepoById, listInstallationRepos } from '@github/repos';
import { Repository } from '../../domain/repository';

/**
 * Infrastructure adapter for GitHub repositories
 * Adapts external GitHub package to domain entities
 */
@Injectable()
export class GitHubReposAdapter {
  async listInstallationRepositories(): Promise<Repository[]> {
    const githubRepos = await listInstallationRepos();
    return githubRepos.map((repo) => Repository.fromGitHubRepo(repo));
  }

  async findRepositoryById(repoId: string): Promise<Repository | undefined> {
    const githubRepo = await findRepoById(repoId);
    return githubRepo ? Repository.fromGitHubRepo(githubRepo) : undefined;
  }
}

