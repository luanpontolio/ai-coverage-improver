import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { AppConfigModule } from './config/config.module';

/**
 * AppModule (Root)
 *
 * Imports configuration module globally and the top-level ApiModule,
 * which transitively brings in ApplicationModule and InfrastructureModule
 * per NestJS module graph.
 */
@Module({
  imports: [
    AppConfigModule, // Global configuration
    ApiModule,
  ],
})
export class AppModule {}

