import { Injectable } from '@nestjs/common';
import { JobRepository } from '../../infrastructure/db/job.repository';
import { RepositoryRepository } from '../../infrastructure/db/repository.repository';
import { CoverageRepository } from '../../infrastructure/db/coverage.repository';
import { AIExecutionRepository } from '../../infrastructure/db/ai-execution.repository';
import { ImprovementJob, FailureCode } from '../../domain/improvement-job';
import { AIExecutionProps } from '../../domain/ai-execution';
import { AppConfigService } from '../../config/config.service';
import { GenerateTestsWithAIOperation } from './generate-tests-with-ai.operation';
import { CoverageSourceAdapter } from '../../infrastructure/github/coverage-source.adapter';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RunCoverageImprovementInput {
  jobId: string;
}

export interface RunCoverageImprovementOutput {
  job: ImprovementJob;
}

/**
 * Operation: Run Coverage Improvement
 *
 * Phase 1: Clone repository from GitHub
 * Phase 2: Analyze coverage to identify files below threshold
 * Phase 3: Generate tests in batch using LLM
 */
@Injectable()
export class RunCoverageImprovementOperation {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly repositoryRepository: RepositoryRepository,
    private readonly coverageRepository: CoverageRepository,
    private readonly aiExecutionRepository: AIExecutionRepository,
    private readonly generateTestsOperation: GenerateTestsWithAIOperation,
    private readonly coverageSourceAdapter: CoverageSourceAdapter,
    private readonly configService: AppConfigService,
  ) {}

  async execute(input: RunCoverageImprovementInput): Promise<RunCoverageImprovementOutput> {
    console.log(`\n🎬 [DEBUG] RunCoverageImprovementOperation.execute() called for job ${input.jobId}`);
    
    let jobData = await this.jobRepository.findById(input.jobId);
    if (!jobData) {
      throw new Error(`Job ${input.jobId} not found`);
    }

    let job = new ImprovementJob(jobData);
    console.log(`📊 [DEBUG] Initial job status: ${job.status}`);

    try {
      // Execute all phases in sequence until completion
      let iteration = 0;
      while (!job.isCompleted()) {
        iteration++;
        console.log(`\n🔄 [DEBUG] Loop iteration ${iteration}, current status: ${job.status}`);
        
        // Reload job to get latest status
        const currentJobData = await this.jobRepository.findById(input.jobId);
        if (!currentJobData) {
          throw new Error(`Job ${input.jobId} not found`);
        }
        job = new ImprovementJob(currentJobData);
        console.log(`📡 [DEBUG] Reloaded job from DB, status: ${job.status}`);

        // ==================
        // FASE 1: CLONE
        // ==================
        if (job.status === 'queued') {
          console.log(`📦 [DEBUG] Starting Phase 1: Clone`);
          await this.phaseClone(job);
          console.log(`✅ [DEBUG] Phase 1 complete, continuing to next phase`);
          continue; // Continue to next phase
        }

        // ==================
        // FASE 2: ANALYSIS
        // ==================
        if (job.status === 'cloned') {
          console.log(`📊 [DEBUG] Starting Phase 2: Analysis`);
          await this.phaseAnalysis(job);
          console.log(`✅ [DEBUG] Phase 2 complete, continuing to next phase`);
          continue; // Continue to next phase
        }

        // ==================
        // FASE 3: BATCH PROCESSING
        // ==================
        if (job.status === 'analyzed') {
          console.log(`🤖 [DEBUG] Starting Phase 3: Batch Processing`);
          await this.phaseBatchProcessing(job);
          console.log(`✅ [DEBUG] Phase 3 complete, continuing to finalization`);
          continue; // Continue to finalization
        }

        // ==================
        // FINALIZAÇÃO
        // ==================
        if (job.status === 'processing') {
          console.log(`🏁 [DEBUG] Starting Finalization`);
          job.markAsSucceeded();
          await this.jobRepository.updateStatus(job.id, job.status, {
            finishedAt: job.finishedAt,
          });

          console.log(`\n✅ Job ${job.id} completed!`);
          console.log(`   ${job.getBatchSummary()}`);
          console.log(`   Test files saved in: ${job.clonePath}`);
          console.log(`🎉 [DEBUG] Job fully completed and finalized`);
          break; // Exit loop
        }

        // If we reach here, job is in an unexpected state
        console.log(`⚠️ [DEBUG] Unexpected job status: ${job.status}, breaking loop`);
        break;
      }

      console.log(`🎬 [DEBUG] RunCoverageImprovementOperation.execute() completed for job ${job.id}`);
      return { job };
    } catch (err) {
      console.error(`❌ [DEBUG] Job ${job.id} failed:`, err);
      console.error(`🔍 [DEBUG] Error details:`, err instanceof Error ? err.stack : err);
      const { code, message } = this.categorizeError(err);
      console.error(`🏷️ [DEBUG] Categorized as: ${code} - ${message}`);
      job.markAsFailed(code, message);
      await this.jobRepository.updateStatus(job.id, 'failed', {
        failureCode: job.failureCode,
        failureMessage: job.failureMessage,
        finishedAt: job.finishedAt,
      });
      return { job };
    }
  }

  /**
   * FASE 1: Clone Repository
   */
  private async phaseClone(job: ImprovementJob): Promise<void> {
    console.log(`\n📦 PHASE 1: Clone Repository`);
    console.log(`🔍 [DEBUG] phaseClone() called for job ${job.id}`);
    console.log(`📊 [DEBUG] Current job status before marking: ${job.status}`);

    job.markAsCloning();
    console.log(`📝 [DEBUG] Job marked as cloning, new status: ${job.status}`);
    
    await this.jobRepository.updateStatus(job.id, 'cloning', {
      startedAt: job.startedAt,
    });
    console.log(`💾 [DEBUG] Job status saved to DB: cloning`);

    const repo = await this.repositoryRepository.findById(job.repositoryId);
    if (!repo) {
      throw new Error('INVALID_REPOSITORY: Repository not found');
    }

    console.log(`📦 Repository: ${repo.owner}/${repo.name}`);
    console.log(`🌿 Default branch: ${repo.defaultBranch}`);

    const clonePath = await this.cloneRepository(job.repositoryId, repo.owner, repo.name);

    job.markAsCloned(clonePath);
    await this.jobRepository.updateStatus(job.id, 'cloned', {
      clonePath: job.clonePath,
      clonedAt: job.clonedAt,
    });

    console.log(`✅ Phase 1 complete: Repository cloned to ${clonePath}`);
  }

  /**
   * FASE 2: Análise - Identificar arquivos abaixo de 80%
   */
  private async phaseAnalysis(job: ImprovementJob): Promise<void> {
    console.log(`\n📊 PHASE 2: Analyzing Coverage`);
    console.log(`🔍 [DEBUG] phaseAnalysis() called for job ${job.id}`);
    console.log(`📊 [DEBUG] Current job status before marking: ${job.status}`);

    job.markAsAnalyzing();
    console.log(`📝 [DEBUG] Job marked as analyzing, new status: ${job.status}`);
    
    await this.jobRepository.updateStatus(job.id, 'analyzing', {
      analyzedAt: job.analyzedAt,
    });
    console.log(`💾 [DEBUG] Job status saved to DB: analyzing`);

    // Buscar arquivos abaixo do threshold (80%)
    const threshold = this.configService.coverage.thresholdPct;
    const filesBelowThreshold = await this.coverageRepository.getFilesBelowThreshold(
      job.repositoryId,
      threshold,
    );

    if (filesBelowThreshold.length === 0) {
      throw new Error('NO_FILES_TO_IMPROVE: All files meet coverage threshold');
    }

    console.log(`📋 Found ${filesBelowThreshold.length} files below ${threshold}%:`);
    filesBelowThreshold.slice(0, 5).forEach((file, idx) => {
      console.log(`   ${idx + 1}. ${file.filePath} (${file.coveragePct.toFixed(1)}%)`);
    });
    if (filesBelowThreshold.length > 5) {
      console.log(`   ... and ${filesBelowThreshold.length - 5} more`);
    }

    // Criar AIExecutions pendentes para cada arquivo
    for (const file of filesBelowThreshold) {
      await this.aiExecutionRepository.create({
        jobId: job.id,
        targetFilePath: file.filePath,
        agentType: 'test-generator',
        status: 'pending',
        metadata: JSON.stringify({
          currentCoverage: file.coveragePct,
          threshold: threshold,
        }),
      });
    }

    job.markAsAnalyzed(filesBelowThreshold.length);
    await this.jobRepository.updateStatus(job.id, 'analyzed', {
      targetFilesCount: job.targetFilesCount,
    });

    console.log(`✅ Phase 2 complete: ${filesBelowThreshold.length} files to process`);
  }

  /**
   * FASE 3: Batch Processing - Gerar testes para todos os arquivos
   */
  private async phaseBatchProcessing(job: ImprovementJob): Promise<void> {
    console.log(`\n🤖 PHASE 3: Batch Test Generation (${job.targetFilesCount} files)`);
    console.log(`🔍 [DEBUG] phaseBatchProcessing() called for job ${job.id}`);
    console.log(`📊 [DEBUG] Current job status before marking: ${job.status}`);

    job.markAsProcessing();
    console.log(`📝 [DEBUG] Job marked as processing, new status: ${job.status}`);
    
    await this.jobRepository.updateStatus(job.id, 'processing', {
      processingStartedAt: job.processingStartedAt,
      filesProcessed: 0,
      filesSucceeded: 0,
      filesFailed: 0,
    });
    console.log(`💾 [DEBUG] Job status saved to DB: processing`);

    // Buscar todas as execuções pendentes
    const pendingExecutions = await this.aiExecutionRepository.findPending(job.id);

    // Buscar LCOV uma vez
    const repo = await this.repositoryRepository.findById(job.repositoryId);
    if (!repo) {
      throw new Error('INVALID_REPOSITORY: Repository not found');
    }

    const repositoryId = `${repo.owner}/${repo.name}`;
    const coverageResult = await this.coverageSourceAdapter.fetchCoverageSource(
      repositoryId,
      repo.defaultBranch,
      this.configService.github.token,
    );

    const lcovContent = coverageResult.content;
    console.log(`📄 Coverage loaded: ${lcovContent.length} characters (${coverageResult.format})`);

    // Processar cada arquivo sequencialmente
    for (const execution of pendingExecutions) {
      await this.processOneFile(job, execution, lcovContent);
    }

    console.log(`\n✅ Phase 3 complete!`);
    console.log(`   ${job.getBatchSummary()}`);
  }

  /**
   * Processar um único arquivo
   */
  private async processOneFile(
    job: ImprovementJob,
    execution: AIExecutionProps,
    lcovContent: string,
  ): Promise<void> {
    const fileNum = (job.filesProcessed || 0) + 1;
    const total = job.targetFilesCount || 0;

    console.log(`\n[${fileNum}/${total}] Processing: ${execution.targetFilePath}`);

    // Marcar execução como rodando
    await this.aiExecutionRepository.updateStatus(execution.id, 'running');

    try {
      // Gerar testes com LLM
      const result = await this.generateTestsOperation.execute({
        clonePath: job.clonePath!,
        filePath: execution.targetFilePath,
        lcovContent,
      });

      console.log(`   ✅ Generated: ${result.testFilePath}`);
      console.log(`   📝 Code: ${result.testCode.length} chars`);
      console.log(`   📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   🎯 Covers: ${result.uncoveredLinesCount} uncovered lines`);

      // Marcar sucesso
      await this.aiExecutionRepository.complete(execution.id, {
        status: 'completed',
        testFilePath: result.testFilePath,
        confidence: result.confidence,
        uncoveredLinesBefore: result.uncoveredLinesCount,
        finishedAt: new Date(),
      });

      // Atualizar progresso do job
      job.incrementProgress(true);
      await this.jobRepository.updateStatus(job.id, 'processing', {
        filesProcessed: job.filesProcessed,
        filesSucceeded: job.filesSucceeded,
      });
    } catch (error) {
      console.error(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown'}`);

      // Marcar falha
      await this.aiExecutionRepository.complete(execution.id, {
        status: 'failed',
        errorCode: 'LLM_GENERATION_FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        finishedAt: new Date(),
      });

      // Atualizar progresso do job (falha não para o batch)
      job.incrementProgress(false);
      await this.jobRepository.updateStatus(job.id, 'processing', {
        filesProcessed: job.filesProcessed,
        filesFailed: job.filesFailed,
      });
    }

    // Log de progresso total
    const progress = job.getProgressPercentage();
    console.log(`   Progress: ${progress}% | ${job.getBatchSummary()}`);
  }

  /**
   * Clone repository to local filesystem
   * Path: {pwd}/tmp/improvement-jobs/{repositoryId}
   */
  private async cloneRepository(
    repositoryId: string,
    owner: string,
    repo: string,
  ): Promise<string> {
    const token = this.configService.github.token;

    // Create base directory for improvement jobs: {pwd}/tmp/improvement-jobs
    const baseDir = path.join(process.cwd(), 'tmp', 'improvement-jobs');
    await fs.mkdir(baseDir, { recursive: true });

    // Clone path: {pwd}/tmp/improvement-jobs/{repositoryId}
    const clonePath = path.join(baseDir, repositoryId);

    // Check if directory already exists and remove it
    try {
      await fs.access(clonePath);
      console.log(`🧹 Cleaning existing directory: ${clonePath}`);
      await fs.rm(clonePath, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, that's fine
    }

    // Clone with authentication
    const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;
    
    console.log(`📥 Cloning ${owner}/${repo}...`);
    
    try {
      await execAsync(
        `git clone --depth 1 --single-branch "${cloneUrl}" "${clonePath}"`,
        {
          cwd: baseDir,
        }
      );
    } catch (err) {
      throw new Error(
        `REPO_CLONE_FAILED: Failed to clone repository: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // Verify clone was successful
    try {
      await fs.access(path.join(clonePath, '.git'));
    } catch {
      throw new Error('REPO_CLONE_FAILED: Clone completed but .git directory not found');
    }

    // Get some stats about the cloned repository
    try {
      const stats = await fs.stat(clonePath);
      console.log(`📊 Clone completed at: ${stats.birthtime.toISOString()}`);
    } catch {
      // Stats are optional, don't fail if we can't get them
    }

    return clonePath;
  }

  /**
   * Categorize error for better user feedback
   */
  private categorizeError(err: unknown): { code: FailureCode; message: string } {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes('INVALID_REPOSITORY')) {
      return {
        code: 'INVALID_REPOSITORY',
        message: 'Repository not found in database',
      };
    }

    if (errorMessage.includes('REPO_CLONE_FAILED')) {
      return {
        code: 'REPO_CLONE_FAILED',
        message: errorMessage.replace('REPO_CLONE_FAILED: ', ''),
      };
    }

    if (errorMessage.includes('GITHUB_AUTH_FAILED') || errorMessage.includes('GITHUB_TOKEN')) {
      return {
        code: 'GITHUB_AUTH_FAILED',
        message: 'GitHub authentication failed. Please check GITHUB_TOKEN configuration.',
      };
    }

    if (errorMessage.includes('NO_FILES_TO_IMPROVE')) {
      return {
        code: 'NO_FILES_TO_IMPROVE',
        message: 'All files meet coverage threshold',
      };
    }

    if (errorMessage.includes('LLM_GENERATION_FAILED')) {
      return {
        code: 'LLM_GENERATION_FAILED',
        message: errorMessage.replace('LLM_GENERATION_FAILED: ', ''),
      };
    }

    if (errorMessage.includes('not found') || errorMessage.includes('Repository not found')) {
      return {
        code: 'REPO_NOT_FOUND',
        message: 'Repository not found on GitHub',
      };
    }

    return {
      code: 'UNKNOWN',
      message: `Unexpected error: ${errorMessage}`,
    };
  }
}
