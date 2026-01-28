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
import { ImprovementConsumer } from '../workers/improvement.consumer';

/**
 * ApplicationModule
 *
 * Wires up application-layer operations and consumes infrastructure services.
 * Registers BullMQ consumers (workers) to process background jobs.
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    // Operations
    ListInstallationRepositoriesOperation,
    AnalyzeRepositoryCoverageOperation,
    RequestCoverageImprovementOperation,
    GetJobStatusOperation,
    RunCoverageImprovementOperation,
    StartGithubAuthOperation,
    CompleteGithubAuthOperation,
    GenerateTestsWithAIOperation,
    
    // BullMQ Consumers (Workers)
    ImprovementConsumer, // Processes 'improvement' queue jobs
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

