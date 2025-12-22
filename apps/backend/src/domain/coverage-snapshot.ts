import { CoverageFileMetric } from '@coverage/parser';

/**
 * Domain entity representing a coverage snapshot for a repository
 */
export class CoverageSnapshot {
  constructor(
    public readonly repositoryId: string,
    public readonly ref: string,
    public readonly coverageSourcePath: string,
    public readonly thresholdPct: number,
    public readonly files: CoverageFileMetric[],
    public readonly capturedAt: Date = new Date(),
  ) {}

  /**
   * Get files below the coverage threshold
   */
  getFilesBelowThreshold(): CoverageFileMetric[] {
    return this.files.filter((file) => file.isBelowThreshold);
  }

  /**
   * Get overall coverage percentage
   */
  getOverallCoverage(): number {
    if (this.files.length === 0) return 0;
    const sum = this.files.reduce((acc, file) => acc + file.coveragePct, 0);
    return sum / this.files.length;
  }

  /**
   * Check if overall coverage meets threshold
   */
  meetsThreshold(): boolean {
    return this.getOverallCoverage() >= this.thresholdPct;
  }
}

