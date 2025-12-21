import { Module } from '@nestjs/common';
import { HealthController } from './api/http/controllers/health.controller';
import { AuthController } from './api/http/controllers/auth.controller';
import { ReposController } from './api/http/controllers/repos.controller';
import { CoverageController } from './api/http/controllers/coverage.controller';
import { ImprovementsController } from './api/http/controllers/improvements.controller';
import { ReposService } from './application/repos.service';
import { CoverageService } from './application/coverage.service';
import { ImprovementQueue } from './application/improvement.queue';
import { CoverageRepository } from './infrastructure/db/coverage.repository';
import { JobRepository } from './infrastructure/db/job.repository';

@Module({
  imports: [],
  controllers: [HealthController, AuthController, ReposController, CoverageController, ImprovementsController],
  providers: [ReposService, CoverageService, ImprovementQueue, CoverageRepository, JobRepository],
})
export class AppModule {}

