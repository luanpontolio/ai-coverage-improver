import { Injectable } from '@nestjs/common';
import { JobRepository } from '../../infrastructure/db/job.repository';
import { createGitHubClient, createOrUpdatePullRequest } from '@github/pr';
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
 * Executes the complete workflow for generating test coverage improvements:
 * 1. Clone repository
 * 2. Validate target file
 * 3. Generate tests using AI
 * 4. Create pull request
 * 
 * This is the main business operation executed by workers.
 */
@Injectable()
export class RunCoverageImprovementOperation {
  constructor(private readonly jobRepository: JobRepository) {}

  async execute(input: RunCoverageImprovementInput): Promise<RunCoverageImprovementOutput> {
    // Load job from repository
    const jobData = await this.jobRepository.findById(input.jobId);
    if (!jobData) {
      throw new Error(`Job ${input.jobId} not found`);
    }

    const job = new ImprovementJob({
      id: jobData.id,
      repositoryId: jobData.repositoryId,
      targetFilePath: jobData.targetFilePath,
      status: jobData.status,
      requestedByUserId: jobData.requestedByUserId,
      createdAt: jobData.createdAt,
      startedAt: jobData.startedAt,
      finishedAt: jobData.finishedAt,
      pullRequestUrl: jobData.pullRequestUrl,
      pullRequestNumber: jobData.pullRequestNumber,
      failureCode: jobData.failureCode as FailureCode | undefined,
      failureMessage: jobData.failureMessage,
    });

    console.log(`Starting job ${job.id} for ${job.repositoryId}:${job.targetFilePath}`);

    // Mark job as running
    job.markAsRunning();
    await this.jobRepository.updateStatus(job.id, 'running');

    let context: WorkerContext | null = null;

    try {
      // Parse repository ID
      const [owner, repo] = this.parseRepositoryId(job.repositoryId);

      // Create isolated work directory
      context = await this.createWorkDirectory(owner, repo);

      // Get GitHub client
      const githubClient = createGitHubClient({
        personalAccessToken: process.env.GITHUB_TOKEN,
      });

      // Clone repository
      await this.cloneRepository(context, owner, repo);

      // Validate target file
      await this.validateTargetFile(context, job.targetFilePath);

      // Read target file
      const targetContent = await this.readTargetFile(context, job.targetFilePath);

      // Generate test file path
      const testFilePath = this.generateTestFilePath(job.targetFilePath);

      // Generate tests using AI
      const testContent = await this.generateTests(targetContent, job.targetFilePath, context);

      // Validate generated tests
      this.validateTestContent(testContent, testFilePath);

      // Get default branch
      const defaultBranch = await this.getDefaultBranch(context);

      // Create or update pull request
      const pr = await createOrUpdatePullRequest(githubClient, {
        owner,
        repo,
        targetFilePath: job.targetFilePath,
        testFilePath,
        testContent,
        baseBranch: defaultBranch,
      });

      console.log(`PR created/updated: ${pr.url}`);

      // Mark job as succeeded
      job.markAsSucceeded(pr.url, pr.number);
      await this.jobRepository.updateStatus(job.id, 'succeeded', {
        pullRequestUrl: pr.url,
        pullRequestNumber: pr.number,
      });

      return { job };
    } catch (err) {
      console.error(`Job ${job.id} failed:`, err);

      // Categorize error
      const { code, message } = this.categorizeError(err);

      // Mark job as failed
      job.markAsFailed(code, message);
      await this.jobRepository.updateStatus(job.id, 'failed', {
        failureCode: code,
        failureMessage: message,
      });

      return { job };
    } finally {
      // Cleanup
      if (context) {
        await this.cleanupWorkDirectory(context);
      }
    }
  }

  // Private helper methods (infrastructure concerns)

