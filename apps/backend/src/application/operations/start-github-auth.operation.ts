import { Injectable } from '@nestjs/common';
import { GitHubAuthAdapter } from '../../infrastructure/github/auth.adapter';

export interface StartGithubAuthInput {
  session?: any;
  returnTo?: string;
}

export interface StartGithubAuthOutput {
  redirectUrl: string;
}

/**
 * Operation: Start GitHub Auth
 *
 * Builds the GitHub OAuth URL, stores state in the session, and returns the redirect target.
 */
@Injectable()
export class StartGithubAuthOperation {
  constructor(private readonly authAdapter: GitHubAuthAdapter) {}

  async execute(input: StartGithubAuthInput): Promise<StartGithubAuthOutput> {
    const { redirectUrl, state } = this.authAdapter.buildAuthUrl(input.returnTo);
    if (input.session) {
      input.session.oauthState = state;
      if (input.returnTo) {
        input.session.returnTo = input.returnTo;
      }
    }

    return { redirectUrl };
  }
}
