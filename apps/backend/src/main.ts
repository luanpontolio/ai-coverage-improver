import 'reflect-metadata';

import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import session from 'express-session';
import { AppModule } from './root.module';
import { LoggingMiddleware } from './middleware/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'warn', 'log', 'verbose', 'debug'],
  });

  // Enable CORS to allow web app (port 3001) to call backend API
  app.enableCors({
    origin: process.env.WEB_APP_URL || 'http://localhost:3001',
    credentials: true, // Allow cookies to be sent
  });

  app.use(new LoggingMiddleware().use);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
      },
    }),
  );
  await app.listen(3000);
  Logger.log('API listening on http://localhost:3000');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', err);
  process.exit(1);
});
