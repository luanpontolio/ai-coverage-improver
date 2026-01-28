import { JobRepository } from '../infrastructure/db/job.repository';
import { RepositoryRepository } from '../infrastructure/db/repository.repository';
import { CoverageRepository } from '../infrastructure/db/coverage.repository';
import { AIExecutionRepository } from '../infrastructure/db/ai-execution.repository';
import { RunCoverageImprovementOperation } from '../application/operations/run-coverage-improvement.operation';
import { GenerateTestsWithAIOperation } from '../application/operations/generate-tests-with-ai.operation';
import { CoverageSourceAdapter } from '../infrastructure/github/coverage-source.adapter';
import { LLMAdapter } from '../infrastructure/llm/llm.adapter';
import { AppConfigService } from '../config/config.service';

/**
 * Worker: Improvement Job Processor
 *
 * This worker is responsible for processing improvement jobs.
 * Following the Operations Pattern, it ONLY executes the operation.
 * All business logic is contained within RunCoverageImprovementOperation.
 *
 * SAFETY RULES ENFORCED (by the operation):
 * 1. Only operates on default branch
 * 2. Only creates/modifies *.test.ts files
 * 3. Never executes tests
 * 4. Never auto-merges PRs
 * 5. Isolated execution environment
 */
export const processImprovementJob = async (
  jobId: string,
  jobRepository: JobRepository,
  repositoryRepository: RepositoryRepository,
  coverageRepository: CoverageRepository,
  aiExecutionRepository: AIExecutionRepository,
  coverageSourceAdapter: CoverageSourceAdapter,
  llmAdapter: LLMAdapter,
  configService: AppConfigService,
): Promise<void> => {
  console.log(`\n🔧 [DEBUG] Worker processImprovementJob() called for job ${jobId}`);
  
  // Create dependencies for GenerateTestsWithAIOperation
  console.log(`🏗️ [DEBUG] Creating GenerateTestsWithAIOperation`);
  const generateTestsOperation = new GenerateTestsWithAIOperation(llmAdapter);

  // Create operation instance with all dependencies
  console.log(`🏗️ [DEBUG] Creating RunCoverageImprovementOperation with all dependencies`);
  const operation = new RunCoverageImprovementOperation(
    jobRepository,
    repositoryRepository,
    coverageRepository,
    aiExecutionRepository,
    generateTestsOperation,
    coverageSourceAdapter,
    configService,
  );

  // Execute operation
  console.log(`▶️ [DEBUG] Calling operation.execute() for job ${jobId}`);
  await operation.execute({ jobId });
  console.log(`✅ [DEBUG] Worker processImprovementJob() completed for job ${jobId}\n`);
}

