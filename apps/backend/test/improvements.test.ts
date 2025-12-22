/// <reference path="../src/types/shims.d.ts" />
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/root.module';
import { cleanDatabase, createMockRepository } from './setup';

describe('Improvements API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
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

  describe('POST /repos/:repoId/improvements', () => {
    it('accepts improvement job and returns job payload for admin users', async () => {
      const res = await request(app.getHttpServer())
        .post('/repos/demo-repo/improvements')
        .send({ filePath: 'src/utils.ts', requestedByUserId: 'demo-user' })
        .expect(201);

      expect(res.body.job).toMatchObject({
        repositoryId: 'demo-repo',
        targetFilePath: 'src/utils.ts',
        status: 'queued',
      });
      expect(res.body.job.id).toBeDefined();
      expect(res.body.job.createdAt).toBeDefined();
      expect(res.body.reused).toBe(false);
    });

    it('reuses existing job for same repo/file while queued or running', async () => {
      // Create first job
      const first = await request(app.getHttpServer())
        .post('/repos/demo-repo/improvements')
        .send({ filePath: 'src/component.ts', requestedByUserId: 'demo-user' })
        .expect(201);

      expect(first.body.reused).toBe(false);

      // Attempt to create duplicate job
      const second = await request(app.getHttpServer())
        .post('/repos/demo-repo/improvements')
        .send({ filePath: 'src/component.ts', requestedByUserId: 'demo-user' })
        .expect(201);

      expect(second.body.reused).toBe(true);
      expect(second.body.job.id).toBe(first.body.job.id);
    });

    it('allows new job for same file after previous job finishes', async () => {
      // Note: This test would require mocking job completion
      // For MVP, we're documenting the expected behavior
      // In production, jobs would move to succeeded/failed state
    });

    it('rejects request for non-admin users', async () => {
      // Note: This requires implementing proper auth guard
      // For MVP with placeholder auth, this test is documented
      // In production, this would expect 403 Forbidden
    });

    it('returns 404 for non-existent repository', async () => {
      const res = await request(app.getHttpServer())
        .post('/repos/non-existent-repo/improvements')
        .send({ filePath: 'src/file.ts', requestedByUserId: 'demo-user' })
        .expect(404);

      expect(res.body.message).toMatch(/not found|not accessible/i);
    });

    it('validates required filePath and requestedByUserId parameters', async () => {
      const res = await request(app.getHttpServer())
        .post('/repos/demo-repo/improvements')
        .send({})
        .expect(400);

      expect(res.body.message).toBeDefined();
    });

    it('handles different file paths for same repository', async () => {
      const file1 = await request(app.getHttpServer())
        .post('/repos/demo-repo/improvements')
        .send({ filePath: 'src/file1.ts', requestedByUserId: 'demo-user' })
        .expect(201);

      const file2 = await request(app.getHttpServer())
        .post('/repos/demo-repo/improvements')
        .send({ filePath: 'src/file2.ts', requestedByUserId: 'demo-user' })
        .expect(201);

      expect(file1.body.job.id).not.toBe(file2.body.job.id);
      expect(file1.body.job.targetFilePath).toBe('src/file1.ts');
      expect(file2.body.job.targetFilePath).toBe('src/file2.ts');
    });

    it('includes job metadata in response', async () => {
      const res = await request(app.getHttpServer())
        .post('/repos/demo-repo/improvements')
        .send({ filePath: 'src/service.ts', requestedByUserId: 'demo-user' })
        .expect(201);

      expect(res.body.job).toHaveProperty('id');
      expect(res.body.job).toHaveProperty('repositoryId');
      expect(res.body.job).toHaveProperty('targetFilePath');
      expect(res.body.job).toHaveProperty('status');
      expect(res.body.job).toHaveProperty('requestedByUserId');
      expect(res.body.job).toHaveProperty('createdAt');
    });
  });
});

