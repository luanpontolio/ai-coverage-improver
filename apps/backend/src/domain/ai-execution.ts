/**
 * Domain entity representing an AI execution for a specific file
 * Each execution tracks the LLM test generation for one file
 */
export type AIExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AIExecutionProps {
  id: string;
  jobId: string;
  targetFilePath: string;
  agentType: string; // 'test-generator'

  status: AIExecutionStatus;
  startedAt: Date;
  finishedAt?: Date;

  testFilePath?: string;
  confidence?: number;
  uncoveredLinesBefore?: number;

  errorCode?: string;
  errorMessage?: string;
  metadata?: string;
}

/**
 * Domain entity for an AI execution
 * Tracks individual file processing within a batch job
 */
export class AIExecution {
  private execution: AIExecutionProps;

  constructor(private props: AIExecutionProps) {
    this.execution = props;
  }

  get id(): string {
    return this.execution.id;
  }

  get jobId(): string {
    return this.execution.jobId;
  }

  get targetFilePath(): string {
    return this.execution.targetFilePath;
  }

  get agentType(): string {
    return this.execution.agentType;
  }

  get status(): AIExecutionStatus {
    return this.execution.status;
  }

  get startedAt(): Date {
    return this.execution.startedAt;
  }

  get finishedAt(): Date | undefined {
    return this.execution.finishedAt;
  }

  get testFilePath(): string | undefined {
    return this.execution.testFilePath;
  }

  get confidence(): number | undefined {
    return this.execution.confidence;
  }

  get uncoveredLinesBefore(): number | undefined {
    return this.execution.uncoveredLinesBefore;
  }

  get errorCode(): string | undefined {
    return this.execution.errorCode;
  }

  get errorMessage(): string | undefined {
    return this.execution.errorMessage;
  }

  get metadata(): string | undefined {
    return this.execution.metadata;
  }

  /**
   * Check if execution is completed (success or failed)
   */
  isCompleted(): boolean {
    return this.execution.status === 'completed' || this.execution.status === 'failed';
  }

  /**
   * Check if execution was successful
   */
  isSuccessful(): boolean {
    return this.execution.status === 'completed';
  }

  /**
   * Mark execution as running
   */
  markAsRunning(): void {
    if (this.execution.status !== 'pending') {
      throw new Error('Can only start running a pending execution');
    }
    this.execution.status = 'running';
  }

  /**
   * Mark execution as completed
   */
  markAsCompleted(
    testFilePath: string,
    confidence: number,
    uncoveredLinesBefore: number,
  ): void {
    if (this.execution.status !== 'running') {
      throw new Error('Can only complete a running execution');
    }
    this.execution.status = 'completed';
    this.execution.testFilePath = testFilePath;
    this.execution.confidence = confidence;
    this.execution.uncoveredLinesBefore = uncoveredLinesBefore;
    this.execution.finishedAt = new Date();
  }

  /**
   * Mark execution as failed
   */
  markAsFailed(errorCode: string, errorMessage: string): void {
    if (this.execution.status !== 'running') {
      throw new Error('Can only fail a running execution');
    }
    this.execution.status = 'failed';
    this.execution.errorCode = errorCode;
    this.execution.errorMessage = errorMessage;
    this.execution.finishedAt = new Date();
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): AIExecutionProps {
    return { ...this.execution };
  }
}
