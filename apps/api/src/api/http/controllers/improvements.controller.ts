import { Controller, Post, Param, Body } from '@nestjs/common';
import { RequestCoverageImprovementOperation } from '../../../application/operations/request-coverage-improvement.operation';

interface RequestImprovementBody {
  filePath: string;
}

@Controller('repos/:repoId/improvements')
export class ImprovementsController {
  constructor(
    private readonly requestCoverageImprovementOperation: RequestCoverageImprovementOperation,
  ) {}

  @Post()
  async requestImprovement(
    @Param('repoId') repoId: string,
    @Body() body: RequestImprovementBody,
  ) {
    // Get current user and check admin permissions (MVP placeholders)
    const requestedByUserId = 'demo-user';
    const isAdmin = true;

    // Execute operation
    const { job, reused } = await this.requestCoverageImprovementOperation.execute({
      repositoryId: repoId,
      filePath: body.filePath,
      requestedByUserId,
      isAdmin,
    });

    // Return job details
    return {
      job: job.toJSON(),
      reused,
    };
  }
}
