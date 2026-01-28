import { Injectable } from '@nestjs/common';
import { AIExecutionProps, AIExecutionStatus } from '../../domain/ai-execution';
import { PrismaService } from './prisma.service';

export interface CreateAIExecutionInput {
  jobId: string;
  targetFilePath: string;
  agentType: string;
  status?: AIExecutionStatus;
  metadata?: string;
}

export interface CompleteAIExecutionInput {
  status: 'completed' | 'failed';
  testFilePath?: string;
  confidence?: number;
  uncoveredLinesBefore?: number;
  errorCode?: string;
  errorMessage?: string;
  finishedAt: Date;
}

/**
 * AI Execution Repository - Infrastructure layer
 * Persists and retrieves AIExecution entities using Prisma
 */
@Injectable()
export class AIExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AIExecutionProps | undefined> {
    const execution = await this.prisma.aIExecution.findUnique({
      where: { id },
    });

    if (!execution) return undefined;

    return this.mapToProps(execution);
  }

  async findPending(jobId: string): Promise<AIExecutionProps[]> {
    const executions = await this.prisma.aIExecution.findMany({
      where: {
        jobId,
        status: 'pending',
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    return executions.map(this.mapToProps);
  }

  async findByJobId(jobId: string): Promise<AIExecutionProps[]> {
    const executions = await this.prisma.aIExecution.findMany({
      where: { jobId },
      orderBy: {
        startedAt: 'asc',
      },
    });

    return executions.map(this.mapToProps);
  }

  async create(input: CreateAIExecutionInput): Promise<AIExecutionProps> {
    const execution = await this.prisma.aIExecution.create({
      data: {
        jobId: input.jobId,
        targetFilePath: input.targetFilePath,
        agentType: input.agentType,
        status: input.status || 'pending',
        metadata: input.metadata,
      },
    });

    return this.mapToProps(execution);
  }

  async updateStatus(
    id: string,
    status: AIExecutionStatus,
  ): Promise<AIExecutionProps> {
    const execution = await this.prisma.aIExecution.update({
      where: { id },
      data: { status },
    });

    return this.mapToProps(execution);
  }

  async complete(
    id: string,
    input: CompleteAIExecutionInput,
  ): Promise<AIExecutionProps> {
    const execution = await this.prisma.aIExecution.update({
      where: { id },
      data: {
        status: input.status,
        finishedAt: input.finishedAt,
        ...(input.testFilePath && { testFilePath: input.testFilePath }),
        ...(input.confidence !== undefined && { confidence: input.confidence }),
        ...(input.uncoveredLinesBefore !== undefined && {
          uncoveredLinesBefore: input.uncoveredLinesBefore,
        }),
        ...(input.errorCode && { errorCode: input.errorCode }),
        ...(input.errorMessage && { errorMessage: input.errorMessage }),
      },
    });

    return this.mapToProps(execution);
  }

  private mapToProps(execution: any): AIExecutionProps {
    return {
      id: execution.id,
      jobId: execution.jobId,
      targetFilePath: execution.targetFilePath,
      agentType: execution.agentType,
      status: execution.status as AIExecutionStatus,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt || undefined,
      testFilePath: execution.testFilePath || undefined,
      confidence: execution.confidence || undefined,
      uncoveredLinesBefore: execution.uncoveredLinesBefore || undefined,
      errorCode: execution.errorCode || undefined,
      errorMessage: execution.errorMessage || undefined,
      metadata: execution.metadata || undefined,
    };
  }
}
