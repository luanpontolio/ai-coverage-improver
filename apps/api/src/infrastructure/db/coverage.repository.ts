import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CoverageFileMetric, CoverageFormat } from '@coverage/parser';

export interface CoverageSnapshotRecord {
  id: string;
  repositoryId: string;
  ref: string;
  coverageSourcePath: string;
  format: CoverageFormat;
  thresholdPct: number;
  files: CoverageFileMetric[];
  createdAt: Date;
  commitSha?: string;
}

@Injectable()
export class CoverageRepository {
  private snapshots: CoverageSnapshotRecord[] = [];

  async saveSnapshot(input: Omit<CoverageSnapshotRecord, 'id' | 'createdAt'>): Promise<CoverageSnapshotRecord> {
    const existingIndex = this.snapshots.findIndex(
      (snapshot) => snapshot.repositoryId === input.repositoryId && snapshot.ref === input.ref,
    );
    const record: CoverageSnapshotRecord = {
      id: existingIndex >= 0 ? this.snapshots[existingIndex].id : randomUUID(),
      createdAt: existingIndex >= 0 ? this.snapshots[existingIndex].createdAt : new Date(),
      ...input,
    };
    if (existingIndex >= 0) {
      this.snapshots[existingIndex] = record;
    } else {
      this.snapshots.push(record);
    }
    return record;
  }

  async latestForRepo(repositoryId: string): Promise<CoverageSnapshotRecord | undefined> {
    return this.snapshots
      .filter((snapshot) => snapshot.repositoryId === repositoryId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
}

