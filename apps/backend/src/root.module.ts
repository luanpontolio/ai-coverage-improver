import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ApiModule } from './api/api.module';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';

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
    
    // Configure BullMQ with Redis
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        connection: {
          host: configService.redis.host,
          port: configService.redis.port,
          password: configService.redis.password,
        },
      }),
    }),
    
    // Register 'improvement' queue
    BullModule.registerQueue({
      name: 'improvement',
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: {
          age: 86400, // Keep completed jobs for 24 hours
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 604800, // Keep failed jobs for 7 days
        },
      },
    }),
    
    ApiModule,
  ],
})
export class AppModule {}

