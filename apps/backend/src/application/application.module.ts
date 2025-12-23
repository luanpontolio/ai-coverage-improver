import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ListInstallationRepositoriesOperation } from './operations/list-installation-repositories.operation';
import { AnalyzeRepositoryCoverageOperation } from './operations/analyze-repository-coverage.operation';
import { RequestCoverageImprovementOperation } from './operations/request-coverage-improvement.operation';
import { RunCoverageImprovementOperation } from './operations/run-coverage-improvement.operation';
import { StartGithubAuthOperation } from './operations/start-github-auth.operation';
import { CompleteGithubAuthOperation } from './operations/complete-github-auth.operation';

/**
 * ApplicationModule
 *
 * Wires up application-layer operations and consumes infrastructure services.
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    ListInstallationRepositoriesOperation,
    AnalyzeRepositoryCoverageOperation,
    RequestCoverageImprovementOperation,
    RunCoverageImprovementOperation,
    StartGithubAuthOperation,
    CompleteGithubAuthOperation,
  ],
  exports: [
    ListInstallationRepositoriesOperation,
    AnalyzeRepositoryCoverageOperation,
    RequestCoverageImprovementOperation,
    RunCoverageImprovementOperation,
    StartGithubAuthOperation,
    CompleteGithubAuthOperation,
  ],
})
export class ApplicationModule {}

