import { DetailedCoverageData } from '../llm/llm.types';
import * as fs from 'fs/promises';

/**
 * Parse LCOV content to extract detailed line-by-line coverage for a specific file
 * This helps the LLM understand exactly which parts need tests
 */
export function parseLcovDetailed(
  lcovContent: string,
  targetFilePath: string,
): DetailedCoverageData | null {
  const lines: Map<number, number> = new Map();
  const functions: Map<string, number> = new Map();
  let currentFile = '';
  let isTargetFile = false;

  for (const rawLine of lcovContent.split(/\r?\n/)) {
    const line = rawLine.trim();

    // Start of new file
    if (line.startsWith('SF:')) {
      currentFile = line.substring(3);
      // Match file path (handle both absolute and relative paths)
      isTargetFile =
        currentFile.includes(targetFilePath) ||
        currentFile.endsWith(targetFilePath) ||
        targetFilePath.endsWith(currentFile.replace(/^\//, ''));
      continue;
    }

    if (!isTargetFile) continue;

    // DA:line,hits - Line coverage data
    if (line.startsWith('DA:')) {
      const [lineNumStr, hitsStr] = line.substring(3).split(',');
      const lineNum = Number(lineNumStr);
      const hits = Number(hitsStr);
      if (!isNaN(lineNum) && !isNaN(hits)) {
        lines.set(lineNum, hits);
      }
    }

    // FN:line,functionName - Function definition
    if (line.startsWith('FN:')) {
      const parts = line.substring(3).split(',');
      if (parts.length >= 2) {
        const funcName = parts.slice(1).join(','); // Handle function names with commas
        functions.set(funcName, 0); // Will be updated by FNDA
      }
    }

    // FNDA:hits,functionName - Function execution count
    if (line.startsWith('FNDA:')) {
      const parts = line.substring(5).split(',');
      if (parts.length >= 2) {
        const hits = Number(parts[0]);
        const funcName = parts.slice(1).join(',');
        if (!isNaN(hits)) {
          functions.set(funcName, hits);
        }
      }
    }

    // End of record for target file
    if (line === 'end_of_record' && isTargetFile) {
      break;
    }
  }

  if (lines.size === 0) {
    return null; // File not found in coverage
  }

  // Calculate uncovered lines
  const uncoveredLines: number[] = [];
  for (const [lineNum, hits] of lines.entries()) {
    if (hits === 0) {
      uncoveredLines.push(lineNum);
    }
  }

  // Calculate uncovered functions
  const uncoveredFunctions: string[] = [];
  for (const [funcName, hits] of functions.entries()) {
    if (hits === 0) {
      uncoveredFunctions.push(funcName);
    }
  }

  const totalLines = lines.size;
  const coveredLines = totalLines - uncoveredLines.length;
  const currentCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;

  return {
    currentCoverage,
    uncoveredLines: uncoveredLines.sort((a, b) => a - b),
    uncoveredFunctions: uncoveredFunctions.length > 0 ? uncoveredFunctions : undefined,
    totalLines,
    coveredLines,
  };
}

/**
 * Read existing test file if it exists
 */
export async function readExistingTests(testFilePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(testFilePath, 'utf-8');
  } catch {
    return undefined;
  }
}

/**
 * Get test file path for a source file
 * Examples:
 *   src/utils/helper.ts -> src/utils/helper.test.ts
 *   lib/parser.ts -> lib/parser.test.ts
 */
export function getTestFilePath(sourceFilePath: string): string {
  const ext = sourceFilePath.match(/\.(ts|tsx|js|jsx)$/)?.[0] || '.ts';
  const base = sourceFilePath.slice(0, -ext.length);
  return `${base}.test${ext}`;
}
