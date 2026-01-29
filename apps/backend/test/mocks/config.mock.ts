/**
 * Mock factory for AppConfigService
 * 
 * Provides a reusable mock that can be used across all test files.
 * Returns properly structured configuration objects.
 */
export const createMockConfigService = () => ({
  github: {
    appId: 'test-app-id',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    token: 'test-github-token',
  },
  database: {
    url: 'file:./test.db',
  },
  session: {
    secret: 'test-session-secret',
  },
  coverage: {
    sourcePath: 'coverage/lcov.info',
    thresholdPct: 80,
  },
  llm: {
    apiBase: 'https://api.groq.com/openai/v1',
    apiKey: 'test-llm-api-key',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4000,
    temperature: 0.2,
  },
  server: {
    webAppUrl: 'http://localhost:3001',
    port: 3000,
    nodeEnv: 'test',
  },
  redis: {
    host: 'localhost',
    port: 6379,
    password: undefined,
  },
  isProduction: false,
  isDevelopment: false,
  isTest: true,
  all: {} as any, // Will be populated by getter
  validate: jest.fn(),
});

/**
 * Type for the mock config service
 */
export type MockConfigService = ReturnType<typeof createMockConfigService>;

/**
 * Mock factory for GitHubAuthAdapter
 * 
 * Provides a reusable mock with properly typed return values.
 */
export const createMockGitHubAuthAdapter = () => ({
  buildAuthUrl: jest.fn().mockReturnValue({
    redirectUrl: 'https://github.com/login/oauth/authorize?state=test-state',
    state: 'test-state',
  }),
  assertState: jest.fn().mockImplementation((expected?: string, received?: string) => {
    if (!expected || expected !== received) {
      throw new Error('Invalid OAuth state');
    }
  }),
  exchangeCode: jest.fn().mockResolvedValue({
    accessToken: 'gho_test_token',
    user: {
      id: '123',
      login: 'octocat',
    },
  }),
});

/**
 * Type for the mock GitHub auth adapter
 */
export type MockGitHubAuthAdapter = ReturnType<typeof createMockGitHubAuthAdapter>;
