import { assertAdmin, createJob, failJob, startJob, succeedJob } from '../src/improvementJob';

describe('ImprovementJob domain', () => {
  it('requires admin for creation', () => {
    expect(() =>
      createJob('job-1', { repositoryId: 'repo', targetFilePath: 'src/file.ts', requestedByUserId: 'user', isAdmin: false }),
    ).toThrow(/Admin required/);
  });

  it('creates queued job when admin', () => {
    const job = createJob('job-1', {
      repositoryId: 'repo',
      targetFilePath: 'src/file.ts',
      requestedByUserId: 'user',
      isAdmin: true,
    });
    expect(job.status).toBe('queued');
    expect(job.createdAt).toBeInstanceOf(Date);
  });

  it('transitions through running, succeeded, failed', () => {
    const created = createJob('job-1', {
      repositoryId: 'repo',
      targetFilePath: 'src/file.ts',
      requestedByUserId: 'user',
      isAdmin: true,
    });
    const running = startJob(created);
    expect(running.status).toBe('running');
    const succeeded = succeedJob(running, 'https://example.com/pr/1', 1);
    expect(succeeded.status).toBe('succeeded');
    const failed = failJob(running, 'ERROR', 'Something went wrong');
    expect(failed.status).toBe('failed');
    expect(failed.failureCode).toBe('ERROR');
  });
});

