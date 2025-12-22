import { teardownTestDatabase } from './setup';

/**
 * Global Jest teardown - runs once after all tests
 * Cleans up test database connection
 */
export default async function globalTeardown() {
  console.log('🧹 Cleaning up test database...');
  await teardownTestDatabase();
  console.log('✅ Test database cleaned up');
}

