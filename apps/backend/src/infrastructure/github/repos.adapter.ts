import { Injectable } from '@nestjs/common';
import { findRepoById, listInstallationRepos } from '../../../../../packages/github/src/repos';
import { Repository } from '../../domain/repository';

/**
 * Infrastructure adapter for GitHub repositories
 * Adapts external GitHub package to domain entities
 */
@Injectable()
export class GitHubReposAdapter {
  async listInstallationRepositories(accessToken: string): Promise<Repository[]> {
    console.log('listInstallationRepositories', accessToken);
    const githubRepos = await listInstallationRepos(accessToken);
    console.log('githubRepos', githubRepos);
    return githubRepos.map((repo) => Repository.fromGitHubRepo(repo));
  }

  async findRepositoryById(repoId: string, accessToken: string): Promise<Repository | undefined> {
    const githubRepo = await findRepoById(repoId, accessToken);
    return githubRepo ? Repository.fromGitHubRepo(githubRepo) : undefined;
  }
}

