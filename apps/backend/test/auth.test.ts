import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import session from 'express-session';
import { AppModule } from '../src/root.module';
import { GitHubAuthAdapter } from '../src/infrastructure/github/auth.adapter';
import { cleanDatabase } from './setup';

class FakeGitHubAuthAdapter {
  buildAuthUrl() {
    return {
      redirectUrl: 'https://github.com/login/oauth/authorize?state=test-state',
      state: 'test-state',
    };
  }

  assertState(expected: string, received: string) {
    if (!expected || expected !== received) {
      throw new Error('Invalid OAuth state');
    }
  }

  async exchangeCode(code: string) {
    if (code !== 'valid-code') {
      throw new Error('Invalid code');
    }

    return {
      accessToken: 'token',
      user: { id: '123', login: 'octocat' },
      installation: { installationId: '999', accountType: 'User', accountLogin: 'octocat' },
    };
  }
}

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Clean database before each test suite
    await cleanDatabase();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GitHubAuthAdapter)
      .useValue(new FakeGitHubAuthAdapter())
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(
      session({
        secret: 'test-session-secret',
        resave: false,
        saveUninitialized: false,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts auth and completes callback, storing session user', async () => {
    const agent = request.agent(app.getHttpServer());

    const start = await agent.post('/auth/github/start').expect(201);
    expect(start.body.redirectUrl).toContain('github.com/login/oauth/authorize');

    const callback = await agent
      .get('/auth/github/callback')
      .query({ code: 'valid-code', state: 'test-state' })
      .expect(200);

    expect(callback.body).toMatchObject({
      status: 'signed-in',
      user: {
        id: '123',
        login: 'octocat',
        installationId: '999',
      },
    });
  });
});
