/// <reference path="../src/types/shims.d.ts" />
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/root.module';

describe('Improvements API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts improvement job and returns job payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/repos/demo-repo/improvements')
      .send({ filePath: 'src/utils.ts' })
      .expect(201);

    expect(res.body.job).toMatchObject({
      repositoryId: 'demo-repo',
      targetFilePath: 'src/utils.ts',
    });
  });

  it('reuses existing job for same repo/file while running', async () => {
    await request(app.getHttpServer())
      .post('/repos/demo-repo/improvements')
      .send({ filePath: 'src/utils.ts' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/repos/demo-repo/improvements')
      .send({ filePath: 'src/utils.ts' })
      .expect(201);

    expect(res.body.reused).toBe(true);
  });
});

