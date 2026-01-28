import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './root.module';
import { LoggingMiddleware } from './middleware/logging';
import { AppConfigService } from './config/config.service';

const session = require('express-session');

/**
 * Graceful shutdown timeout (in milliseconds)
 * If shutdown takes longer than this, force exit
 */
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
  });

  // Get configuration service
  const configService = app.get(AppConfigService);
  
  // Validate configuration at startup
  configService.validate();

  const { server, session: sessionConfig } = configService.all;

  // Enable CORS to allow web app to call backend API
  app.enableCors({
    origin: server.webAppUrl,
    credentials: true, // Allow cookies to be sent
  });

  app.use(new LoggingMiddleware().use);
  app.use(
    session({
      secret: sessionConfig.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
      },
    }),
  );

  // Enable graceful shutdown hooks
  // This allows NestJS to properly close connections when receiving shutdown signals
  app.enableShutdownHooks();
  
  await app.listen(server.port);
  Logger.log(`🚀 API listening on http://localhost:${server.port}`);
  Logger.log(`📊 Environment: ${server.nodeEnv}`);
  Logger.log(`✅ Application started successfully`);

  // Setup graceful shutdown handlers
  setupGracefulShutdown(app);
}

/**
 * Setup graceful shutdown handlers for SIGTERM and SIGINT
 * 
 * Ensures:
 * - All connections are closed properly
 * - Database connections are released
 * - In-flight requests are completed
 * - Resources are cleaned up
 */
function setupGracefulShutdown(app: any) {
  const logger = new Logger('Shutdown');
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal');
      return;
    }

    isShuttingDown = true;
    logger.log(`📴 Received ${signal}, starting graceful shutdown...`);

    // Set a timeout to force shutdown if graceful shutdown takes too long
    const forceShutdownTimeout = setTimeout(() => {
      logger.error(`❌ Graceful shutdown timeout exceeded (${SHUTDOWN_TIMEOUT}ms), forcing exit`);
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    try {
      // Stop accepting new connections
      logger.log('🔒 Stopping new connections...');

      // Close the NestJS application
      // This will:
      // - Close all database connections
      // - Complete in-flight HTTP requests
      // - Call onModuleDestroy hooks
      // - Release all resources
      await app.close();

      logger.log('✅ Application closed successfully');
      
      // Clear the force shutdown timeout
      clearTimeout(forceShutdownTimeout);

      // Exit gracefully
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      clearTimeout(forceShutdownTimeout);
      process.exit(1);
    }
  };

  // Handle SIGTERM (docker stop, kubernetes, systemd)
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });

  logger.log('✅ Graceful shutdown handlers registered');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start API', err);
  process.exit(1);
});
