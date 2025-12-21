import { Injectable } from '@nestjs/common';

/**
 * Infrastructure adapter for fetching coverage source files
 * In MVP, returns sample data. In production, would fetch from GitHub API
 */
@Injectable()
export class CoverageSourceAdapter {
  private readonly SAMPLE_LCOV = `
TN:
SF:src/index.ts
LF:10
LH:8
end_of_record
SF:src/utils.ts
LF:5
LH:3
end_of_record
`;

  private readonly SAMPLE_JSON = JSON.stringify({
    'src/lib/a.ts': { lines: { pct: 72 } },
    'src/lib/b.tsx': { lines: { covered: 9, total: 10 } },
  });

  /**
   * Fetch coverage source file from repository
   * TODO: Implement actual GitHub API fetching
   */
  async fetchCoverageSource(
    repositoryId: string,
    ref: string,
  ): Promise<{ content: string; format: 'lcov' | 'json'; coverageSourcePath: string }> {
    // MVP: Return sample data based on repo ID
    if (repositoryId === 'demo-repo-json') {
      return {
        content: this.SAMPLE_JSON,
        format: 'json',
        coverageSourcePath: 'coverage/coverage-final.json',
      };
    }

    return {
      content: this.SAMPLE_LCOV,
      format: 'lcov',
      coverageSourcePath: 'coverage/lcov.info',
    };
  }
}

