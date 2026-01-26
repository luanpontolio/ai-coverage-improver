import { Injectable, NotFoundException } from '@nestjs/common';
import { parseCoverageContent } from '../../../../../packages/coverage/src/parser';
import { RepositoryRepository } from '../../infrastructure/db/repository.repository';
import { CoverageSourceAdapter } from '../../infrastructure/github/coverage-source.adapter';
import { CoverageRepository } from '../../infrastructure/db/coverage.repository';
import { CoverageSnapshot } from '../../domain/coverage-snapshot';

export interface AnalyzeRepositoryCoverageInput {
  repositoryId: string;
  accessToken: string;
  thresholdPct?: number;
}

export interface AnalyzeRepositoryCoverageOutput {
  snapshot: CoverageSnapshot;
}

/**
 * Operation: Analyze Repository Coverage
 *
 * Fetches coverage data for a repository, parses it, and saves a snapshot.
 * This represents the complete interaction of analyzing coverage.
 */
@Injectable()
export class AnalyzeRepositoryCoverageOperation {
  private readonly DEFAULT_THRESHOLD_PCT = 80;

  constructor(
    private readonly repositoryRepository: RepositoryRepository,
    private readonly coverageSourceAdapter: CoverageSourceAdapter,
    private readonly coverageRepository: CoverageRepository,
  ) {}

  async execute(input: AnalyzeRepositoryCoverageInput): Promise<AnalyzeRepositoryCoverageOutput> {
    const dbRepo = await this.repositoryRepository.findById(input.repositoryId);
    if (!dbRepo) {
      throw new NotFoundException('Repository not found in database');
    }

    const repoFullName = `${dbRepo.owner}/${dbRepo.name}`;
    const source = await this.coverageSourceAdapter.fetchCoverageSource(
      repoFullName,
      dbRepo.defaultBranch,
      input.accessToken,
    );

    const thresholdPct = input.thresholdPct ?? this.DEFAULT_THRESHOLD_PCT;
    console.log('=============== thresholdPct ===============', thresholdPct);
    const parsed = parseCoverageContent({
      content: source.content,
      format: source.format,
      thresholdPct,
    });

    const snapshot = new CoverageSnapshot(
      dbRepo.id,
      dbRepo.defaultBranch,
      source.coverageSourcePath,
      parsed.thresholdPct,
      parsed.files,
    );

    await this.coverageRepository.saveSnapshot({
      repositoryId: snapshot.repositoryId,
      ref: snapshot.ref,
      coverageSourcePath: snapshot.coverageSourcePath,
      format: source.format,
      thresholdPct: snapshot.thresholdPct,
      files: snapshot.files,
    });

    return { snapshot };
  }
}

