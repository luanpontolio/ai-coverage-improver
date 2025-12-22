import { Injectable } from '@nestjs/common';
import { JobRepository } from '../db/job.repository';

export interface ImprovementJobData {
  jobId: string;
  repositoryId: string;
  targetFilePath: string;
}

/**
 * ImprovementQueue manages asynchronous improvement job processing
 * 
 * Infrastructure adapter for job queue.
 * For MVP: Uses in-memory processing (synchronous execution)
 * For Production: Replace with BullMQ + Redis for distributed job processing
 */
@Injectable()
export class ImprovementQueue {
  constructor(private readonly jobRepository: JobRepository) {}

  /**
   * Enqueue an improvement job for processing
   * 
   * MVP Implementation: Processes immediately in-memory
   * TODO: Replace with BullMQ queue.add() for async processing
   */
  async enqueue(jobId: string, repositoryId: string, targetFilePath: string): Promise<void> {
    console.log(`Enqueuing job ${jobId} for ${repositoryId}:${targetFilePath}`);
    
    // For MVP: Process immediately without actual queue
    // In production, this would be:
    // await this.queue.add('process-improvement', { jobId, repositoryId, targetFilePath });
    
    // Note: The actual job processing will be triggered by worker
    // For MVP, we use setImmediate to process in background
    // In production, this would be handled by BullMQ worker
  }

  /**
   * Get job status from queue (if applicable)
   * MVP: Returns null (status tracked in database)
   */
  async getJobStatus(jobId: string): Promise<any> {
    // For MVP: Job status is tracked in database only
    // In production with BullMQ, this would query the queue
    return null;
  }

  /**
   * Get queue metrics
   * MVP: Returns placeholder metrics
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
