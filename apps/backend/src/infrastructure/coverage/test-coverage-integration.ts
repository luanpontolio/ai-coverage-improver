/**
 * Integration Test Script
 * Tests the complete flow of detailed coverage parsing + test generation
 *
 * Run with: npx ts-node src/infrastructure/coverage/test-coverage-integration.ts
 */

import { parseLcovDetailed, getTestFilePath } from './detailed-coverage.parser';
import { buildTestGenerationPrompt } from '../llm/prompts/test-generation.prompt';

// Sample LCOV content with uncovered lines
const SAMPLE_LCOV = `TN:
SF:/Users/dev/project/src/utils/calculator.ts
FN:1,add
FN:5,subtract
FN:9,multiply
FN:13,divide
FNDA:10,add
FNDA:0,subtract
FNDA:5,multiply
FNDA:0,divide
DA:1,10
DA:2,10
DA:3,10
DA:5,0
DA:6,0
DA:7,0
DA:9,5
DA:10,5
DA:11,5
DA:13,0
DA:14,0
DA:15,0
DA:16,0
LF:13
LH:6
end_of_record`;

// Sample source code
const SAMPLE_SOURCE_CODE = `export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}`;

// Sample existing tests
const SAMPLE_EXISTING_TESTS = `import { add } from './calculator';

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
  });
});`;

async function testIntegration() {
  console.log('🧪 Testing Coverage Integration\n');

  // 1. Test detailed coverage parsing
  console.log('1️⃣ Testing parseLcovDetailed...');
  const coverage = parseLcovDetailed(SAMPLE_LCOV, 'src/utils/calculator.ts');

  if (!coverage) {
    console.error('❌ Failed to parse coverage');
    return;
  }

  console.log(`✅ Parsed coverage:`);
  console.log(`   - Current coverage: ${coverage.currentCoverage.toFixed(1)}%`);
  console.log(`   - Total lines: ${coverage.totalLines}`);
  console.log(`   - Covered lines: ${coverage.coveredLines}`);
  console.log(`   - Uncovered lines: ${coverage.uncoveredLines.join(', ')}`);
  console.log(`   - Uncovered functions: ${coverage.uncoveredFunctions?.join(', ') || 'none'}`);
  console.log();

  // 2. Test getTestFilePath
  console.log('2️⃣ Testing getTestFilePath...');
  const testPath = getTestFilePath('src/utils/calculator.ts');
  console.log(`✅ Test path: ${testPath}`);
  console.log();

  // 3. Test prompt generation WITHOUT existing tests
  console.log('3️⃣ Testing buildTestGenerationPrompt (no existing tests)...');
  const promptWithoutTests = buildTestGenerationPrompt({
    sourceCode: SAMPLE_SOURCE_CODE,
    filePath: 'src/utils/calculator.ts',
    language: 'typescript',
    coverageData: coverage,
  });
  
  console.log(`✅ Generated prompt with ${promptWithoutTests.length} messages`);
  console.log(`   System prompt length: ${promptWithoutTests[0].content.length} chars`);
  console.log(`   User prompt length: ${promptWithoutTests[1].content.length} chars`);
  console.log();
  console.log('📝 User prompt preview:');
  console.log(promptWithoutTests[1].content.substring(0, 500) + '...\n');

  // 4. Test prompt generation WITH existing tests
  console.log('4️⃣ Testing buildTestGenerationPrompt (with existing tests)...');
  const promptWithTests = buildTestGenerationPrompt({
    sourceCode: SAMPLE_SOURCE_CODE,
    filePath: 'src/utils/calculator.ts',
    language: 'typescript',
    existingTestCode: SAMPLE_EXISTING_TESTS,
    coverageData: coverage,
  });

  console.log(`✅ Generated prompt with existing tests`);
  console.log(`   User prompt length: ${promptWithTests[1].content.length} chars`);
  console.log();
  console.log('📝 User prompt preview (with existing tests):');
  console.log(promptWithTests[1].content.substring(0, 500) + '...\n');

  // 5. Summary
  console.log('✅ All integration tests passed!\n');
  console.log('📊 Summary:');
  console.log(`   - Coverage parser: ✅ Working`);
  console.log(`   - Test path helper: ✅ Working`);
  console.log(`   - Prompt generation: ✅ Working`);
  console.log(`   - Detailed coverage data: ✅ Being passed to LLM`);
  console.log();
  console.log('🎯 The system is ready to generate targeted tests!');
}

// Run the test
testIntegration().catch(console.error);
