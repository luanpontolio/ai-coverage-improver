/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/apps', '<rootDir>/packages'],
    moduleNameMapper: {
      '^@domain/(.*)$': '<rootDir>/packages/domain/src/$1',
      '^@contracts/(.*)$': '<rootDir>/packages/contracts/src/$1',
      '^@github/(.*)$': '<rootDir>/packages/github/src/$1',
      '^@coverage/(.*)$': '<rootDir>/packages/coverage/src/$1',
      '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    },
    transform: {
      '^.+\\.(ts|tsx)$': [
        'ts-jest',
        {
          tsconfig: '<rootDir>/tsconfig.base.json',
        },
      ],
    },
    setupFilesAfterEnv: ['<rootDir>/apps/backend/test/setup.ts'],
    testTimeout: 30000,
    globalSetup: '<rootDir>/apps/backend/test/global-setup.ts',
    globalTeardown: '<rootDir>/apps/backend/test/global-teardown.ts',

    // Coverage configuration
    collectCoverageFrom: [
      'apps/backend/src/**/*.{ts,tsx}',
      'packages/*/src/**/*.{ts,tsx}',
      '!**/*.d.ts',
      '!**/node_modules/**',
      '!**/dist/**',
      '!**/test/**',
      '!apps/backend/src/main.ts', // Exclude entry point
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    coverageThresholds: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  };