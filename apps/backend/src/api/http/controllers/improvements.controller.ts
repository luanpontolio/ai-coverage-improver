import { Controller, Post, Get, Param, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { RequestCoverageImprovementOperation } from '../../../application/operations/request-coverage-improvement.operation';
import { GetJobStatusOperation } from '../../../application/operations/get-job-status.operation';

@Controller('repos/:repoId/improvements')
export class ImprovementsController {
  constructor(
    private readonly requestCoverageImprovementOperation: RequestCoverageImprovementOperation,
    private readonly getJobStatusOperation: GetJobStatusOperation,
  ) {}

  @Post()
  async requestImprovement(
    @Param('repoId') repoId: string,
    @Req() req: Request,
  ) {
    const session = req.session as any;
    const user = session?.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Execute operation - only needs repositoryId
    const { job, reused } = await this.requestCoverageImprovementOperation.execute({
      repositoryId: repoId,
      requestedByUserId: user.id,
    });

    // Return job details
    return {
      job: job.toJSON(),
      reused,
    };
  }

  @Get(':jobId')
  async getJobStatus(
    @Param('repoId') repoId: string,
    @Param('jobId') jobId: string,
  ) {
    // Execute operation
    const { job } = await this.getJobStatusOperation.execute({
      repositoryId: repoId,
      jobId,
    });

    return {
      job: job.toJSON(),
    };
  }
}
