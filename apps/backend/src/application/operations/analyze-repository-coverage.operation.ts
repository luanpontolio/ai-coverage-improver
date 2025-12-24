import { Injectable, NotFoundException } from '@nestjs/common';
import { parseCoverageContent } from '../../../../../packages/coverage/src/parser';
import { RepositoryRepository } from '../../infrastructure/db/repository.repository';
import { CoverageSourceAdapter } from '../../infrastructure/github/coverage-source.adapter';
import { CoverageRepository } from '../../infrastructure/db/coverage.repository';
import { CoverageSnapshot } from '../../domain/coverage-snapshot';

export interface AnalyzeRepositoryCoverageInput {
  repositoryId: string;
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
    // Find repository in database (contains the correct database ID)
    const dbRepo = await this.repositoryRepository.findById(input.repositoryId);
    if (!dbRepo) {
      throw new NotFoundException('Repository not found in database');
    }

    // Fetch coverage source file from GitHub
    const repoFullName = `${dbRepo.owner}/${dbRepo.name}`;
    const source = await this.coverageSourceAdapter.fetchCoverageSource(
      repoFullName,
      dbRepo.defaultBranch,
    );

    // Parse coverage content
    const thresholdPct = input.thresholdPct ?? this.DEFAULT_THRESHOLD_PCT;
    const parsed = parseCoverageContent({
      content: source.content,
      format: source.format,
      thresholdPct,
    });

    // Create domain entity with database ID
    const snapshot = new CoverageSnapshot(
      dbRepo.id, // Use database CUID
      dbRepo.defaultBranch,
      source.coverageSourcePath,
      parsed.thresholdPct,
      parsed.files,
    );

    // Persist snapshot
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

