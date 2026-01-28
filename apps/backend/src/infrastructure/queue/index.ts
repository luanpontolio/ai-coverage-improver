import { Injectable } from '@nestjs/common';
import { JobRepository } from '../db/job.repository';
import { RepositoryRepository } from '../db/repository.repository';
import { CoverageRepository } from '../db/coverage.repository';
import { AIExecutionRepository } from '../db/ai-execution.repository';
import { CoverageSourceAdapter } from '../github/coverage-source.adapter';
import { LLMAdapter } from '../llm/llm.adapter';
import { AppConfigService } from '../../config/config.service';
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
    private readonly coverageRepository: CoverageRepository,
    private readonly aiExecutionRepository: AIExecutionRepository,
    private readonly coverageSourceAdapter: CoverageSourceAdapter,
    private readonly llmAdapter: LLMAdapter,
    private readonly configService: AppConfigService,
  ) {}

  /**
   * Enqueue an improvement job for processing
   *
   * MVP Implementation: Processes asynchronously in background
   * TODO: Replace with BullMQ queue.add() for distributed processing
   */
  async enqueue(jobId: string, repositoryId: string): Promise<void> {
    console.log(`📤 [DEBUG] ImprovementQueue.enqueue() called`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Repository ID: ${repositoryId}`);

    // Process job asynchronously in the background
    // Using setImmediate to not block the request response
    setImmediate(async () => {
      try {
        console.log(`\n🚀 [DEBUG] Starting background processing for job ${jobId}`);
        console.log(`⏰ [DEBUG] Time: ${new Date().toISOString()}`);
        
        await processImprovementJob(
          jobId,
          this.jobRepository,
          this.repositoryRepository,
          this.coverageRepository,
          this.aiExecutionRepository,
          this.coverageSourceAdapter,
          this.llmAdapter,
          this.configService,
        );
        
        console.log(`\n✅ [DEBUG] Job ${jobId} processing completed`);
        console.log(`⏰ [DEBUG] Time: ${new Date().toISOString()}`);
      } catch (error) {
        console.error(`\n❌ [DEBUG] Failed to process job ${jobId}:`, error);
        console.error(`🔍 [DEBUG] Error stack:`, error instanceof Error ? error.stack : error);
      }
    });
    
    console.log(`✅ [DEBUG] Job ${jobId} scheduled for background processing (setImmediate)`);
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
