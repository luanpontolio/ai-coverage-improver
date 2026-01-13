import { Injectable, NotFoundException } from '@nestjs/common';
import { fetchFileContent } from '../../../../../packages/github/src/repos';

/**
 * Infrastructure adapter for fetching coverage source files
 * Fetches coverage files from GitHub repositories using REST API
 */
@Injectable()
export class CoverageSourceAdapter {
  // Possible coverage file paths to try (in order of preference)
  private readonly COVERAGE_PATHS = [
    'coverage/lcov.info',
    'coverage/coverage-final.json',
    'coverage.json',
    'lcov.info',
  ];

  /**
   * Fetch coverage source file from GitHub repository
   * Tries multiple common coverage file locations
   * 
   * @param repositoryId - Format: "owner/repo"
   * @param ref - Branch name or commit SHA
   * @param accessToken - GitHub OAuth token for authentication
   */
  async fetchCoverageSource(
    repositoryId: string,
    ref: string,
    accessToken: string,
  ): Promise<{ content: string; format: 'lcov' | 'json'; coverageSourcePath: string }> {
    const [owner, repo] = repositoryId.split('/');

    if (!owner || !repo) {
      throw new Error('Invalid repositoryId format. Expected "owner/repo"');
    }

    // Try to fetch all known coverage paths in parallel
    const results = await Promise.allSettled(
      this.COVERAGE_PATHS.map(path => 
        fetchFileContent(owner, repo, path, ref, accessToken)
      )
    );

    // Find the first successful result
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const path = this.COVERAGE_PATHS[i];

      if (result.status === 'fulfilled' && result.value) {
        console.log(`✅ Coverage file found at: ${path}`);
        const format = this.detectFormat(path);

        return {
          content: result.value.content,
          format,
          coverageSourcePath: result.value.path,
        };
      }
    }

    throw new NotFoundException(
      `No coverage file found in repository ${repositoryId}. ` +
      `Tried paths: ${this.COVERAGE_PATHS.join(', ')}`
    );
  }

  /**
   * Detect coverage format based on file path
   */
  private detectFormat(path: string): 'lcov' | 'json' {
    return path.endsWith('.json') ? 'json' : 'lcov';
  }
}

