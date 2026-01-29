import { Test, TestingModule } from '@nestjs/testing';
import { GenerateTestsWithAIOperation } from '../../src/application/operations/generate-tests-with-ai.operation';
import { LLMAdapter } from '../../src/infrastructure/llm/llm.adapter';
import * as fs from 'fs/promises';

// Mock fs and coverage parser
jest.mock('fs/promises');
jest.mock('../../src/infrastructure/coverage/detailed-coverage.parser', () => ({
  parseLcovDetailed: jest.fn(),
  readExistingTests: jest.fn(),
  getTestFilePath: jest.fn(),
}));

import {
  parseLcovDetailed,
  readExistingTests,
  getTestFilePath,
} from '../../src/infrastructure/coverage/detailed-coverage.parser';

describe('GenerateTestsWithAIOperation', () => {
  let operation: GenerateTestsWithAIOperation;
  let llmAdapter: jest.Mocked<LLMAdapter>;

  beforeEach(async () => {
    const mockLLMAdapter = {
      generateTest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateTestsWithAIOperation,
        {
          provide: LLMAdapter,
          useValue: mockLLMAdapter,
        },
      ],
    }).compile();

    operation = module.get<GenerateTestsWithAIOperation>(GenerateTestsWithAIOperation);
    llmAdapter = module.get(LLMAdapter);

    // Clear mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should generate tests for a file with low coverage', async () => {
    const mockSourceCode = 'export function add(a: number, b: number) { return a + b; }';
    const mockLcovContent = 'lcov data';
    const mockDetailedCoverage = {
      filePath: 'src/math.ts',
      currentCoverage: 50,
      totalLines: 10,
      coveredLines: 5,
      uncoveredLines: [3, 4, 5],
      uncoveredFunctions: ['add'],
    };
    const mockExistingTests = null;
    const mockGeneratedTest = {
      testCode: 'describe("add", () => { it("adds numbers", () => {}); });',
      confidence: 0.95,
    };

    (fs.readFile as jest.Mock).mockResolvedValue(mockSourceCode);
    (parseLcovDetailed as jest.Mock).mockReturnValue(mockDetailedCoverage);
    (getTestFilePath as jest.Mock).mockReturnValue('src/math.test.ts');
    (readExistingTests as jest.Mock).mockResolvedValue(mockExistingTests);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    llmAdapter.generateTest.mockResolvedValue(mockGeneratedTest);

    const result = await operation.execute({
      clonePath: '/tmp/repo',
      filePath: 'src/math.ts',
      lcovContent: mockLcovContent,
    });

    expect(result.testFilePath).toBe('src/math.test.ts');
    expect(result.testCode).toBe(mockGeneratedTest.testCode);
    expect(result.confidence).toBe(0.95);
    expect(result.uncoveredLinesCount).toBe(3);
    expect(result.targetCoverage).toBe(50);

    expect(fs.readFile).toHaveBeenCalledWith('/tmp/repo/src/math.ts', 'utf-8');
    expect(parseLcovDetailed).toHaveBeenCalledWith(mockLcovContent, 'src/math.ts');
    expect(llmAdapter.generateTest).toHaveBeenCalledWith({
      sourceCode: mockSourceCode,
      filePath: 'src/math.ts',
      language: 'typescript',
      existingTestCode: null,
      coverageData: mockDetailedCoverage,
    });
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/tmp/repo/src/math.test.ts',
      mockGeneratedTest.testCode,
      'utf-8'
    );
  });

  it('should handle existing tests', async () => {
    const mockExistingTests = 'describe("existing", () => {});';
    const mockDetailedCoverage = {
      filePath: 'src/file.ts',
      currentCoverage: 60,
      totalLines: 10,
      coveredLines: 6,
      uncoveredLines: [5, 6],
      uncoveredFunctions: [],
    };

    (fs.readFile as jest.Mock).mockResolvedValue('source code');
    (parseLcovDetailed as jest.Mock).mockReturnValue(mockDetailedCoverage);
    (getTestFilePath as jest.Mock).mockReturnValue('src/file.test.ts');
    (readExistingTests as jest.Mock).mockResolvedValue(mockExistingTests);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    llmAdapter.generateTest.mockResolvedValue({
      testCode: 'updated tests',
      confidence: 0.9,
    });

    await operation.execute({
      clonePath: '/tmp/repo',
      filePath: 'src/file.ts',
      lcovContent: 'lcov',
    });

    expect(llmAdapter.generateTest).toHaveBeenCalledWith(
      expect.objectContaining({
        existingTestCode: mockExistingTests,
      })
    );
  });

  it('should throw error when no coverage data found', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('source');
    (parseLcovDetailed as jest.Mock).mockReturnValue(null);
    (getTestFilePath as jest.Mock).mockReturnValue('test.ts');

    await expect(
      operation.execute({
        clonePath: '/tmp/repo',
        filePath: 'src/file.ts',
        lcovContent: 'lcov',
      })
    ).rejects.toThrow('No coverage data found for src/file.ts');
  });
});
