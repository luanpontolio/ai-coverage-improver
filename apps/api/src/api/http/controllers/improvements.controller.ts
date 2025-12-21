import { Body, Controller, NotFoundException, Param, Post } from '@nestjs/common';
import { ReposService } from '../../../application/repos.service';
import { ImprovementQueue } from '../../../application/improvement.queue';
import { JobRepository } from '../../../infrastructure/db/job.repository';

type ImprovementRequest = {
  filePath: string;
  coverageSourcePath?: string;
};

@Controller('repos/:repoId/improvements')
export class ImprovementsController {
  constructor(
    private readonly reposService: ReposService,
    private readonly jobRepository: JobRepository,
    private readonly queue: ImprovementQueue,
  ) {}

  @Post()
  async requestImprovement(@Param('repoId') repoId: string, @Body() body: ImprovementRequest) {
    const repo = await this.reposService.findById(repoId);
    if (!repo) {
      throw new NotFoundException('Repo not found or not accessible');
    }
    const filePath = body.filePath;
    const requestedByUserId = 'demo-user'; // placeholder for session user
    const isAdmin = true; // placeholder admin check

    const existing = await this.jobRepository.findOpenByRepoAndFile(repoId, filePath);
    if (existing) {
      return { job: existing, reused: true };
    }

    const job = await this.jobRepository.createJob({
      repositoryId: repo.id,
      targetFilePath: filePath,
      requestedByUserId,
      isAdmin,
    });

    await this.queue.enqueue(job.id);
    const latest = await this.jobRepository.findById(job.id);
    return { job: latest, reused: false };
  }
}

