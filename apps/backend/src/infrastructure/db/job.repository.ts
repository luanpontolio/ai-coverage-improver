import { Injectable } from '@nestjs/common';
import { ImprovementJobProps, JobStatus } from '../../domain/improvement-job';
import { PrismaService } from './prisma.service';

export interface CreateJobInput {
  repositoryId: string;
  requestedByUserId: string;
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
      status: job.status as JobStatus,
      clonePath: job.clonePath || undefined,
      clonedAt: job.clonedAt || undefined,
      analyzedAt: job.analyzedAt || undefined,
      targetFilesCount: job.targetFilesCount || undefined,
      processingStartedAt: job.processingStartedAt || undefined,
      filesProcessed: job.filesProcessed || undefined,
      filesSucceeded: job.filesSucceeded || undefined,
      filesFailed: job.filesFailed || undefined,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
      failureCode: job.failureCode || undefined,
      failureMessage: job.failureMessage || undefined,
    };
  }

  async findOpenJobByRepo(
    repositoryId: string,
  ): Promise<ImprovementJobProps | undefined> {
    const job = await this.prisma.improvementJob.findFirst({
      where: {
        repositoryId,
        status: {
          in: ['queued', 'cloning', 'cloned', 'analyzing', 'analyzed', 'processing'],
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
      status: job.status as JobStatus,
      clonePath: job.clonePath || undefined,
      clonedAt: job.clonedAt || undefined,
      analyzedAt: job.analyzedAt || undefined,
      targetFilesCount: job.targetFilesCount || undefined,
      processingStartedAt: job.processingStartedAt || undefined,
      filesProcessed: job.filesProcessed || undefined,
      filesSucceeded: job.filesSucceeded || undefined,
      filesFailed: job.filesFailed || undefined,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
      failureCode: job.failureCode || undefined,
      failureMessage: job.failureMessage || undefined,
    };
  }

  async createJob(input: CreateJobInput): Promise<ImprovementJobProps> {
    const job = await this.prisma.improvementJob.create({
      data: {
        repositoryId: input.repositoryId,
        status: 'queued',
        requestedByUserId: input.requestedByUserId,
      },
    });

    return {
      id: job.id,
      repositoryId: job.repositoryId,
      status: job.status as JobStatus,
      clonePath: job.clonePath || undefined,
      clonedAt: job.clonedAt || undefined,
      analyzedAt: job.analyzedAt || undefined,
      targetFilesCount: job.targetFilesCount || undefined,
      processingStartedAt: job.processingStartedAt || undefined,
      filesProcessed: job.filesProcessed || undefined,
      filesSucceeded: job.filesSucceeded || undefined,
      filesFailed: job.filesFailed || undefined,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
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
        ...(payload?.clonePath && { clonePath: payload.clonePath }),
        ...(payload?.startedAt && { startedAt: payload.startedAt }),
        ...(payload?.clonedAt && { clonedAt: payload.clonedAt }),
        ...(payload?.analyzedAt && { analyzedAt: payload.analyzedAt }),
        ...(payload?.targetFilesCount !== undefined && {
          targetFilesCount: payload.targetFilesCount,
        }),
        ...(payload?.processingStartedAt && {
          processingStartedAt: payload.processingStartedAt,
        }),
        ...(payload?.filesProcessed !== undefined && {
          filesProcessed: payload.filesProcessed,
        }),
        ...(payload?.filesSucceeded !== undefined && {
          filesSucceeded: payload.filesSucceeded,
        }),
        ...(payload?.filesFailed !== undefined && {
          filesFailed: payload.filesFailed,
        }),
        ...(payload?.finishedAt && { finishedAt: payload.finishedAt }),
        ...(payload?.failureCode && { failureCode: payload.failureCode }),
        ...(payload?.failureMessage && { failureMessage: payload.failureMessage }),
      },
    });

    return {
      id: job.id,
      repositoryId: job.repositoryId,
      status: job.status as JobStatus,
      clonePath: job.clonePath || undefined,
      clonedAt: job.clonedAt || undefined,
      analyzedAt: job.analyzedAt || undefined,
      targetFilesCount: job.targetFilesCount || undefined,
      processingStartedAt: job.processingStartedAt || undefined,
      filesProcessed: job.filesProcessed || undefined,
      filesSucceeded: job.filesSucceeded || undefined,
      filesFailed: job.filesFailed || undefined,
      requestedByUserId: job.requestedByUserId || '',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      finishedAt: job.finishedAt || undefined,
      failureCode: job.failureCode || undefined,
      failureMessage: job.failureMessage || undefined,
    };
  }
}
