import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface ImprovementJobData {
  jobId: string;
  repositoryId: string;
}

/**
 * Producer: Enqueues improvement jobs to BullMQ
 * 
 * Responsible for adding jobs to the BullMQ queue.
 * Processing is done by ImprovementConsumer.
 * 
 * Replaces the old ImprovementQueue (which used setImmediate).
 */
@Injectable()
export class ImprovementProducer {
  constructor(
    @InjectQueue('improvement') 
    private readonly improvementQueue: Queue<ImprovementJobData>,
  ) {}

  /**
   * Add job to queue for asynchronous processing
   * 
   * BullMQ will persist the job in Redis and process it
   * according to the queue configuration (concurrency, rate limiting, etc.)
   */
  async enqueue(jobId: string, repositoryId: string): Promise<void> {
    console.log(`📤 Enqueuing improvement job ${jobId}`);

    // Add job to Redis-backed queue
    const job = await this.improvementQueue.add(
      'process-improvement', // Job name/type
      {
        jobId,
        repositoryId,
      },
      {
        // Job-specific options (overrides defaults from root.module.ts)
        jobId: jobId, // Use our DB job ID as BullMQ job ID
        removeOnComplete: true, // Remove immediately after completion
        removeOnFail: false, // Keep failed jobs for debugging
      },
    );

    console.log(`✅ Job ${jobId} added to queue (BullMQ ID: ${job.id})`);
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.improvementQueue.getWaitingCount(),
      this.improvementQueue.getActiveCount(),
      this.improvementQueue.getCompletedCount(),
      this.improvementQueue.getFailedCount(),
      this.improvementQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Pause queue (useful for maintenance)
   */
  async pause(): Promise<void> {
    await this.improvementQueue.pause();
    console.log('⏸️  Queue paused');
  }

  /**
   * Resume queue
   */
  async resume(): Promise<void> {
    await this.improvementQueue.resume();
    console.log('▶️  Queue resumed');
  }

  /**
   * Clean completed jobs older than 24 hours
   */
  async cleanCompleted(): Promise<void> {
    await this.improvementQueue.clean(86400000, 100, 'completed');
    console.log('🧹 Cleaned completed jobs');
  }

  /**
   * Get job by ID from queue
   */
  async getJob(jobId: string) {
    return await this.improvementQueue.getJob(jobId);
  }
}
