import { Injectable } from '@nestjs/common';
import { JobRepository } from '../db/job.repository';
import { RepositoryRepository } from '../db/repository.repository';
import { processImprovementJob } from '../../workers/improvement.worker';

export interface ImprovementJobData {
  jobId: string;
  repositoryId: string;
  targetFilePath: string;
}

/**
 * ImprovementQueue manages asynchronous improvement job processing
 * 
 * Infrastructure adapter for job queue.
 * For MVP: Uses in-memory async processing
 * For Production: Replace with BullMQ + Redis for distributed job processing
 */
@Injectable()
export class ImprovementQueue {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly repositoryRepository: RepositoryRepository,
  ) {}

  /**
   * Enqueue an improvement job for processing
   *
   * MVP Implementation: Processes asynchronously in background
   * TODO: Replace with BullMQ queue.add() for distributed processing
   */
  async enqueue(jobId: string, repositoryId: string): Promise<void> {
    console.log(`📤 Enqueuing job ${jobId} for repository ${repositoryId}`);

    // Process job asynchronously in the background
    // Using setImmediate to not block the request response
    setImmediate(async () => {
      try {
        console.log(`🚀 Starting background processing for job ${jobId}`);
        await processImprovementJob(jobId, this.jobRepository, this.repositoryRepository);
        console.log(`✅ Job ${jobId} processing completed`);
      } catch (error) {
        console.error(`❌ Failed to process job ${jobId}:`, error);
      }
    });
  }

  /**
   * Get job status from queue (if applicable)
   * MVP: Returns job from database
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.jobRepository.findById(jobId);
    return job;
  }

  /**
   * Get queue metrics
   * MVP: Returns placeholder metrics
   * TODO: Implement real metrics from database
   */
  async getQueueMetrics() {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
}
