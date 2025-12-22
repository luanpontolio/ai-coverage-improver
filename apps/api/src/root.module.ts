import { Module } from '@nestjs/common';
import { HealthController } from './api/http/controllers/health.controller';
import { AuthController } from './api/http/controllers/auth.controller';
import { ReposController } from './api/http/controllers/repos.controller';
import { CoverageController } from './api/http/controllers/coverage.controller';
import { ImprovementsController } from './api/http/controllers/improvements.controller';

// Operations
import { ListInstallationRepositoriesOperation } from './application/operations/list-installation-repositories.operation';
import { AnalyzeRepositoryCoverageOperation } from './application/operations/analyze-repository-coverage.operation';
import { RequestCoverageImprovementOperation } from './application/operations/request-coverage-improvement.operation';
import { RunCoverageImprovementOperation } from './application/operations/run-coverage-improvement.operation';

// Infrastructure Adapters
import { GitHubReposAdapter } from './infrastructure/github/repos.adapter';
import { CoverageSourceAdapter } from './infrastructure/github/coverage-source.adapter';
import { ImprovementQueue } from './infrastructure/queue';

// Infrastructure Adapters
import { PrismaService } from './infrastructure/db/prisma.service';

// Infrastructure Repositories
import { CoverageRepository } from './infrastructure/db/coverage.repository';
import { JobRepository } from './infrastructure/db/job.repository';
import { InstallationRepository } from './infrastructure/db/installation.repository';

@Module({
  imports: [],
  controllers: [
    HealthController,
    AuthController,
    ReposController,
    CoverageController,
    ImprovementsController,
  ],
  providers: [
    // Operations (Application Layer)
    ListInstallationRepositoriesOperation,
    AnalyzeRepositoryCoverageOperation,
    RequestCoverageImprovementOperation,
    RunCoverageImprovementOperation,

    // Infrastructure Adapters
    GitHubReposAdapter,
    CoverageSourceAdapter,
    ImprovementQueue,

    // Infrastructure Database
    PrismaService,

    // Infrastructure Repositories
    CoverageRepository,
    JobRepository,
    InstallationRepository,
  ],
})
export class AppModule {}

