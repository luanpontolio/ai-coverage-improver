import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppConfigService } from '../../config/config.service';

export interface GitHubUser {
  id: string;
  login: string;
}

export interface ExchangeCodeResult {
  accessToken: string;
  user: GitHubUser;
}

/**
 * GitHub Auth Adapter (fetch-based)
 *
 * Builds the OAuth authorize URL and exchanges OAuth codes using plain fetch,
 * avoiding Octokit auth packages to keep compatibility with CommonJS/Node 22.
 */
@Injectable()
export class GitHubAuthAdapter {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly webAppUrl: string;

  constructor(private readonly configService: AppConfigService) {
    const githubConfig = this.configService.github;
    const serverConfig = this.configService.server;

    this.clientId = githubConfig.clientId;
    this.clientSecret = githubConfig.clientSecret;
    this.webAppUrl = serverConfig.webAppUrl;
  }

  buildAuthUrl(returnTo?: string): { redirectUrl: string; state: string } {
    const state = randomUUID();
    // GitHub will redirect to the web app's callback page
    const callbackUrl = new URL('/callback', this.webAppUrl).toString();
    const params = new URLSearchParams({
      client_id: this.clientId,
      state,
      redirect_uri: callbackUrl,
      scope: 'read:user read:org repo',
      allow_signup: 'false',
    });

    const redirectUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    return { redirectUrl, state };
  }

  assertState(expected: string | undefined, received: string): void {
    if (!expected || expected !== received) {
      throw new Error('Invalid OAuth state');
    }
  }

  async exchangeCode(code: string): Promise<ExchangeCodeResult> {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || tokenJson.error) {
      const message = tokenJson.error_description ?? 'GitHub OAuth token exchange failed';
      throw new Error(message);
    }

    const accessToken = tokenJson.access_token as string;
    const user = await this.fetchGitHubUser(accessToken);

    return { accessToken, user };
  }

  private async fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ai-coverage-improver',
      },
    });

    if (!res.ok) {
      throw new Error('Unable to fetch GitHub user');
    }

    const json = await res.json();
    return {
      id: String(json.id),
      login: json.login,
    };
  }
}
