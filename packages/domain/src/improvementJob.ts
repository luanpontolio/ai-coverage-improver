export type ImprovementJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ImprovementJob {
  id: string;
  repositoryId: string;
  targetFilePath: string;
  status: ImprovementJobStatus;
  requestedByUserId: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  failureCode?: string;
  failureMessage?: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
}

export interface CreateJobInput {
  repositoryId: string;
  targetFilePath: string;
  requestedByUserId: string;
  isAdmin: boolean;
}

export const assertAdmin = (isAdmin: boolean) => {
  if (!isAdmin) {
    throw new Error('Admin required to request improvements');
  }
};

export const createJob = (id: string, input: CreateJobInput): ImprovementJob => {
  assertAdmin(input.isAdmin);
  return {
    id,
    repositoryId: input.repositoryId,
    targetFilePath: input.targetFilePath,
    requestedByUserId: input.requestedByUserId,
    status: 'queued',
    createdAt: new Date(),
  };
};

export const startJob = (job: ImprovementJob): ImprovementJob => {
  return { ...job, status: 'running', startedAt: job.startedAt ?? new Date() };
};

export const succeedJob = (job: ImprovementJob, prUrl: string, prNumber?: number): ImprovementJob => {
  return {
    ...job,
    status: 'succeeded',
    finishedAt: new Date(),
    pullRequestUrl: prUrl,
    pullRequestNumber: prNumber,
    failureCode: undefined,
    failureMessage: undefined,
  };
};

export const failJob = (job: ImprovementJob, failureCode: string, failureMessage: string): ImprovementJob => {
  return {
    ...job,
    status: 'failed',
    finishedAt: new Date(),
    failureCode,
    failureMessage,
  };
};

