import { Test, TestingModule } from '@nestjs/testing';
import { CompleteGithubAuthOperation } from '../../src/application/operations/complete-github-auth.operation';
import { GitHubAuthAdapter } from '../../src/infrastructure/github/auth.adapter';
import { createMockGitHubAuthAdapter } from '../mocks/config.mock';

describe('CompleteGithubAuthOperation', () => {
  let operation: CompleteGithubAuthOperation;
  let authAdapter: ReturnType<typeof createMockGitHubAuthAdapter>;

  beforeEach(async () => {
    const mockAuthAdapter = createMockGitHubAuthAdapter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteGithubAuthOperation,
        {
          provide: GitHubAuthAdapter,
          useValue: mockAuthAdapter,
        },
      ],
    }).compile();

    operation = module.get<CompleteGithubAuthOperation>(CompleteGithubAuthOperation);
    authAdapter = module.get(GitHubAuthAdapter);
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should complete auth and store user in session', async () => {
    const mockSession = { oauthState: 'test-state' };
    const mockUser = { id: '456', login: 'testuser' };
    const mockAccessToken = 'gho_custom_token';

    // Override default mock for this test
    authAdapter.assertState.mockImplementation(() => {}); // No error
    authAdapter.exchangeCode.mockResolvedValue({
      accessToken: mockAccessToken,
      user: mockUser,
    });

    const result = await operation.execute({
      session: mockSession,
      code: 'auth-code',
      state: 'test-state',
    });

    expect(result.user).toEqual(mockUser);
    expect(mockSession).toEqual({
      user: mockUser,
      accessToken: mockAccessToken,
    });
    expect(authAdapter.assertState).toHaveBeenCalledWith('test-state', 'test-state');
    expect(authAdapter.exchangeCode).toHaveBeenCalledWith('auth-code');
  });

  it('should throw BadRequestException for invalid state', async () => {
    const mockSession = { oauthState: 'valid-state' };

    authAdapter.assertState.mockImplementation(() => {
      throw new Error('Invalid state');
    });

    await expect(
      operation.execute({
        session: mockSession,
        code: 'code',
        state: 'invalid-state',
      })
    ).rejects.toThrow('Invalid OAuth state');
  });

  it('should throw BadRequestException when session has no state', async () => {
    const mockSession = {};

    authAdapter.assertState.mockImplementation(() => {
      throw new Error('No state');
    });

    await expect(
      operation.execute({
        session: mockSession,
        code: 'code',
        state: 'some-state',
      })
    ).rejects.toThrow('Invalid OAuth state');
  });

  it('should work without session', async () => {
    authAdapter.assertState.mockImplementation(() => {});
    authAdapter.exchangeCode.mockResolvedValue({
      accessToken: 'token',
      user: { id: '123', login: 'octocat' },
    });

    const result = await operation.execute({
      code: 'code',
      state: 'state',
    });

    expect(result.user).toEqual({ id: '123', login: 'octocat' });
  });
});
