import { Test, TestingModule } from '@nestjs/testing';
import { StartGithubAuthOperation } from '../../src/application/operations/start-github-auth.operation';
import { GitHubAuthAdapter } from '../../src/infrastructure/github/auth.adapter';
import { AppConfigService } from '../../src/config/config.service';
import { createMockConfigService, createMockGitHubAuthAdapter } from '../mocks/config.mock';

describe('StartGithubAuthOperation', () => {
  let operation: StartGithubAuthOperation;
  let authAdapter: ReturnType<typeof createMockGitHubAuthAdapter>;

  beforeEach(async () => {
    const mockAuthAdapter = createMockGitHubAuthAdapter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartGithubAuthOperation,
        {
          provide: GitHubAuthAdapter,
          useValue: mockAuthAdapter,
        },
        {
          provide: AppConfigService,
          useValue: createMockConfigService(),
        },
      ],
    }).compile();

    operation = module.get<StartGithubAuthOperation>(StartGithubAuthOperation);
    authAdapter = module.get(GitHubAuthAdapter);
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should build auth URL and store state in session', async () => {
    const mockSession = {};
    const mockState = 'test-state-123';
    const mockRedirectUrl = 'https://github.com/login/oauth/authorize?state=test-state-123';

    authAdapter.buildAuthUrl.mockReturnValue({
      redirectUrl: mockRedirectUrl,
      state: mockState,
    });

    const result = await operation.execute({
      session: mockSession,
    });

    expect(result.redirectUrl).toBe(mockRedirectUrl);
    expect(mockSession).toEqual({ oauthState: mockState });
    expect(authAdapter.buildAuthUrl).toHaveBeenCalledWith(undefined);
  });

  it('should store returnTo in session when provided', async () => {
    const mockSession = {};
    const returnTo = '/dashboard';

    authAdapter.buildAuthUrl.mockReturnValue({
      redirectUrl: 'https://github.com/login',
      state: 'state',
    });

    await operation.execute({
      session: mockSession,
      returnTo,
    });

    expect(mockSession).toEqual({
      oauthState: 'state',
      returnTo: '/dashboard',
    });
    expect(authAdapter.buildAuthUrl).toHaveBeenCalledWith(returnTo);
  });

  it('should work without session', async () => {
    authAdapter.buildAuthUrl.mockReturnValue({
      redirectUrl: 'https://github.com/login',
      state: 'state',
    });

    const result = await operation.execute({});

    expect(result.redirectUrl).toBe('https://github.com/login');
  });
});
