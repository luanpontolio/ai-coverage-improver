import { Injectable } from '@nestjs/common';
import { JobRepository } from '../infrastructure/db/job.repository';
import { processImprovementJob } from '../workers/improvement.worker';

@Injectable()
export class ImprovementQueue {
  constructor(private readonly jobRepository: JobRepository) {}

  async enqueue(jobId: string) {
    // In-memory "queue": process immediately for MVP
    await processImprovementJob(jobId, this.jobRepository);
  }
}

