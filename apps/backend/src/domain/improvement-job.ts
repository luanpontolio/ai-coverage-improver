/**
 * Domain entity representing a coverage improvement job
 * Phase 1: Clone repository
 * Phase 2: Analyze coverage to identify files below threshold
 * Phase 3: Generate tests in batch using LLM
 */
export type JobStatus =
  // Fase 1: Setup
  | 'queued'           // Job criado
  | 'cloning'          // Clonando repositório
  | 'cloned'           // Clone concluído
  // Fase 2: Analysis
  | 'analyzing'        // Identificando arquivos < 80%
  | 'analyzed'         // Lista de arquivos pronta
  // Fase 3: Test Generation
  | 'processing'       // Gerando testes em batch
  // Estados finais
  | 'succeeded'        // Todos os testes gerados com sucesso
  | 'failed'           // Falhou completamente
  | 'partial_success'; // Alguns arquivos geraram, outros falharam

export type FailureCode =
  | 'REPO_NOT_FOUND'
  | 'REPO_CLONE_FAILED'
  | 'GITHUB_AUTH_FAILED'
  | 'INVALID_REPOSITORY'
  | 'NO_FILES_TO_IMPROVE'
  | 'LLM_GENERATION_FAILED'
  | 'UNKNOWN';

export interface ImprovementJobProps {
  id: string;
  repositoryId: string;
  status: JobStatus;

  // Fase 1: Clone
  clonePath?: string;
  clonedAt?: Date;

  // Fase 2: Analysis
  analyzedAt?: Date;
  targetFilesCount?: number;

  // Fase 3: Test Generation
  processingStartedAt?: Date;
  filesProcessed?: number;
  filesSucceeded?: number;
  filesFailed?: number;

  // Metadata
  requestedByUserId: string;
  createdAt: Date;
  startedAt?: Date;
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

  get analyzedAt(): Date | undefined {
    return this.job.analyzedAt;
  }

  get targetFilesCount(): number | undefined {
    return this.job.targetFilesCount;
  }

  get processingStartedAt(): Date | undefined {
    return this.job.processingStartedAt;
  }

  get filesProcessed(): number | undefined {
    return this.job.filesProcessed;
  }

  get filesSucceeded(): number | undefined {
    return this.job.filesSucceeded;
  }

  get filesFailed(): number | undefined {
    return this.job.filesFailed;
  }

  /**
   * Check if job is in an open state (not completed)
   */
  isOpen(): boolean {
    return !['succeeded', 'failed', 'partial_success'].includes(this.job.status);
  }

  /**
   * Check if job is completed (succeeded or failed)
   */
  isCompleted(): boolean {
    return ['succeeded', 'failed', 'partial_success'].includes(this.job.status);
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
   * Mark job as analyzing
   */
  markAsAnalyzing(): void {
    if (this.job.status !== 'cloned') {
      throw new Error('Can only analyze after clone');
    }
    this.job.status = 'analyzing';
    this.job.analyzedAt = new Date();
  }

  /**
   * Análise concluída
   */
  markAsAnalyzed(fileCount: number): void {
    if (this.job.status !== 'analyzing') {
      throw new Error('Can only mark analyzed after analyzing');
    }
    if (fileCount === 0) {
      throw new Error('NO_FILES_TO_IMPROVE: No files below threshold');
    }
    this.job.status = 'analyzed';
    this.job.targetFilesCount = fileCount;
  }

  /**
   * Iniciar processamento em batch
   */
  markAsProcessing(): void {
    if (this.job.status !== 'analyzed') {
      throw new Error('Can only start processing after analysis');
    }
    this.job.status = 'processing';
    this.job.processingStartedAt = new Date();
    this.job.filesProcessed = 0;
    this.job.filesSucceeded = 0;
    this.job.filesFailed = 0;
  }

  /**
   * Atualizar progresso
   */
  incrementProgress(success: boolean): void {
    if (this.job.status !== 'processing') {
      throw new Error('Can only increment during processing');
    }
    this.job.filesProcessed = (this.job.filesProcessed || 0) + 1;
    if (success) {
      this.job.filesSucceeded = (this.job.filesSucceeded || 0) + 1;
    } else {
      this.job.filesFailed = (this.job.filesFailed || 0) + 1;
    }
  }

  /**
   * Marcar como sucesso
   */
  markAsSucceeded(): void {
    if (this.job.status !== 'processing') {
      throw new Error('Can only succeed after processing');
    }
    const failed = this.job.filesFailed ?? 0;
    const succeeded = this.job.filesSucceeded ?? 0;
    if (failed === 0) {
      this.job.status = 'succeeded';
    } else if (succeeded > 0) {
      this.job.status = 'partial_success';
    } else {
      throw new Error('No files succeeded, cannot mark as success');
    }
    this.job.finishedAt = new Date();
  }

  /**
   * Calcular progresso %
   */
  getProgressPercentage(): number {
    if (!this.job.targetFilesCount) return 0;
    return Math.round(((this.job.filesProcessed || 0) / this.job.targetFilesCount) * 100);
  }

  /**
   * Resumo do batch
   */
  getBatchSummary(): string {
    const total = this.job.targetFilesCount || 0;
    const succeeded = this.job.filesSucceeded || 0;
    const failed = this.job.filesFailed || 0;
    return `${succeeded}/${total} succeeded, ${failed} failed`;
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
