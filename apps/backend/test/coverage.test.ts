import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/root.module';
import { cleanDatabase, createMockRepository } from './setup';

describe('Coverage API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Clean database and create mock repository
    await cleanDatabase();
    await createMockRepository('demo-repo', {
      name: 'demo-repo',
      owner: 'demo-user',
      defaultBranch: 'main',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns available repositories', async () => {
    const res = await request(app.getHttpServer()).get('/repos').expect(200);
    expect(res.body.repos).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'demo-repo', defaultBranch: 'main' })]),
    );
  });

  it('returns coverage for a repository and flags low coverage files', async () => {
    const res = await request(app.getHttpServer()).get('/repos/demo-repo/coverage').expect(200);
    expect(res.body.repoId).toBe('demo-repo');
    expect(res.body.thresholdPct).toBe(80);
    expect(res.body.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ filePath: 'src/utils.ts', isBelowThreshold: true }),
        expect.objectContaining({ filePath: 'src/index.ts', isBelowThreshold: false }),
      ]),
    );
  });
});

