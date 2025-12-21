import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './root.module';
import { LoggingMiddleware } from './middleware/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(new LoggingMiddleware().use);
  await app.listen(3000);
  Logger.log('API listening on http://localhost:3000');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', err);
  process.exit(1);
});

