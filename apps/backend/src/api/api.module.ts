import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { HealthController } from './http/controllers/health.controller';
import { AuthController } from './http/controllers/auth.controller';
import { ReposController } from './http/controllers/repos.controller';
import { CoverageController } from './http/controllers/coverage.controller';
import { ImprovementsController } from './http/controllers/improvements.controller';

/**
 * ApiModule
 *
 * Registers HTTP controllers and imports application layer.
 */
@Module({
  imports: [ApplicationModule],
  controllers: [HealthController, AuthController, ReposController, CoverageController, ImprovementsController],
})
export class ApiModule {}

