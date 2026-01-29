import { Test, TestingModule } from '@nestjs/testing';
import { GetCurrentUserOperation } from '../../src/application/operations/get-current-user.operation';

describe('GetCurrentUserOperation', () => {
  let operation: GetCurrentUserOperation;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetCurrentUserOperation],
    }).compile();

    operation = module.get<GetCurrentUserOperation>(GetCurrentUserOperation);
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should return user from session', async () => {
    const mockUser = { id: '123', login: 'octocat' };
    const mockSession = { user: mockUser };

    const result = await operation.execute({ session: mockSession });

    expect(result.user).toEqual({ id: '123', login: 'octocat' });
  });

  it('should return null when no user in session', async () => {
    const mockSession = {};

    const result = await operation.execute({ session: mockSession });

    expect(result.user).toBeNull();
  });

  it('should return null when no session provided', async () => {
    const result = await operation.execute({});

    expect(result.user).toBeNull();
  });
});
