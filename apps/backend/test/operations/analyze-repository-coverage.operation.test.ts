import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyzeRepositoryCoverageOperation } from '../../src/application/operations/analyze-repository-coverage.operation';
import { RepositoryRepository } from '../../src/infrastructure/db/repository.repository';
import { CoverageSourceAdapter } from '../../src/infrastructure/github/coverage-source.adapter';
import { CoverageRepository } from '../../src/infrastructure/db/coverage.repository';

// Mock the parser module
jest.mock('../../../../../packages/coverage/src/parser', () => ({
  parseCoverageContent: jest.fn(),
}));

import { parseCoverageContent } from '../../../../../packages/coverage/src/parser';

describe('AnalyzeRepositoryCoverageOperation', () => {
  let operation: AnalyzeRepositoryCoverageOperation;
  let repositoryRepository: jest.Mocked<RepositoryRepository>;
  let coverageSourceAdapter: jest.Mocked<CoverageSourceAdapter>;
  let coverageRepository: jest.Mocked<CoverageRepository>;

  beforeEach(async () => {
    const mockRepositoryRepository = {
      findById: jest.fn(),
    };

    const mockCoverageSourceAdapter = {
      fetchCoverageSource: jest.fn(),
    };

    const mockCoverageRepository = {
      saveSnapshot: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyzeRepositoryCoverageOperation,
        {
          provide: RepositoryRepository,
          useValue: mockRepositoryRepository,
        },
        {
          provide: CoverageSourceAdapter,
          useValue: mockCoverageSourceAdapter,
        },
        {
          provide: CoverageRepository,
          useValue: mockCoverageRepository,
        },
      ],
    }).compile();

    operation = module.get<AnalyzeRepositoryCoverageOperation>(
      AnalyzeRepositoryCoverageOperation
    );
    repositoryRepository = module.get(RepositoryRepository);
    coverageSourceAdapter = module.get(CoverageSourceAdapter);
    coverageRepository = module.get(CoverageRepository);

    // Clear mock between tests
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should analyze coverage and save snapshot', async () => {
    const mockRepo = {
      id: 'repo-123',
      owner: 'user',
      name: 'repo',
      defaultBranch: 'main',
      provider: 'github',
      installationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockCoverageSource = {
      content: 'lcov content',
      format: 'lcov' as const,
      coverageSourcePath: 'coverage/lcov.info',
    };

    const mockParsedCoverage = {
      thresholdPct: 80,
      files: [
        {
          filePath: 'src/file.ts',
          coveragePct: 75,
          isBelowThreshold: true,
        },
      ],
    };

    repositoryRepository.findById.mockResolvedValue(mockRepo);
    coverageSourceAdapter.fetchCoverageSource.mockResolvedValue(mockCoverageSource);
    (parseCoverageContent as jest.Mock).mockReturnValue(mockParsedCoverage);
    coverageRepository.saveSnapshot.mockResolvedValue(undefined);

    const result = await operation.execute({
      repositoryId: 'repo-123',
      accessToken: 'token',
      thresholdPct: 80,
    });

    expect(result.snapshot.repositoryId).toBe('repo-123');
    expect(result.snapshot.files).toHaveLength(1);
    expect(repositoryRepository.findById).toHaveBeenCalledWith('repo-123');
    expect(coverageSourceAdapter.fetchCoverageSource).toHaveBeenCalledWith(
      'user/repo',
      'main',
      'token'
    );
    expect(coverageRepository.saveSnapshot).toHaveBeenCalled();
  });

  it('should use default threshold when not provided', async () => {
    const mockRepo = {
      id: 'repo-123',
      owner: 'user',
      name: 'repo',
      defaultBranch: 'main',
      provider: 'github',
      installationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repositoryRepository.findById.mockResolvedValue(mockRepo);
    coverageSourceAdapter.fetchCoverageSource.mockResolvedValue({
      content: 'content',
      format: 'lcov',
      coverageSourcePath: 'path',
    });
    (parseCoverageContent as jest.Mock).mockReturnValue({
      thresholdPct: 80,
      files: [],
    });

    await operation.execute({
      repositoryId: 'repo-123',
      accessToken: 'token',
    });

    expect(parseCoverageContent).toHaveBeenCalledWith(
      expect.objectContaining({
        thresholdPct: 80, // Default threshold
      })
    );
  });

  it('should throw NotFoundException when repository not found', async () => {
    repositoryRepository.findById.mockResolvedValue(null);

    await expect(
      operation.execute({
        repositoryId: 'non-existent',
        accessToken: 'token',
      })
    ).rejects.toThrow(NotFoundException);
  });
});
