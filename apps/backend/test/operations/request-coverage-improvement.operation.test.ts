import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestCoverageImprovementOperation } from '../../src/application/operations/request-coverage-improvement.operation';
import { RepositoryRepository } from '../../src/infrastructure/db/repository.repository';
import { JobRepository } from '../../src/infrastructure/db/job.repository';
import { ImprovementProducer } from '../../src/infrastructure/queue/improvement.producer';
import { ImprovementJobProps } from '../../src/domain/improvement-job';

describe('RequestCoverageImprovementOperation', () => {
  let operation: RequestCoverageImprovementOperation;
  let repositoryRepository: jest.Mocked<RepositoryRepository>;
  let jobRepository: jest.Mocked<JobRepository>;
  let improvementProducer: jest.Mocked<ImprovementProducer>;

  beforeEach(async () => {
    const mockRepositoryRepository = {
      findById: jest.fn(),
    };

    const mockJobRepository = {
      findOpenJobByRepo: jest.fn(),
      createJob: jest.fn(),
    };

    const mockImprovementProducer = {
      enqueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestCoverageImprovementOperation,
        {
          provide: RepositoryRepository,
          useValue: mockRepositoryRepository,
        },
        {
          provide: JobRepository,
          useValue: mockJobRepository,
        },
        {
          provide: ImprovementProducer,
          useValue: mockImprovementProducer,
        },
      ],
    }).compile();

    operation = module.get<RequestCoverageImprovementOperation>(
      RequestCoverageImprovementOperation
    );
    repositoryRepository = module.get(RepositoryRepository);
    jobRepository = module.get(JobRepository);
    improvementProducer = module.get(ImprovementProducer);
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should create new job and enqueue', async () => {
    const mockRepo = {
      id: 'repo-123',
      owner: 'user',
      name: 'repo',
      defaultBranch: 'main',
      provider: 'github',
      installationId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockJobData: ImprovementJobProps = {
      id: 'job-123',
      repositoryId: 'repo-123',
      status: 'queued' as const,
      requestedByUserId: 'user-123',
      createdAt: new Date(),
    };

    repositoryRepository.findById.mockResolvedValue(mockRepo);
    jobRepository.findOpenJobByRepo.mockResolvedValue(undefined);
    jobRepository.createJob.mockResolvedValue(mockJobData);
    improvementProducer.enqueue.mockResolvedValue(undefined);

    const result = await operation.execute({
      repositoryId: 'repo-123',
      requestedByUserId: 'user-123',
    });

    expect(result.job.id).toBe('job-123');
    expect(result.reused).toBe(false);
    expect(jobRepository.createJob).toHaveBeenCalledWith({
      repositoryId: 'repo-123',
      requestedByUserId: 'user-123',
    });
    expect(improvementProducer.enqueue).toHaveBeenCalledWith('job-123', 'repo-123');
  });

  it('should reuse existing open job', async () => {
    const mockRepo = {
      id: 'repo-123',
      owner: 'user',
      name: 'repo',
      defaultBranch: 'main',
      provider: 'github',
      installationId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockExistingJob: ImprovementJobProps = {
      id: 'existing-job',
      repositoryId: 'repo-123',
      status: 'cloning' as const,
      requestedByUserId: 'user-123',
      createdAt: new Date(),
      startedAt: new Date(),
    };

    repositoryRepository.findById.mockResolvedValue(mockRepo);
    jobRepository.findOpenJobByRepo.mockResolvedValue(mockExistingJob);
    improvementProducer.enqueue.mockResolvedValue(undefined);

    const result = await operation.execute({
      repositoryId: 'repo-123',
      requestedByUserId: 'user-123',
    });

    expect(result.job.id).toBe('existing-job');
    expect(result.reused).toBe(true);
    expect(jobRepository.createJob).not.toHaveBeenCalled();
    expect(improvementProducer.enqueue).toHaveBeenCalledWith('existing-job', 'repo-123');
  });

  it('should throw BadRequestException when userId not provided', async () => {
    await expect(
      operation.execute({
        repositoryId: 'repo-123',
        requestedByUserId: '',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when repository not found', async () => {
    repositoryRepository.findById.mockResolvedValue(undefined);

    await expect(
      operation.execute({
        repositoryId: 'non-existent',
        requestedByUserId: 'user-123',
      })
    ).rejects.toThrow(NotFoundException);
  });
});
