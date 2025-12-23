import { Module } from '@nestjs/common';
import { GitHubReposAdapter } from './github/repos.adapter';
import { GitHubAuthAdapter } from './github/auth.adapter';
import { CoverageSourceAdapter } from './github/coverage-source.adapter';
import { ImprovementQueue } from './queue';
import { PrismaService } from './db/prisma.service';
import { CoverageRepository } from './db/coverage.repository';
import { JobRepository } from './db/job.repository';
import { InstallationRepository } from './db/installation.repository';

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
  ],
})
export class InfrastructureModule {}