  private parseRepositoryId(repositoryId: string): [string, string] {
    const parts = repositoryId.split('/');
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    }
    return ['demo-owner', repositoryId];
  }

  private async createWorkDirectory(owner: string, repo: string): Promise<WorkerContext> {
    const workDir = path.join('/tmp', 'ai-coverage-worker', `${owner}-${repo}-${Date.now()}`);
    await fs.mkdir(workDir, { recursive: true });

    return {
      workDir,
      repoPath: path.join(workDir, repo),
      owner,
      repo,
    };
  }

  private async cloneRepository(
    context: WorkerContext,
    owner: string,
    repo: string,
  ): Promise<void> {
    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error('GITHUB_TOKEN not configured');
      }

      const cloneUrl = `https://x-access-token:${token}@github.com/${owner}/${repo}.git`;

      await execAsync(`git clone --depth 1 --single-branch "${cloneUrl}" "${context.repoPath}"`, {
        cwd: context.workDir,
      });

      console.log(`Cloned ${owner}/${repo} to ${context.repoPath}`);
    } catch (err) {
      throw new Error(
        `Failed to clone repository: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  private async getDefaultBranch(context: WorkerContext): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: context.repoPath });
      return stdout.trim() || 'main';
    } catch {
      return 'main';
    }
  }

  private async validateTargetFile(context: WorkerContext, targetFilePath: string): Promise<void> {
    const fullPath = path.join(context.repoPath, targetFilePath);

    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`File not found: ${targetFilePath}`);
    }

    if (!targetFilePath.endsWith('.ts')) {
      throw new Error('Target file must be a TypeScript file (.ts)');
    }

    if (targetFilePath.endsWith('.test.ts') || targetFilePath.endsWith('.spec.ts')) {
      throw new Error('Target file cannot be a test file');
    }
  }

  private async readTargetFile(context: WorkerContext, targetFilePath: string): Promise<string> {
    const fullPath = path.join(context.repoPath, targetFilePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  private generateTestFilePath(targetFilePath: string): string {
    const withoutExt = targetFilePath.replace(/\.ts$/, '');
    return `${withoutExt}.test.ts`;
  }

  private async generateTests(
    sourceContent: string,
    targetFilePath: string,
    context: WorkerContext,
  ): Promise<string> {
    // TODO: Replace with actual AI generation
    console.log(`Generating tests for ${targetFilePath}...`);

    const fileName = path.basename(targetFilePath, '.ts');
    return `import { describe, it, expect } from '@jest/globals';
// TODO: Import functions/classes from the source file
// import { functionName } from './${fileName}';

describe('${fileName}', () => {
  it('should be tested', () => {
    // TODO: AI-generated tests would go here
    expect(true).toBe(true);
  });
});
`;
  }

  private validateTestContent(testContent: string, testFilePath: string): void {
    if (!testFilePath.endsWith('.test.ts') && !testFilePath.endsWith('.spec.ts')) {
      throw new Error('Generated file must be a test file (.test.ts or .spec.ts)');
    }

    const hasTestKeywords =
      testContent.includes('describe') ||
      testContent.includes('it(') ||
      testContent.includes('test(') ||
      testContent.includes('expect(');

    if (!hasTestKeywords) {
      throw new Error('Generated content does not appear to contain valid tests');
    }
  }

  private async cleanupWorkDirectory(context: WorkerContext): Promise<void> {
    try {
      await fs.rm(context.workDir, { recursive: true, force: true });
      console.log(`Cleaned up work directory: ${context.workDir}`);
    } catch (err) {
      console.error(`Failed to cleanup work directory: ${err}`);
    }
  }

  private categorizeError(err: unknown): { code: FailureCode; message: string } {
    const errorMessage = err instanceof Error ? err.message : String(err);

    const FAILURE_MESSAGES: Record<FailureCode, string> = {
      REPO_NOT_FOUND: 'Repository not found or not accessible. Please verify repository access.',
      REPO_CLONE_FAILED: 'Failed to clone repository. Please check repository permissions.',
      FILE_NOT_FOUND: 'Target file not found in repository. File may have been moved or deleted.',
      INVALID_FILE_TYPE: 'Target file must be a TypeScript source file (.ts, not .test.ts).',
      AI_GENERATION_FAILED: 'AI test generation failed. The file structure may be too complex.',
      TESTS_VALIDATION_FAILED: 'Generated tests failed validation. Only test files are allowed.',
      PR_CREATION_FAILED: 'Failed to create pull request. Please check GitHub permissions.',
      GITHUB_AUTH_FAILED:
        'GitHub authentication failed. Please reconnect your GitHub account.',
      UNKNOWN: 'An unexpected error occurred. Please try again or contact support.',
    };

    if (errorMessage.includes('not found') || errorMessage.includes('File not found')) {
      return { code: 'FILE_NOT_FOUND', message: FAILURE_MESSAGES.FILE_NOT_FOUND };
    }

    if (errorMessage.includes('clone') || errorMessage.includes('repository')) {
      return { code: 'REPO_CLONE_FAILED', message: FAILURE_MESSAGES.REPO_CLONE_FAILED };
    }

    if (
      errorMessage.includes('Target file must be') ||
      errorMessage.includes('cannot be a test file')
    ) {
      return { code: 'INVALID_FILE_TYPE', message: FAILURE_MESSAGES.INVALID_FILE_TYPE };
    }

    if (errorMessage.includes('GITHUB_TOKEN') || errorMessage.includes('authentication')) {
      return { code: 'GITHUB_AUTH_FAILED', message: FAILURE_MESSAGES.GITHUB_AUTH_FAILED };
    }

    if (errorMessage.includes('Generated') || errorMessage.includes('validation')) {
      return { code: 'TESTS_VALIDATION_FAILED', message: FAILURE_MESSAGES.TESTS_VALIDATION_FAILED };
    }

    if (errorMessage.includes('pull request') || errorMessage.includes('PR')) {
      return { code: 'PR_CREATION_FAILED', message: FAILURE_MESSAGES.PR_CREATION_FAILED };
    }

    return { code: 'UNKNOWN', message: `${FAILURE_MESSAGES.UNKNOWN} (${errorMessage})` };
  }
}

interface WorkerContext {
  workDir: string;
  repoPath: string;
  owner: string;
  repo: string;
}

