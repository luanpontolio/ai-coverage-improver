import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GitHubReposAdapter } from '../../infrastructure/github/repos.adapter';
import { JobRepository } from '../../infrastructure/db/job.repository';
import { ImprovementQueue } from '../../infrastructure/queue';
import { ImprovementJob } from '../../domain/improvement-job';

export interface RequestCoverageImprovementInput {
  repositoryId: string;
  filePath: string;
  requestedByUserId: string;
}

export interface RequestCoverageImprovementOutput {
  job: ImprovementJob;
  reused: boolean;
}

/**
 * Operation: Request Coverage Improvement
 *
 * Creates a new improvement job for a file and enqueues it for processing.
 * Reuses existing open jobs to avoid duplicates.
 */
@Injectable()
export class RequestCoverageImprovementOperation {
  constructor(
    private readonly githubReposAdapter: GitHubReposAdapter,
    private readonly jobRepository: JobRepository,
    private readonly queue: ImprovementQueue,
  ) {}

  async execute(input: RequestCoverageImprovementInput): Promise<RequestCoverageImprovementOutput> {
    // Validate input using domain rules
    if (!input.filePath || !input.requestedByUserId) {
      throw new BadRequestException('File path is required');
    }

    ImprovementJob.validateTargetFilePath(input.filePath);

    // Verify repository exists
    const repo = await this.githubReposAdapter.findRepositoryById(input.repositoryId);
    console.log('repo', repo);
    if (!repo) {
      throw new NotFoundException('Repository not found or not accessible');
    }

    // Normalize file path using domain rules
    const normalizedFilePath = ImprovementJob.normalizeFilePath(input.filePath);

    // Check for existing open job
    const existingJobData = await this.jobRepository.findOpenByRepoAndFile(
      input.repositoryId,
      normalizedFilePath,
    );

    if (existingJobData) {
      // Reuse existing job
      const job = new ImprovementJob(existingJobData);
      return { job, reused: true };
    }

    // Create new job
    const createdJobData = await this.jobRepository.createJob({
      repositoryId: repo.id,
      targetFilePath: normalizedFilePath,
      requestedByUserId: input.requestedByUserId,
    });

    const job = new ImprovementJob(createdJobData);

    // Enqueue for async processing
    await this.queue.enqueue(job.id, repo.id, normalizedFilePath);

    return { job, reused: false };
  }
}

