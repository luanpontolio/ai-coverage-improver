import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetJobStatusOperation } from '../../src/application/operations/get-job-status.operation';
import { JobRepository } from '../../src/infrastructure/db/job.repository';

describe('GetJobStatusOperation', () => {
  let operation: GetJobStatusOperation;
  let jobRepository: jest.Mocked<JobRepository>;

  beforeEach(async () => {
    const mockJobRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetJobStatusOperation,
        {
          provide: JobRepository,
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    operation = module.get<GetJobStatusOperation>(GetJobStatusOperation);
    jobRepository = module.get(JobRepository);
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should return job status', async () => {
    const mockJobData = {
      id: 'job-123',
      repositoryId: 'repo-123',
      status: 'succeeded' as const,
      requestedByUserId: 'user-123',
      createdAt: new Date(),
      startedAt: new Date(),
      clonedAt: new Date(),
      finishedAt: new Date(),
      clonePath: '/tmp/clone',
      pullRequestUrl: 'https://github.com/user/repo/pull/1',
      pullRequestNumber: 1,
      batchSize: 10,
      batchesProcessed: 10,
      batchesTotalCount: 10,
      failureCode: null,
      failureMessage: null,
    };

    jobRepository.findById.mockResolvedValue(mockJobData);

    const result = await operation.execute({
      repositoryId: 'repo-123',
      jobId: 'job-123',
    });

    expect(result.job.id).toBe('job-123');
    expect(result.job.status).toBe('succeeded');
    expect(jobRepository.findById).toHaveBeenCalledWith('job-123');
  });

  it('should throw NotFoundException when job not found', async () => {
    jobRepository.findById.mockResolvedValue(null);

    await expect(
      operation.execute({
        repositoryId: 'repo-123',
        jobId: 'non-existent',
      })
    ).rejects.toThrow(NotFoundException);
  });
});
