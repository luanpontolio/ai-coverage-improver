import { Injectable } from '@nestjs/common';
import { GitHubReposAdapter } from '../../infrastructure/github/repos.adapter';
import { Repository } from '../../domain/repository';

/**
 * Operation: List Installation Repositories
 * 
 * Lists all repositories accessible by the GitHub App installation
 */
@Injectable()
export class ListInstallationRepositoriesOperation {
  constructor(private readonly githubReposAdapter: GitHubReposAdapter) {}

  async execute(): Promise<Repository[]> {
    return await this.githubReposAdapter.listInstallationRepositories();
  }
}

