import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ListInstallationRepositoriesOperation } from '../../src/application/operations/list-installation-repositories.operation';
import { GitHubReposAdapter } from '../../src/infrastructure/github/repos.adapter';
import { RepositoryRepository } from '../../src/infrastructure/db/repository.repository';

describe('ListInstallationRepositoriesOperation', () => {
  let operation: ListInstallationRepositoriesOperation;
  let githubReposAdapter: jest.Mocked<GitHubReposAdapter>;
  let repositoryRepository: jest.Mocked<RepositoryRepository>;

  beforeEach(async () => {
    const mockGithubReposAdapter = {
      listInstallationRepositories: jest.fn(),
    };

    const mockRepositoryRepository = {
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListInstallationRepositoriesOperation,
        {
          provide: GitHubReposAdapter,
          useValue: mockGithubReposAdapter,
        },
        {
          provide: RepositoryRepository,
          useValue: mockRepositoryRepository,
        },
      ],
    }).compile();

    operation = module.get<ListInstallationRepositoriesOperation>(
      ListInstallationRepositoriesOperation
    );
    githubReposAdapter = module.get(GitHubReposAdapter);
    repositoryRepository = module.get(RepositoryRepository);
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should list and persist repositories', async () => {
    const mockGithubRepos = [
      { owner: 'user', name: 'repo1', defaultBranch: 'main' },
      { owner: 'user', name: 'repo2', defaultBranch: 'master' },
    ];

    githubReposAdapter.listInstallationRepositories.mockResolvedValue(mockGithubRepos);
    repositoryRepository.upsert
      .mockResolvedValueOnce({
        id: 'db-id-1',
        provider: 'github',
        owner: 'user',
        name: 'repo1',
        defaultBranch: 'main',
        installationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: 'db-id-2',
        provider: 'github',
        owner: 'user',
        name: 'repo2',
        defaultBranch: 'master',
        installationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const result = await operation.execute({ accessToken: 'token123' });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('db-id-1');
    expect(result[0].name).toBe('repo1');
    expect(result[1].id).toBe('db-id-2');
    expect(result[1].name).toBe('repo2');
    expect(githubReposAdapter.listInstallationRepositories).toHaveBeenCalledWith('token123');
    expect(repositoryRepository.upsert).toHaveBeenCalledTimes(2);
  });

  it('should throw UnauthorizedException when no access token provided', async () => {
    await expect(operation.execute({ accessToken: '' })).rejects.toThrow(UnauthorizedException);
  });

  it('should include installationId when provided', async () => {
    const mockGithubRepos = [{ owner: 'user', name: 'repo', defaultBranch: 'main' }];

    githubReposAdapter.listInstallationRepositories.mockResolvedValue(mockGithubRepos);
    repositoryRepository.upsert.mockResolvedValue({
      id: 'db-id',
      provider: 'github',
      owner: 'user',
      name: 'repo',
      defaultBranch: 'main',
      installationId: 'inst-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await operation.execute({
      accessToken: 'token',
      installationId: 'inst-123',
    });

    expect(result[0].installationId).toBe('inst-123');
    expect(repositoryRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: 'inst-123',
      })
    );
  });
});
