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
};

