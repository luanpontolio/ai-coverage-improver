import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RunCoverageImprovementOperation } from '../application/operations/run-coverage-improvement.operation';

export interface ImprovementJobData {
  jobId: string;
  repositoryId: string;
}

/**
 * Consumer: Processes improvement jobs from BullMQ queue
 * 
 * Responsible for consuming jobs from the 'improvement' queue
 * and executing RunCoverageImprovementOperation.
 * 
 * Replaces the old improvement.worker.ts (which used setImmediate).
 * 
 * SAFETY RULES (enforced by operation):
 * 1. Only operates on default branch
 * 2. Only creates/modifies *.test.ts files
 * 3. Never executes tests
 * 4. Never auto-merges PRs
 * 5. Isolated execution environment
 */
@Processor('improvement', {
  concurrency: 2, // Process up to 2 jobs simultaneously
  limiter: {
    max: 10, // Maximum 10 jobs per...
    duration: 60000, // ...1 minute (rate limiting)
  },
})
export class ImprovementConsumer extends WorkerHost {
  private readonly logger = new Logger(ImprovementConsumer.name);

  constructor(
    // Inject operation with all dependencies via NestJS DI
    private readonly runCoverageImprovementOperation: RunCoverageImprovementOperation,
  ) {
    super();
  }

  /**
   * Process a job from the queue
   * 
   * BullMQ automatically:
   * - Marks job as 'active'
   * - Retries on failure (per configuration)
   * - Marks as 'completed' or 'failed'
   * - Removes job according to retention policy
   */
  async process(job: Job<ImprovementJobData>): Promise<void> {
    this.logger.log(
      `🔧 Processing job ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`
    );
    this.logger.debug(`Job data:`, job.data);

    try {
      // Execute operation (all business logic is here)
      await this.runCoverageImprovementOperation.execute({
        jobId: job.data.jobId,
      });

      this.logger.log(`✅ Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`❌ Job ${job.id} failed:`, error);
      
      // BullMQ will automatically retry
      // If max attempts exceeded, job goes to 'failed' state
      throw error; // Re-throw for BullMQ to handle
    }
  }

  /**
   * Event: Job entered 'active' state
   */
  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`🚀 Job ${job.id} is now active`);
  }

  /**
   * Event: Job completed successfully
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`✅ Job ${job.id} completed`);
  }

  /**
   * Event: Job failed (after all attempts)
   */
  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error) {
    if (job) {
      this.logger.error(
        `❌ Job ${job.id} failed after ${job.attemptsMade} attempts`
      );
      this.logger.error(`Error: ${error.message}`);
      
      // Here you can add additional logic:
      // - Send notification
      // - Save detailed error to database
      // - Create incident ticket
    }
  }

  /**
   * Event: Job progress updated (if you use job.updateProgress())
   */
  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.debug(`📊 Job ${job.id} progress:`, progress);
  }

  /**
   * Event: Worker is starting to stall (taking too long)
   */
  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`⚠️  Job ${jobId} has stalled`);
  }
}
