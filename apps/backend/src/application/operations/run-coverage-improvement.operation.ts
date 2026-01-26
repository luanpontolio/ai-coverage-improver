import { Injectable } from '@nestjs/common';
import { JobRepository } from '../../infrastructure/db/job.repository';
import { RepositoryRepository } from '../../infrastructure/db/repository.repository';
import { ImprovementJob, FailureCode } from '../../domain/improvement-job';
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
 * Phase 2: AI Processing (TODO: not implemented yet)
 */
@Injectable()
export class RunCoverageImprovementOperation {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly repositoryRepository: RepositoryRepository,
  ) {}

  async execute(input: RunCoverageImprovementInput): Promise<RunCoverageImprovementOutput> {
    const jobData = await this.jobRepository.findById(input.jobId);
    if (!jobData) {
      throw new Error(`Job ${input.jobId} not found`);
    }

    const job = new ImprovementJob(jobData);
    console.log(`\n🚀 Starting job ${job.id}`);

    job.markAsCloning();
    await this.jobRepository.updateStatus(job.id, 'cloning', {
      startedAt: job.startedAt,
    });

    try {
      console.log('=============== job.repositoryId ===============', job.repositoryId);
      const repo = await this.repositoryRepository.findById(job.repositoryId);
      if (!repo) {
        throw new Error('INVALID_REPOSITORY: Repository not found in database');
      }

      console.log(`📦 Repository: ${repo.owner}/${repo.name}`);
      console.log(`🌿 Default branch: ${repo.defaultBranch}`);

      // Clone repository
      const clonePath = await this.cloneRepository(job.repositoryId, repo.owner, repo.name);

      console.log(`✅ Repository cloned successfully`);
      console.log(`📁 Clone path: ${clonePath}`);

      // Mark as cloned
      job.markAsCloned(clonePath);
      await this.jobRepository.updateStatus(job.id, 'cloned', {
        clonePath: job.clonePath,
        clonedAt: job.clonedAt,
      });

      console.log(`✨ Job ${job.id} completed clone phase`);
      console.log(`🤖 Ready for AI processing (not implemented yet)\n`);

      return { job };
    } catch (err) {
      console.error(`❌ Job ${job.id} failed:`, err);

      // Categorize error
      const { code, message } = this.categorizeError(err);

      // Mark job as failed
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
   * Clone repository to local filesystem
   * Path: {pwd}/tmp/improvement-jobs/{repositoryId}
   */
  private async cloneRepository(
    repositoryId: string,
    owner: string,
    repo: string,
  ): Promise<string> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_AUTH_FAILED: GITHUB_TOKEN not configured');
    }

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
