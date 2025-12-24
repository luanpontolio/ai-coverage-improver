import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryRepository } from '../../infrastructure/db/repository.repository';
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
    private readonly repositoryRepository: RepositoryRepository,
    private readonly jobRepository: JobRepository,
    private readonly queue: ImprovementQueue,
  ) {}

  async execute(input: RequestCoverageImprovementInput): Promise<RequestCoverageImprovementOutput> {
    // Validate input using domain rules
    if (!input.filePath || !input.requestedByUserId) {
      throw new BadRequestException('File path is required');
    }

    ImprovementJob.validateTargetFilePath(input.filePath);

    // Verify repository exists in database
    const repo = await this.repositoryRepository.findById(input.repositoryId);
    if (!repo) {
      throw new NotFoundException('Repository not found');
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

