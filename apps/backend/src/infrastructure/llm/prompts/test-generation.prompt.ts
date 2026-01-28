import { GenerateTestRequest, LLMMessage } from '../llm.types';

/**
 * Build structured prompt for test generation with detailed coverage data
 */
export function buildTestGenerationPrompt({
  sourceCode,
  filePath,
  language = 'typescript',
  existingTestCode,
  coverageData,
}: GenerateTestRequest): LLMMessage[] {
  if (language !== 'typescript') {
    throw new Error(`Unsupported language: ${language}`);
  }

  const systemPrompt = `You are an expert TypeScript test engineer specialized in writing comprehensive unit tests using Jest.

Your task is to generate high-quality test files that:
- Achieve maximum code coverage (aim for 100%)
- Test all functions, methods, and edge cases
- Follow Jest best practices and conventions
- Use proper mocking for dependencies
- Include descriptive test names using "describe" and "it" blocks

CRITICAL RULES:
- Only generate the test file content (*.test.ts)
- Do NOT modify the source code
- Use Jest syntax exclusively
- Include all necessary imports with correct paths
- Output ONLY the code in a single TypeScript code block
- No explanations or markdown outside the code block`;

  // Build detailed coverage information
  let coverageInfo = '';
  if (coverageData) {
    coverageInfo = `
**Current Coverage:** ${coverageData.currentCoverage.toFixed(1)}% (${coverageData.coveredLines}/${coverageData.totalLines} lines covered)`;

    if (coverageData.uncoveredLines.length > 0) {
      coverageInfo += `
**❌ UNCOVERED LINES:** ${formatLineNumbers(coverageData.uncoveredLines)}
**⚠️ PRIORITY:** Generate tests that execute these specific line numbers!`;
    }

    if (coverageData.uncoveredFunctions && coverageData.uncoveredFunctions.length > 0) {
      coverageInfo += `
**❌ UNCOVERED FUNCTIONS:** ${coverageData.uncoveredFunctions.join(', ')}
**⚠️ PRIORITY:** These functions have NO tests - create comprehensive test cases for them!`;
    }
  }

  // Handle existing tests
  let testingContext = '';
  if (existingTestCode) {
    testingContext = `
**⚠️ EXISTING TESTS FOUND:**
The file already has some tests, but coverage is only ${coverageData?.currentCoverage.toFixed(1)}%.

\`\`\`typescript
${existingTestCode}
\`\`\`

**YOUR TASK:** 
1. KEEP all existing test cases as they are (do not duplicate them)
2. ADD NEW test cases to cover the uncovered lines and functions listed above
3. Focus ONLY on testing the parts that are currently NOT covered
4. Ensure new tests integrate well with existing tests`;
  } else {
    testingContext = `
**No existing tests found.** Generate a complete test suite from scratch that covers all code paths.`;
  }

  const userPrompt = `Generate comprehensive Jest tests for:

**File:** \`${filePath}\`
${coverageInfo}

**Source Code:**
\`\`\`typescript
${sourceCode}
\`\`\`
${testingContext}

**Requirements:**
1. Import the functions/classes from the correct path (\`${filePath.replace(/\.(ts|tsx)$/, '')}\`)
2. Mock all external dependencies (use \`jest.mock()\`)
3. Create tests that specifically target the uncovered lines/functions
4. Include edge cases, error scenarios, and boundary conditions
5. Use descriptive test names that explain the scenario being tested

**Output format:** Single TypeScript code block with the complete test file.
Start with imports, then mocks (if needed), then describe blocks with test cases.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Format line numbers for display in prompt
 */
function formatLineNumbers(lines: number[]): string {
  if (lines.length === 0) return 'none';
  if (lines.length <= 15) return lines.join(', ');

  // Show first 15 and indicate there are more
  return `${lines.slice(0, 15).join(', ')} ... (${lines.length - 15} more lines)`;
}