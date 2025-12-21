import { Injectable, NotFoundException } from '@nestjs/common';
import { parseCoverageContent } from '@coverage/parser';
import { GitHubReposAdapter } from '../../infrastructure/github/repos.adapter';
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
    private readonly githubReposAdapter: GitHubReposAdapter,
    private readonly coverageSourceAdapter: CoverageSourceAdapter,
    private readonly coverageRepository: CoverageRepository,
  ) {}

  async execute(input: AnalyzeRepositoryCoverageInput): Promise<AnalyzeRepositoryCoverageOutput> {
    // Find repository
    const repo = await this.githubReposAdapter.findRepositoryById(input.repositoryId);
    if (!repo) {
      throw new NotFoundException('Repository not found or not accessible');
    }

    // Fetch coverage source file
    const source = await this.coverageSourceAdapter.fetchCoverageSource(
      repo.id,
      repo.defaultBranch,
    );

    // Parse coverage content
    const thresholdPct = input.thresholdPct ?? this.DEFAULT_THRESHOLD_PCT;
    const parsed = parseCoverageContent({
      content: source.content,
      format: source.format,
      thresholdPct,
    });

    // Create domain entity
    const snapshot = new CoverageSnapshot(
      repo.id,
      repo.defaultBranch,
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

