import { Test, TestingModule } from '@nestjs/testing';
import { LogoutOperation } from '../../src/application/operations/logout.operation';

describe('LogoutOperation', () => {
  let operation: LogoutOperation;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogoutOperation],
    }).compile();

    operation = module.get<LogoutOperation>(LogoutOperation);
  });

  it('should be defined', () => {
    expect(operation).toBeDefined();
  });

  it('should destroy session and return success', async () => {
    const mockDestroy = jest.fn((cb) => cb(null));
    const mockSession = { destroy: mockDestroy };

    const result = await operation.execute({ session: mockSession });

    expect(result.success).toBe(true);
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('should handle session destruction error', async () => {
    const mockDestroy = jest.fn((cb) => cb(new Error('Session error')));
    const mockSession = { destroy: mockDestroy };

    await expect(operation.execute({ session: mockSession })).rejects.toThrow('Session error');
  });

  it('should return success when no session provided', async () => {
    const result = await operation.execute({});

    expect(result.success).toBe(true);
  });
});
