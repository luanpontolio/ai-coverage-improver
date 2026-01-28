import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ListInstallationRepositoriesOperation } from './operations/list-installation-repositories.operation';
import { AnalyzeRepositoryCoverageOperation } from './operations/analyze-repository-coverage.operation';
import { RequestCoverageImprovementOperation } from './operations/request-coverage-improvement.operation';
import { GetJobStatusOperation } from './operations/get-job-status.operation';
import { RunCoverageImprovementOperation } from './operations/run-coverage-improvement.operation';
import { StartGithubAuthOperation } from './operations/start-github-auth.operation';
import { CompleteGithubAuthOperation } from './operations/complete-github-auth.operation';
import { GenerateTestsWithAIOperation } from './operations/generate-tests-with-ai.operation';

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
    GetJobStatusOperation,
    RunCoverageImprovementOperation,
    StartGithubAuthOperation,
    CompleteGithubAuthOperation,
    GenerateTestsWithAIOperation,
  ],
  exports: [
    ListInstallationRepositoriesOperation,
    AnalyzeRepositoryCoverageOperation,
    RequestCoverageImprovementOperation,
    GetJobStatusOperation,
    RunCoverageImprovementOperation,
    StartGithubAuthOperation,
    CompleteGithubAuthOperation,
    GenerateTestsWithAIOperation,
  ],
})
export class ApplicationModule {}

