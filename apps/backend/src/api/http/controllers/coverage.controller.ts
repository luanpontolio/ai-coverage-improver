import { Controller, Get, Param, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AnalyzeRepositoryCoverageOperation } from '../../../application/operations/analyze-repository-coverage.operation';

@Controller('repos/:repoId/coverage')
export class CoverageController {
  constructor(
    private readonly analyzeRepositoryCoverageOperation: AnalyzeRepositoryCoverageOperation,
  ) {}

  @Get()
  async getCoverage(@Param('repoId') repoId: string, @Req() req: Request) {
    const session = req.session as any;
    const accessToken = session?.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException('Not authenticated');
    }

    const { snapshot } = await this.analyzeRepositoryCoverageOperation.execute({
      repositoryId: repoId,
      accessToken,
    });

    console.log('=============== snapshot ===============', snapshot);

    return {
      repoId: snapshot.repositoryId,
      ref: snapshot.ref,
      coverageSourcePath: snapshot.coverageSourcePath,
      thresholdPct: snapshot.thresholdPct,
      files: snapshot.files,
    };
  }
}

