/**
 * Domain entity representing a coverage improvement job
 */
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type FailureCode =
  | 'REPO_NOT_FOUND'
  | 'REPO_CLONE_FAILED'
  | 'FILE_NOT_FOUND'
  | 'INVALID_FILE_TYPE'
  | 'AI_GENERATION_FAILED'
  | 'TESTS_VALIDATION_FAILED'
  | 'PR_CREATION_FAILED'
  | 'GITHUB_AUTH_FAILED'
  | 'UNKNOWN';

export interface ImprovementJobProps {
  id: string;
  repositoryId: string;
  targetFilePath: string;
  status: JobStatus;
  requestedByUserId: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  failureCode?: FailureCode;
  failureMessage?: string;
}

/**
 * Domain entity for an improvement job
 * Encapsulates business rules for job lifecycle
 */
export class ImprovementJob {
  constructor(private props: ImprovementJobProps) {}

  get id(): string {
    return this.props.id;
  }

  get repositoryId(): string {
    return this.props.repositoryId;
  }

  get targetFilePath(): string {
    return this.props.targetFilePath;
  }

  get status(): JobStatus {
    return this.props.status;
  }

  get requestedByUserId(): string {
    return this.props.requestedByUserId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }

  get finishedAt(): Date | undefined {
    return this.props.finishedAt;
  }

  get pullRequestUrl(): string | undefined {
    return this.props.pullRequestUrl;
  }

  get pullRequestNumber(): number | undefined {
    return this.props.pullRequestNumber;
  }

  get failureCode(): FailureCode | undefined {
    return this.props.failureCode;
  }

  get failureMessage(): string | undefined {
    return this.props.failureMessage;
  }

  /**
   * Check if job is in an open state (queued or running)
   */
  isOpen(): boolean {
    return this.props.status === 'queued' || this.props.status === 'running';
  }

  /**
   * Check if job is completed (succeeded or failed)
   */
  isCompleted(): boolean {
    return this.props.status === 'succeeded' || this.props.status === 'failed';
  }

  /**
   * Mark job as running
   */
  markAsRunning(): void {
    if (this.props.status !== 'queued') {
      throw new Error('Can only start a queued job');
    }
    this.props.status = 'running';
    this.props.startedAt = new Date();
  }

  /**
   * Mark job as succeeded
   */
  markAsSucceeded(pullRequestUrl: string, pullRequestNumber: number): void {
    if (this.props.status !== 'running') {
      throw new Error('Can only succeed a running job');
    }
    this.props.status = 'succeeded';
    this.props.finishedAt = new Date();
    this.props.pullRequestUrl = pullRequestUrl;
    this.props.pullRequestNumber = pullRequestNumber;
  }

  /**
   * Mark job as failed
   */
  markAsFailed(failureCode: FailureCode, failureMessage: string): void {
    if (this.props.status !== 'running') {
      throw new Error('Can only fail a running job');
    }
    this.props.status = 'failed';
    this.props.finishedAt = new Date();
    this.props.failureCode = failureCode;
    this.props.failureMessage = failureMessage;
  }

  /**
   * Validate target file path
   */
  static validateTargetFilePath(filePath: string): void {
    if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
      throw new Error('filePath is required and must be a non-empty string');
    }

    if (!filePath.endsWith('.ts')) {
      throw new Error('filePath must be a TypeScript file (.ts extension)');
    }

    if (filePath.endsWith('.test.ts')) {
      throw new Error('filePath cannot be a test file');
    }
  }

  /**
   * Normalize file path (remove leading slash if present)
   */
  static normalizeFilePath(filePath: string): string {
    return filePath.startsWith('/') ? filePath.substring(1) : filePath;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): ImprovementJobProps {
    return { ...this.props };
  }
}

