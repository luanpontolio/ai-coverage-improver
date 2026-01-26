import { JobRepository } from '../infrastructure/db/job.repository';
import { RepositoryRepository } from '../infrastructure/db/repository.repository';
import { RunCoverageImprovementOperation } from '../application/operations/run-coverage-improvement.operation';

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
): Promise<void> => {
  // Create operation instance
  const operation = new RunCoverageImprovementOperation(jobRepository, repositoryRepository);

  // Execute operation
  await operation.execute({ jobId });
}

