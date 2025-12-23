import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

/**
 * Prisma Service - Database connection management
 *
 * Manages the Prisma Client lifecycle in NestJS
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const defaultDb = `file:${path.join(process.cwd(), 'apps/backend/prisma/data/dev.db')}`;
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || defaultDb,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('✅ Database disconnected');
  }
}

