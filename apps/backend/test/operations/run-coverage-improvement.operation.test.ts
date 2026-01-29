// import { Test, TestingModule } from '@nestjs/testing';
// import { RunCoverageImprovementOperation } from '../../src/application/operations/run-coverage-improvement.operation';
// import { JobRepository } from '../../src/infrastructure/db/job.repository';
// import { RepositoryRepository } from '../../src/infrastructure/db/repository.repository';
// import { CoverageRepository } from '../../src/infrastructure/db/coverage.repository';
// import { AIExecutionRepository } from '../../src/infrastructure/db/ai-execution.repository';
// import { GenerateTestsWithAIOperation } from '../../src/application/operations/generate-tests-with-ai.operation';
// import { CoverageSourceAdapter } from '../../src/infrastructure/github/coverage-source.adapter';
// import { AppConfigService } from '../../src/config/config.service';
// import { ImprovementJobProps } from '../../src/domain/improvement-job';
// import { createMockConfigService } from '../mocks/config.mock';

// // Mock child_process and fs
// jest.mock('child_process', () => ({
//   exec: jest.fn(),
// }));

// jest.mock('fs/promises');
// jest.mock('../../src/infrastructure/coverage/test-coverage-integration', () => ({
//   runCoverageTests: jest.fn(),
//   parseLcovFile: jest.fn(),
// }));

// import { exec } from 'child_process';
// import * as fs from 'fs/promises';

// describe('RunCoverageImprovementOperation', () => {
//   let operation: RunCoverageImprovementOperation;
//   let jobRepository: jest.Mocked<JobRepository>;
//   let repositoryRepository: jest.Mocked<RepositoryRepository>;
//   let coverageRepository: jest.Mocked<CoverageRepository>;
//   let aiExecutionRepository: jest.Mocked<AIExecutionRepository>;
//   let generateTestsOperation: jest.Mocked<GenerateTestsWithAIOperation>;
//   let coverageSourceAdapter: jest.Mocked<CoverageSourceAdapter>;
//   let configService: jest.Mocked<AppConfigService>;

//   beforeEach(async () => {
//     const mockJobRepository = {
//       findById: jest.fn(),
//       findOpenJobByRepo: jest.fn(),
//       createJob: jest.fn(),
//       updateStatus: jest.fn(),
//     };

//     const mockRepositoryRepository = {
//       findById: jest.fn(),
//     };

//     const mockCoverageRepository = {
//       saveSnapshot: jest.fn(),
//       findLatestSnapshot: jest.fn(),
//     };

//     const mockAIExecutionRepository = {
//       createExecution: jest.fn(),
//       updateExecution: jest.fn(),
//     };

//     const mockGenerateTestsOperation = {
//       execute: jest.fn(),
//     };

//     const mockCoverageSourceAdapter = {
//       fetchCoverageSource: jest.fn(),
//     };

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         RunCoverageImprovementOperation,
//         {
//           provide: JobRepository,
//           useValue: mockJobRepository,
//         },
//         {
//           provide: RepositoryRepository,
//           useValue: mockRepositoryRepository,
//         },
//         {
//           provide: CoverageRepository,
//           useValue: mockCoverageRepository,
//         },
//         {
//           provide: AIExecutionRepository,
//           useValue: mockAIExecutionRepository,
//         },
//         {
//           provide: GenerateTestsWithAIOperation,
//           useValue: mockGenerateTestsOperation,
//         },
//         {
//           provide: CoverageSourceAdapter,
//           useValue: mockCoverageSourceAdapter,
//         },
//         {
//           provide: AppConfigService,
//           useValue: createMockConfigService(),
//         },
//       ],
//     }).compile();

//     operation = module.get<RunCoverageImprovementOperation>(RunCoverageImprovementOperation);
//     jobRepository = module.get(JobRepository);
//     repositoryRepository = module.get(RepositoryRepository);
//     coverageRepository = module.get(CoverageRepository);
//     aiExecutionRepository = module.get(AIExecutionRepository);
//     generateTestsOperation = module.get(GenerateTestsWithAIOperation);
//     coverageSourceAdapter = module.get(CoverageSourceAdapter);
//     configService = module.get(AppConfigService);

//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(operation).toBeDefined();
//   });

//   it('should update job to cloning status', async () => {
//     const mockJob: ImprovementJobProps = {
//       id: 'job-123',
//       repositoryId: 'repo-123',
//       status: 'queued' as const,
//       requestedByUserId: 'user-123',
//       createdAt: new Date(),
//     };

//     const mockRepo = {
//       id: 'repo-123',
//       owner: 'user',
//       name: 'repo',
//       defaultBranch: 'main',
//       provider: 'github',
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     jobRepository.findById.mockResolvedValue(mockJob);
//     repositoryRepository.findById.mockResolvedValue(mockRepo);
//     jobRepository.updateStatus.mockResolvedValue({
//       ...mockJob,
//       status: 'cloning',
//     });

//     // Mock exec to fail fast for this test (we just want to test status update)
//     (exec as any).mockImplementation((cmd: string, cb: any) => {
//       cb(new Error('Clone failed'));
//     });

//     try {
//       await operation.execute({ jobId: 'job-123' });
//     } catch (error) {
//       // Expected to fail
//     }

//     expect(jobRepository.updateStatus).toHaveBeenCalledWith('job-123', 'cloning');
//   });

//   it('should handle job not found', async () => {
//     jobRepository.findById.mockResolvedValue(Promise.resolve(undefined));

//     await expect(operation.execute({ jobId: 'non-existent' })).rejects.toThrow(
//       'Job non-existent not found'
//     );
//   });

//   it('should handle repository not found', async () => {
//     const mockJob: ImprovementJobProps = {
//       id: 'job-123',
//       repositoryId: 'repo-123',
//       status: 'queued' as const,
//       requestedByUserId: 'user-123',
//       createdAt: new Date(),
//     };

//     jobRepository.findById.mockResolvedValue(mockJob);
//     repositoryRepository.findById.mockResolvedValue(null);

//     await expect(operation.execute({ jobId: 'job-123' })).rejects.toThrow(
//       'Repository repo-123 not found'
//     );
//   });

//   it('should update job failure on error', async () => {
//     const mockJob: ImprovementJobProps = {
//       id: 'job-123',
//       repositoryId: 'repo-123',
//       status: 'queued' as const,
//       requestedByUserId: 'user-123',
//       createdAt: new Date(),
//     };

//     const mockRepo = {
//       id: 'repo-123',
//       owner: 'user',
//       name: 'repo',
//       defaultBranch: 'main',
//       provider: 'github',
//       installationId: undefined,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     jobRepository.findById.mockResolvedValue(mockJob);
//     repositoryRepository.findById.mockResolvedValue(mockRepo);
//     jobRepository.updateStatus.mockResolvedValue({
//       ...mockJob,
//       status: 'failed',
//     });

//     // Mock exec to fail
//     (exec as any).mockImplementation((cmd: string, cb: any) => {
//       cb(new Error('Clone failed'));
//     });

//     try {
//       await operation.execute({ jobId: 'job-123' });
//     } catch (error) {
//       // Expected
//     }

//     expect(jobRepository.updateStatus).toHaveBeenCalledWith(
//       'job-123',
//       'failed',
//       expect.objectContaining({
//         failureCode: 'REPO_CLONE_FAILED',
//         failureMessage: expect.stringContaining('Clone failed'),
//       })
//     );
//   });
// });
