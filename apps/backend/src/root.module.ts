import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';

/**
 * AppModule (Root)
 *
 * Imports only the top-level ApiModule, which transitively brings in
 * ApplicationModule and InfrastructureModule per NestJS module graph.
 */
@Module({
  imports: [ApiModule],
})
export class AppModule {}

