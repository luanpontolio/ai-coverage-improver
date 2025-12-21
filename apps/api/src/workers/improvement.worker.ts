import { JobRepository } from '../infrastructure/db/job.repository';
import { createOrUpdatePullRequest } from '@github/pr';

const FAILURE_TAXONOMY = {
  NOT_ADMIN: 'NOT_ADMIN',
  PR_CREATION_FAILED: 'PR_CREATION_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type FailureCode = keyof typeof FAILURE_TAXONOMY;

export const processImprovementJob = async (jobId: string, jobRepository: JobRepository) => {
  const job = await jobRepository.findById(jobId);
  if (!job) return;

  await jobRepository.updateStatus(jobId, 'running');

  try {
    // Safety rules: default-branch only, tests-only changes, no test execution, no auto-merge.
    const pr = await createOrUpdatePullRequest(job.repositoryId, job.targetFilePath);
    await jobRepository.updateStatus(jobId, 'succeeded', {
      pullRequestUrl: pr.url,
      pullRequestNumber: pr.number,
    });
  } catch (err) {
    await jobRepository.updateStatus(jobId, 'failed', {
      failureCode: FAILURE_TAXONOMY.PR_CREATION_FAILED,
      failureMessage: err instanceof Error ? err.message : 'PR creation failed',
    });
  }
};

