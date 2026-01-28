import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryRepository } from '../../infrastructure/db/repository.repository';
import { JobRepository } from '../../infrastructure/db/job.repository';
import { ImprovementQueue } from '../../infrastructure/queue';
import { ImprovementJob } from '../../domain/improvement-job';

export interface RequestCoverageImprovementInput {
  repositoryId: string;
  requestedByUserId: string;
}

export interface RequestCoverageImprovementOutput {
  job: ImprovementJob;
  reused: boolean;
}

/**
 * Operation: Request Coverage Improvement
 *
 * Creates a job to clone repository and prepare for AI processing.
 * Only receives repositoryId - everything else is determined from the repository data.
 */
@Injectable()
export class RequestCoverageImprovementOperation {
  constructor(
    private readonly repositoryRepository: RepositoryRepository,
    private readonly jobRepository: JobRepository,
    private readonly queue: ImprovementQueue,
  ) {}

  async execute(input: RequestCoverageImprovementInput): Promise<RequestCoverageImprovementOutput> {
    if (!input.requestedByUserId) {
      throw new BadRequestException('User ID is required');
    }

    // Validate repository exists in database
    const repo = await this.repositoryRepository.findById(input.repositoryId);
    if (!repo) {
      throw new NotFoundException(`Repository not found: ${input.repositoryId}`);
    }

    console.log(`📋 Requesting improvement for ${repo.owner}/${repo.name}`);
    console.log(`🔍 [DEBUG] Checking for existing open job for repository ${input.repositoryId}`);

    // Check for existing open job
    const existingJobData = await this.jobRepository.findOpenJobByRepo(input.repositoryId);

    if (existingJobData) {
      const job = new ImprovementJob(existingJobData);
      console.log(`♻️ [DEBUG] Found existing job ${job.id} with status: ${job.status}`);
      console.log(`🔄 [DEBUG] Re-enqueuing existing job to continue processing`);
      
      // Re-enqueue the existing job to continue processing
      await this.queue.enqueue(job.id, repo.id);
      
      console.log(`✅ [DEBUG] Job ${job.id} re-enqueued successfully`);
      return { job, reused: true };
    }

    // Create new job
    console.log(`🆕 [DEBUG] No existing job found, creating new job`);
    const createdJobData = await this.jobRepository.createJob({
      repositoryId: repo.id,
      requestedByUserId: input.requestedByUserId,
    });

    const job = new ImprovementJob(createdJobData);
    console.log(`📝 [DEBUG] New job created with ID: ${job.id}, status: ${job.status}`);

    // Enqueue for async processing
    console.log(`🔄 [DEBUG] Enqueuing new job ${job.id} for processing`);
    await this.queue.enqueue(job.id, repo.id);
    console.log(`✅ [DEBUG] Job ${job.id} enqueued successfully`);

    console.log(`✨ Created job ${job.id} for ${repo.owner}/${repo.name}`);

    return { job, reused: false };
  }
}
