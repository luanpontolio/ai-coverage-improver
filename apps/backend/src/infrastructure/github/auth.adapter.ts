import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface GitHubUser {
  id: string;
  login: string;
}

export interface GitHubInstallation {
  installationId: string;
  accountType: string;
  accountLogin: string;
}

export interface ExchangeCodeResult {
  accessToken: string;
  user: GitHubUser;
  installation?: GitHubInstallation;
}

/**
 * GitHub Auth Adapter (fetch-based)
 *
 * Builds the OAuth authorize URL and exchanges OAuth codes using plain fetch,
 * avoiding Octokit auth packages to keep compatibility with CommonJS/Node 22.
 */
@Injectable()
export class GitHubAuthAdapter {
  private get clientId(): string {
    return process.env.GITHUB_CLIENT_ID ?? '';
  }

  private get clientSecret(): string {
    return process.env.GITHUB_CLIENT_SECRET ?? '';
  }

  private get webAppUrl(): string {
    return process.env.WEB_APP_URL ?? 'http://localhost:3001';
  }

  private requireEnv() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth environment is not configured (GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET)');
    }
  }

  buildAuthUrl(returnTo?: string): { redirectUrl: string; state: string } {
    this.requireEnv();
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
    this.requireEnv();
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
    const installation = await this.fetchFirstInstallation(accessToken, user);

    return { accessToken, user, installation };
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

  private async fetchFirstInstallation(
    accessToken: string,
    fallbackUser: GitHubUser,
  ): Promise<GitHubInstallation | undefined> {
    const res = await fetch('https://api.github.com/user/installations', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ai-coverage-improver',
      },
    });

    if (!res.ok) {
      // Non-fatal: user may not have an installation yet
      return undefined;
    }

    const json = await res.json();
    const installation = (json.installations ?? [])[0];
    if (!installation) {
      return undefined;
    }

    return {
      installationId: String(installation.id),
      accountType: installation.account?.type ?? 'User',
      accountLogin: installation.account?.login ?? fallbackUser.login,
    };
  }
}
