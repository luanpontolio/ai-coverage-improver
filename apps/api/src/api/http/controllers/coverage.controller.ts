import { Controller, Get, Param } from '@nestjs/common';
import { AnalyzeRepositoryCoverageOperation } from '../../../application/operations/analyze-repository-coverage.operation';

@Controller('repos/:repoId/coverage')
export class CoverageController {
  constructor(
    private readonly analyzeRepositoryCoverageOperation: AnalyzeRepositoryCoverageOperation,
  ) {}

  @Get()
  async getCoverage(@Param('repoId') repoId: string) {
    const { snapshot } = await this.analyzeRepositoryCoverageOperation.execute({
      repositoryId: repoId,
    });

    return {
      repoId: snapshot.repositoryId,
      ref: snapshot.ref,
      coverageSourcePath: snapshot.coverageSourcePath,
      thresholdPct: snapshot.thresholdPct,
      files: snapshot.files,
    };
  }
}

