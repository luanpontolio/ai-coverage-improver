/**
 * Domain entity representing a coverage improvement job
 * Phase 1: Clone repository
 * Phase 2: AI Processing (to be implemented)
 */
export type JobStatus = 'queued' | 'cloning' | 'cloned' | 'succeeded' | 'failed';

export type FailureCode =
  | 'REPO_NOT_FOUND'
  | 'REPO_CLONE_FAILED'
  | 'GITHUB_AUTH_FAILED'
  | 'INVALID_REPOSITORY'
  | 'UNKNOWN';

export interface ImprovementJobProps {
  id: string;
  repositoryId: string;
  status: JobStatus;
  clonePath?: string;
  requestedByUserId: string;
  createdAt: Date;
  startedAt?: Date;
  clonedAt?: Date;
  finishedAt?: Date;
  failureCode?: FailureCode;
  failureMessage?: string;
}

/**
 * Domain entity for an improvement job
 * Simplified to focus on repository cloning first
 */
export class ImprovementJob {
  private job: ImprovementJobProps;
  constructor(private props: ImprovementJobProps) {
    this.job = props;
  }

  get id(): string {
    return this.job.id;
  }

  get repositoryId(): string {
    return this.job.repositoryId;
  }

  get status(): JobStatus {
    return this.job.status;
  }

  get clonePath(): string | undefined {
    return this.job.clonePath;
  }

  get requestedByUserId(): string {
    return this.job.requestedByUserId;
  }

  get createdAt(): Date {
    return this.job.createdAt;
  }

  get startedAt(): Date | undefined {
    return this.job.startedAt;
  }

  get clonedAt(): Date | undefined {
    return this.job.clonedAt;
  }

  get finishedAt(): Date | undefined {
    return this.job.finishedAt;
  }

  get failureCode(): FailureCode | undefined {
    return this.job.failureCode;
  }

  get failureMessage(): string | undefined {
    return this.job.failureMessage;
  }

  /**
   * Check if job is in an open state (not completed)
   */
  isOpen(): boolean {
    return ['queued', 'cloning', 'cloned'].includes(this.job.status);
  }

  /**
   * Check if job is completed (succeeded or failed)
   */
  isCompleted(): boolean {
    return this.job.status === 'succeeded' || this.job.status === 'failed';
  }

  /**
   * Mark job as cloning
   */
  markAsCloning(): void {
    if (this.job.status !== 'queued') {
      throw new Error('Can only start cloning a queued job');
    }
    this.job.status = 'cloning';
    this.job.startedAt = new Date();
  }

  /**
   * Mark job as cloned
   */
  markAsCloned(clonePath: string): void {
    if (this.job.status !== 'cloning') {
      throw new Error('Can only mark as cloned a cloning job');
    }
    this.job.status = 'cloned';
    this.job.clonedAt = new Date();
    this.job.clonePath = clonePath;
  }

  /**
   * Mark job as failed
   */
  markAsFailed(failureCode: FailureCode, failureMessage: string): void {
    this.job.status = 'failed';
    this.job.finishedAt = new Date();
    this.job.failureCode = failureCode;
    this.job.failureMessage = failureMessage;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): ImprovementJobProps {
    return { ...this.job };
  }
}
