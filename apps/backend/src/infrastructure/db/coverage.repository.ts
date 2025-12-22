import { Injectable } from '@nestjs/common';
import { CoverageFileMetric, CoverageFormat } from '@coverage/parser';
import { PrismaService } from './prisma.service';

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

/**
 * Coverage Repository - Infrastructure layer
 * Persists and retrieves coverage snapshots using Prisma
 */
@Injectable()
export class CoverageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveSnapshot(
    input: Omit<CoverageSnapshotRecord, 'id' | 'createdAt'>,
  ): Promise<CoverageSnapshotRecord> {
    // Check if snapshot exists for this repo and ref
    const existing = await this.prisma.coverageSnapshot.findFirst({
      where: {
        repositoryId: input.repositoryId,
        ref: input.ref,
      },
      include: {
        files: true,
      },
    });

    if (existing) {
      // Update existing snapshot
      const updated = await this.prisma.coverageSnapshot.update({
        where: { id: existing.id },
        data: {
          coverageSourcePath: input.coverageSourcePath,
          format: input.format,
          thresholdPct: input.thresholdPct,
          commitSha: input.commitSha,
          files: {
            deleteMany: {}, // Remove old files
            create: input.files.map((file: CoverageFileMetric) => ({
              filePath: file.filePath,
              coveragePct: file.coveragePct,
              isBelowThreshold: file.isBelowThreshold,
            })),
          },
        },
        include: {
          files: true,
        },
      });

      return {
        id: updated.id,
        repositoryId: updated.repositoryId,
        ref: updated.ref,
        coverageSourcePath: updated.coverageSourcePath,
        format: updated.format as CoverageFormat,
        thresholdPct: updated.thresholdPct,
        createdAt: updated.createdAt,
        commitSha: updated.commitSha || undefined,
        files: updated.files.map((f: CoverageFileMetric) => ({
          filePath: f.filePath,
          coveragePct: f.coveragePct,
          isBelowThreshold: f.isBelowThreshold,
        })),
      };
    }

    // Create new snapshot
    const created = await this.prisma.coverageSnapshot.create({
      data: {
        repositoryId: input.repositoryId,
        ref: input.ref,
        coverageSourcePath: input.coverageSourcePath,
        format: input.format,
        thresholdPct: input.thresholdPct,
        commitSha: input.commitSha,
        files: {
          create: input.files.map((file: CoverageFileMetric) => ({
            filePath: file.filePath,
            coveragePct: file.coveragePct,
            isBelowThreshold: file.isBelowThreshold,
          })),
        },
      },
      include: {
        files: true,
      },
    });

    return {
      id: created.id,
      repositoryId: created.repositoryId,
      ref: created.ref,
      coverageSourcePath: created.coverageSourcePath,
      format: created.format as CoverageFormat,
      thresholdPct: created.thresholdPct,
      createdAt: created.createdAt,
      commitSha: created.commitSha || undefined,
      files: created.files.map((f: CoverageFileMetric) => ({
        filePath: f.filePath,
        coveragePct: f.coveragePct,
        isBelowThreshold: f.isBelowThreshold,
      })),
    };
  }

  async latestForRepo(repositoryId: string): Promise<CoverageSnapshotRecord | undefined> {
    const snapshot = await this.prisma.coverageSnapshot.findFirst({
      where: { repositoryId },
      orderBy: { createdAt: 'desc' },
      include: {
        files: true,
      },
    });

    if (!snapshot) return undefined;

    return {
      id: snapshot.id,
      repositoryId: snapshot.repositoryId,
      ref: snapshot.ref,
      coverageSourcePath: snapshot.coverageSourcePath,
      format: snapshot.format as CoverageFormat,
      thresholdPct: snapshot.thresholdPct,
      createdAt: snapshot.createdAt,
      commitSha: snapshot.commitSha || undefined,
      files: snapshot.files.map((f: CoverageFileMetric) => ({
        filePath: f.filePath,
        coveragePct: f.coveragePct,
        isBelowThreshold: f.isBelowThreshold,
      })),
    };
  }
}

