import { Injectable } from '@nestjs/common';
import { findRepoById, listInstallationRepos, Repository } from '@github/repos';

@Injectable()
export class ReposService {
  async listRepos(): Promise<Repository[]> {
    return listInstallationRepos();
  }

  async findById(repoId: string): Promise<Repository | undefined> {
    return findRepoById(repoId);
  }
}

