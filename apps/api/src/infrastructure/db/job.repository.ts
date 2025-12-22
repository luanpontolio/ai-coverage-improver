import { Injectable } from '@nestjs/common';
import { ImprovementJobProps, JobStatus } from '../../domain/improvement-job';
import { PrismaService } from './prisma.service';

export interface CreateJobRecordInput {
  repositoryId: string;
  targetFilePath: string;
  requestedByUserId: string;
  isAdmin: boolean;
}

/**
 * Job Repository - Infrastructure layer
 * Persists and retrieves ImprovementJob entities using Prisma
 */
@Injectable()
export class JobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ImprovementJobProps | undefined> {
    const job = await this.prisma.improvementJob.findUnique({
      where: { id },
    });

    if (!job) return undefined;

    return {
      id: job.id,
      repositoryId: job.repositoryId,
      targetFilePath: job.targetFilePath,
      status: job.status as JobStatus,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
      pullRequestUrl: job.pullRequestUrl || undefined,
      pullRequestNumber: job.pullRequestNumber || undefined,
      failureCode: job.failureCode || undefined,
      failureMessage: job.failureMessage || undefined,
    };
  }

  async findOpenByRepoAndFile(
    repositoryId: string,
    filePath: string,
  ): Promise<ImprovementJobProps | undefined> {
    const job = await this.prisma.improvementJob.findFirst({
      where: {
        repositoryId,
        targetFilePath: filePath,
        status: {
          in: ['queued', 'running'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!job) return undefined;

    return {
      id: job.id,
      repositoryId: job.repositoryId,
      targetFilePath: job.targetFilePath,
      status: job.status as JobStatus,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
      pullRequestUrl: job.pullRequestUrl || undefined,
      pullRequestNumber: job.pullRequestNumber || undefined,
      failureCode: job.failureCode || undefined,
      failureMessage: job.failureMessage || undefined,
    };
  }

  async createJob(input: CreateJobRecordInput): Promise<ImprovementJobProps> {
    // Validate admin using domain rules
    if (!input.isAdmin) {
      throw new Error('Only administrators can create improvement jobs');
    }

    const job = await this.prisma.improvementJob.create({
      data: {
        repositoryId: input.repositoryId,
        targetFilePath: input.targetFilePath,
        status: 'queued',
        requestedByUserId: input.requestedByUserId,
      },
    });

    return {
      id: job.id,
      repositoryId: job.repositoryId,
      targetFilePath: job.targetFilePath,
      status: job.status as JobStatus,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
      pullRequestUrl: job.pullRequestUrl || undefined,
      pullRequestNumber: job.pullRequestNumber || undefined,
      failureCode: job.failureCode || undefined,
      failureMessage: job.failureMessage || undefined,
    };
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    payload?: Partial<ImprovementJobProps>,
  ): Promise<ImprovementJobProps> {
    const job = await this.prisma.improvementJob.update({
      where: { id },
      data: {
        status,
        ...(payload?.startedAt && { startedAt: payload.startedAt }),
        ...(payload?.finishedAt && { finishedAt: payload.finishedAt }),
        ...(payload?.pullRequestUrl && { pullRequestUrl: payload.pullRequestUrl }),
        ...(payload?.pullRequestNumber !== undefined && {
          pullRequestNumber: payload.pullRequestNumber,
        }),
        ...(payload?.failureCode && { failureCode: payload.failureCode }),
        ...(payload?.failureMessage && { failureMessage: payload.failureMessage }),
      },
    });

    return {
      id: job.id,
      repositoryId: job.repositoryId,
      targetFilePath: job.targetFilePath,
      status: job.status as JobStatus,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
      pullRequestUrl: job.pullRequestUrl || undefined,
      pullRequestNumber: job.pullRequestNumber || undefined,
      failureCode: job.failureCode || undefined,
      failureMessage: job.failureMessage || undefined,
    };
  }
}

