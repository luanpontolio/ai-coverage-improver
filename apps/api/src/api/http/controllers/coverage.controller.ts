import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CoverageService } from '../../../application/coverage.service';
import { ReposService } from '../../../application/repos.service';

@Controller('repos/:repoId/coverage')
export class CoverageController {
  constructor(
    private readonly coverageService: CoverageService,
    private readonly reposService: ReposService,
  ) {}

  @Get()
  async getCoverage(@Param('repoId') repoId: string) {
    const repo = await this.reposService.findById(repoId);
    if (!repo) {
      throw new NotFoundException('Repo not found or not accessible');
    }
    return this.coverageService.fetchCoverageForRepo(repo);
  }
}

