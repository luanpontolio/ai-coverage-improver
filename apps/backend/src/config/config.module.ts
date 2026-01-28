import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';

/**
 * Configuration Module
 * 
 * Provides centralized configuration management using NestJS ConfigModule.
 * Made global to avoid importing in every module.
 * 
 * Features:
 * - Type-safe configuration access
 * - Validation at startup
 * - Environment-specific defaults
 * - No direct process.env access in application code
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env'],
      cache: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
