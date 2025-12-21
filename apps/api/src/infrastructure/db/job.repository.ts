import { randomUUID } from 'crypto';
import {
  createJob,
  failJob,
  ImprovementJob,
  ImprovementJobStatus,
  startJob,
  succeedJob,
} from '@domain/improvementJob';

export interface CreateJobRecordInput {
  repositoryId: string;
  targetFilePath: string;
  requestedByUserId: string;
  isAdmin: boolean;
}

export class JobRepository {
  private jobs: ImprovementJob[] = [];

  async findById(id: string): Promise<ImprovementJob | undefined> {
    return this.jobs.find((job) => job.id === id);
  }

  async findOpenByRepoAndFile(repositoryId: string, filePath: string): Promise<ImprovementJob | undefined> {
    return this.jobs.find(
      (job) =>
        job.repositoryId === repositoryId &&
        job.targetFilePath === filePath &&
        (job.status === 'queued' || job.status === 'running'),
    );
  }

  async createJob(input: CreateJobRecordInput): Promise<ImprovementJob> {
    const id = randomUUID();
    const job = createJob(id, {
      repositoryId: input.repositoryId,
      targetFilePath: input.targetFilePath,
      requestedByUserId: input.requestedByUserId,
      isAdmin: input.isAdmin,
    });
    this.jobs.push(job);
    return job;
  }

  async updateStatus(id: string, status: ImprovementJobStatus, payload?: Partial<ImprovementJob>): Promise<ImprovementJob> {
    const job = await this.findById(id);
    if (!job) {
      throw new Error('Job not found');
    }
    let next: ImprovementJob;
    if (status === 'running') next = startJob(job);
    else if (status === 'succeeded')
      next = succeedJob(job, payload?.pullRequestUrl ?? '', payload?.pullRequestNumber ?? undefined);
    else if (status === 'failed') next = failJob(job, payload?.failureCode ?? 'UNKNOWN', payload?.failureMessage ?? '');
    else next = job;

    this.jobs = this.jobs.map((j) => (j.id === id ? { ...next, ...payload } : j));
    return this.jobs.find((j) => j.id === id)!;
  }
}

