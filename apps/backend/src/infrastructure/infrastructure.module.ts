import { Module } from '@nestjs/common';
import { GitHubReposAdapter } from './github/repos.adapter';
import { GitHubAuthAdapter } from './github/auth.adapter';
import { CoverageSourceAdapter } from './github/coverage-source.adapter';
import { ImprovementQueue } from './queue';
import { PrismaService } from './db/prisma.service';
import { CoverageRepository } from './db/coverage.repository';
import { JobRepository } from './db/job.repository';
import { InstallationRepository } from './db/installation.repository';
import { RepositoryRepository } from './db/repository.repository';
import { AIExecutionRepository } from './db/ai-execution.repository';
import { LLMAdapter } from './llm/llm.adapter';

/**
 * InfrastructureModule
 *
 * Provides adapters, repositories, and low-level services.
 */
@Module({
  providers: [
    GitHubReposAdapter,
    GitHubAuthAdapter,
    CoverageSourceAdapter,
    ImprovementQueue,
    PrismaService,
    CoverageRepository,
    JobRepository,
    InstallationRepository,
    RepositoryRepository,
    AIExecutionRepository,
    LLMAdapter,
  ],
  exports: [
    GitHubReposAdapter,
    GitHubAuthAdapter,
    CoverageSourceAdapter,
    ImprovementQueue,
    PrismaService,
    CoverageRepository,
    JobRepository,
    InstallationRepository,
    RepositoryRepository,
    AIExecutionRepository,
    LLMAdapter,
  ],
})
export class InfrastructureModule {}

