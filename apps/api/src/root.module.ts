import { Module } from '@nestjs/common';
import { HealthController } from './api/http/controllers/health.controller';
import { AuthController } from './api/http/controllers/auth.controller';
import { ReposController } from './api/http/controllers/repos.controller';
import { CoverageController } from './api/http/controllers/coverage.controller';
import { ReposService } from './application/repos.service';
import { CoverageService } from './application/coverage.service';
import { CoverageRepository } from './infrastructure/db/coverage.repository';

@Module({
  imports: [],
  controllers: [HealthController, AuthController, ReposController, CoverageController],
  providers: [ReposService, CoverageService, CoverageRepository],
})
export class AppModule {}

