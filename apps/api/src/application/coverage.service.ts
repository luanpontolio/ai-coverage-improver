import { Injectable } from '@nestjs/common';
import { parseCoverageContent } from '@coverage/parser';
import { Repository } from '@github/repos';
import { CoverageRepository } from '../infrastructure/db/coverage.repository';

const SAMPLE_LCOV = `
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

const SAMPLE_JSON = JSON.stringify({
  'src/lib/a.ts': { lines: { pct: 72 } },
  'src/lib/b.tsx': { lines: { covered: 9, total: 10 } },
});

@Injectable()
export class CoverageService {
  private readonly thresholdPct = 80;

  constructor(private readonly coverageRepository: CoverageRepository) {}

  async fetchCoverageForRepo(repo: Repository) {
    const source = this.getCoverageSource(repo.id);
    const parsed = parseCoverageContent({
      content: source.content,
      format: source.format,
      thresholdPct: this.thresholdPct,
    });

    await this.coverageRepository.saveSnapshot({
      repositoryId: repo.id,
      ref: repo.defaultBranch,
      coverageSourcePath: source.coverageSourcePath,
      format: source.format,
      thresholdPct: parsed.thresholdPct,
      files: parsed.files,
    });

    return {
      repoId: repo.id,
      ref: repo.defaultBranch,
      coverageSourcePath: source.coverageSourcePath,
      thresholdPct: parsed.thresholdPct,
      files: parsed.files,
    };
  }

  private getCoverageSource(repoId: string) {
    if (repoId === 'demo-repo-json') {
      return {
        content: SAMPLE_JSON,
        format: 'json' as const,
        coverageSourcePath: 'coverage/coverage-final.json',
      };
    }

    return {
      content: SAMPLE_LCOV,
      format: 'lcov' as const,
      coverageSourcePath: 'coverage/lcov.info',
    };
  }
}

