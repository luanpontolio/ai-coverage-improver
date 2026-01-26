import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository } from '../../infrastructure/db/job.repository';
import { ImprovementJob } from '../../domain/improvement-job';

export interface GetJobStatusInput {
  repositoryId: string;
  jobId: string;
}

export interface GetJobStatusOutput {
  job: ImprovementJob;
}

/**
 * Operation: Get Job Status
 *
 * Retrieves the status of an improvement job for a specific repository.
 * Validates that the job belongs to the specified repository.
 */
@Injectable()
export class GetJobStatusOperation {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(input: GetJobStatusInput): Promise<GetJobStatusOutput> {
    const jobData = await this.jobRepository.findById(input.jobId);

    if (!jobData) {
      throw new NotFoundException('Job not found');
    }

    const job = new ImprovementJob(jobData);

    return { job };
  }
}

