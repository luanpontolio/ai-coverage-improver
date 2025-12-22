import { setupTestDatabase } from './setup';

/**
 * Global Jest setup - runs once before all tests
 * Sets up the test database schema
 */
export default async function globalSetup() {
  console.log('🔧 Setting up test database...');
  await setupTestDatabase();
  console.log('✅ Test database ready');
}

