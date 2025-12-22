import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const TEST_DB_PATH = path.join(__dirname, '../prisma/test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

// Set test database URL before any imports that might use it
process.env.DATABASE_URL = TEST_DB_URL;

let prisma: PrismaClient;

/**
 * Get or create Prisma client for tests
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Clean all tables in the test database
 */
export async function cleanDatabase(): Promise<void> {
  const client = getTestPrismaClient();

  // Delete in order to respect foreign key constraints
  await client.aIExecution.deleteMany();
  await client.improvementJob.deleteMany();
  await client.coverageFileMetric.deleteMany();
  await client.coverageSnapshot.deleteMany();
  await client.repository.deleteMany();
  await client.githubInstallation.deleteMany();
}

/**
 * Setup test database - run migrations
 */
export async function setupTestDatabase(): Promise<void> {
  // Ensure test database directory exists
  const dbDir = path.dirname(TEST_DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Run migrations on test database
  try {
    execSync(
      `npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma`,
      {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        stdio: 'inherit',
      },
    );
  } catch (error) {
    // If migrations fail, try db push as fallback
    execSync(
      `npx prisma db push --schema=apps/backend/prisma/schema.prisma --skip-generate`,
      {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        stdio: 'inherit',
      },
    );
  }
}

/**
 * Teardown test database - close connection and optionally delete file
 */
export async function teardownTestDatabase(deleteFile = false): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null as any;
  }

  if (deleteFile && fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

/**
 * Remove test database file
 */
export function removeTestDatabase(): void {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

/**
 * Create a mock GitHub installation for testing
 */
export async function createMockInstallation(installationId = 'test-installation-123'): Promise<string> {
  const client = getTestPrismaClient();
  const installation = await client.githubInstallation.upsert({
    where: { installationId },
    update: {},
    create: {
      installationId,
      accountType: 'User',
      accountLogin: 'test-user',
    },
  });
  return installation.installationId;
}

/**
 * Create a mock repository for testing
 */
export async function createMockRepository(
  repositoryId: string,
  options?: {
    name?: string;
    owner?: string;
    defaultBranch?: string;
    provider?: string;
    installationId?: string;
  },
): Promise<string> {
  const client = getTestPrismaClient();
  
  // Ensure installation exists
  const installationId = options?.installationId || (await createMockInstallation());
  
  const repo = await client.repository.upsert({
    where: { id: repositoryId },
    update: {
      name: options?.name || 'demo-repo',
      owner: options?.owner || 'demo-owner',
      defaultBranch: options?.defaultBranch || 'main',
      provider: options?.provider || 'github',
    },
    create: {
      id: repositoryId,
      name: options?.name || 'demo-repo',
      owner: options?.owner || 'demo-owner',
      defaultBranch: options?.defaultBranch || 'main',
      provider: options?.provider || 'github',
      installationId,
    },
  });
  
  return repo.id;
}

