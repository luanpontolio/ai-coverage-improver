import { Injectable, Logger } from '@nestjs/common';
import { LLMAdapter } from '../../infrastructure/llm/llm.adapter';
import { GenerateTestRequest } from '../../infrastructure/llm/llm.types';
import { 
  parseLcovDetailed, 
  readExistingTests, 
  getTestFilePath 
} from '../../infrastructure/coverage/detailed-coverage.parser';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface GenerateTestsWithAIInput {
  clonePath: string;
  filePath: string;
  lcovContent: string;
}

export interface GenerateTestsWithAIOutput {
  testFilePath: string;
  testCode: string;
  confidence: number;
  uncoveredLinesCount: number;
  targetCoverage: number;
}

/**
 * Operation: Generate Tests with AI
 * 
 * Uses LLM to generate tests for files with low coverage.
 * Analyzes existing tests and coverage data to generate targeted tests.
 */
@Injectable()
export class GenerateTestsWithAIOperation {
  private readonly logger = new Logger(GenerateTestsWithAIOperation.name);

  constructor(private readonly llmAdapter: LLMAdapter) {}

  async execute(input: GenerateTestsWithAIInput): Promise<GenerateTestsWithAIOutput> {
    this.logger.log(`🤖 Generating tests for: ${input.filePath}`);

    // 1. Read source file
    const sourceFilePath = path.join(input.clonePath, input.filePath);
    const sourceCode = await fs.readFile(sourceFilePath, 'utf-8');
    this.logger.debug(`📄 Read source file: ${sourceCode.length} characters`);

    // 2. Parse detailed coverage for this specific file
    const detailedCoverage = parseLcovDetailed(input.lcovContent, input.filePath);

    if (!detailedCoverage) {
      throw new Error(`No coverage data found for ${input.filePath}`);
    }

    this.logger.log(
      `📊 Coverage: ${detailedCoverage.currentCoverage.toFixed(1)}% ` +
      `(${detailedCoverage.coveredLines}/${detailedCoverage.totalLines} lines)`
    );
    
    if (detailedCoverage.uncoveredLines.length > 0) {
      this.logger.log(`❌ Uncovered lines: ${detailedCoverage.uncoveredLines.slice(0, 10).join(', ')}${detailedCoverage.uncoveredLines.length > 10 ? '...' : ''}`);
    }
    
    if (detailedCoverage.uncoveredFunctions && detailedCoverage.uncoveredFunctions.length > 0) {
      this.logger.log(`❌ Uncovered functions: ${detailedCoverage.uncoveredFunctions.join(', ')}`);
    }

    // 3. Check for existing tests
    const testFilePath = getTestFilePath(input.filePath);
    const fullTestPath = path.join(input.clonePath, testFilePath);
    const existingTestCode = await readExistingTests(fullTestPath);

    if (existingTestCode) {
      this.logger.log(`♻️ Found existing tests (${existingTestCode.length} characters)`);
    } else {
      this.logger.log(`📝 No existing tests found, will create new file`);
    }

    // 4. Generate tests with LLM using detailed context
    const request: GenerateTestRequest = {
      sourceCode,
      filePath: input.filePath,
      language: 'typescript',
      existingTestCode,
      coverageData: detailedCoverage,
    };

    this.logger.log(`🚀 Calling LLM to generate tests...`);
    const response = await this.llmAdapter.generateTest(request);

    // 5. Write test file
    await fs.mkdir(path.dirname(fullTestPath), { recursive: true });
    await fs.writeFile(fullTestPath, response.testCode, 'utf-8');

    this.logger.log(`✅ Generated test file: ${testFilePath}`);
    this.logger.log(`📝 Test code: ${response.testCode.length} characters`);
    this.logger.log(`📊 Confidence: ${(response.confidence * 100).toFixed(1)}%`);
    this.logger.log(`🎯 Target: Cover ${detailedCoverage.uncoveredLines.length} uncovered lines`);

    return {
      testFilePath,
      testCode: response.testCode,
      confidence: response.confidence,
      uncoveredLinesCount: detailedCoverage.uncoveredLines.length,
      targetCoverage: detailedCoverage.currentCoverage,
    };
  }
}
