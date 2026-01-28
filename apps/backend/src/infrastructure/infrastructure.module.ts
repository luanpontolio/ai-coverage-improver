import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GitHubReposAdapter } from './github/repos.adapter';
import { GitHubAuthAdapter } from './github/auth.adapter';
import { CoverageSourceAdapter } from './github/coverage-source.adapter';
import { ImprovementProducer } from './queue/improvement.producer';
import { PrismaService } from './db/prisma.service';
import { CoverageRepository } from './db/coverage.repository';
import { JobRepository } from './db/job.repository';
import { RepositoryRepository } from './db/repository.repository';
import { AIExecutionRepository } from './db/ai-execution.repository';
import { LLMAdapter } from './llm/llm.adapter';

/**
 * InfrastructureModule
 *
 * Provides adapters, repositories, and low-level services.
 * Includes BullMQ queue access for job producers.
 */
@Module({
  imports: [
    // Import BullModule to access registered queues
    BullModule.registerQueue({
      name: 'improvement',
    }),
  ],
  providers: [
    GitHubReposAdapter,
    GitHubAuthAdapter,
    CoverageSourceAdapter,
    ImprovementProducer, // Replaced ImprovementQueue
    PrismaService,
    CoverageRepository,
    JobRepository,
    RepositoryRepository,
    AIExecutionRepository,
    LLMAdapter,
  ],
  exports: [
    GitHubReposAdapter,
    GitHubAuthAdapter,
    CoverageSourceAdapter,
    ImprovementProducer, // Export Producer for operations
    PrismaService,
    CoverageRepository,
    JobRepository,
    RepositoryRepository,
    AIExecutionRepository,
    LLMAdapter,
  ],
})
export class InfrastructureModule {}

