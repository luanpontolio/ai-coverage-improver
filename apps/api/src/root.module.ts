import { Module } from '@nestjs/common';
import { HealthController } from './api/http/controllers/health.controller';
import { AuthController } from './api/http/controllers/auth.controller';

@Module({
  imports: [],
  controllers: [HealthController, AuthController],
  providers: [],
})
export class AppModule {}

