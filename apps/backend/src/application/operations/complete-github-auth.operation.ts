import { Injectable, BadRequestException } from '@nestjs/common';
import { GitHubAuthAdapter } from '../../infrastructure/github/auth.adapter';
import { AppConfigService } from '../../config/config.service';

export interface CompleteGithubAuthInput {
  session?: any;
  code: string;
  state: string;
}

export interface CompleteGithubAuthOutput {
  user: {
    id: string;
    login: string;
  };
}

/**
 * Operation: Complete GitHub Auth
 *
 * Validates state, exchanges the OAuth code, persists installation metadata, and
 * attaches the signed-in user to the session.
 */
@Injectable()
export class CompleteGithubAuthOperation {
  constructor(
    private readonly authAdapter: GitHubAuthAdapter,
    private readonly configService: AppConfigService,
  ) {
    this.authAdapter = new GitHubAuthAdapter(configService);
  }

  async execute(input: CompleteGithubAuthInput): Promise<CompleteGithubAuthOutput> {
    if (!input.code) {
      throw new BadRequestException('Missing OAuth code');
    }
    if (!input.state) {
      throw new BadRequestException('Missing OAuth state');
    }

    try {
      this.authAdapter.assertState(input.session?.oauthState, input.state);
    } catch (error) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const { accessToken, user } = await this.authAdapter.exchangeCode(input.code);

    if (input.session) {
      input.session.user = {
        id: user.id,
        login: user.login,
      };
      input.session.accessToken = accessToken; // Store access token for API calls

      delete input.session.oauthState;
      delete input.session.returnTo;
    }

    return {
      user: {
        id: user.id,
        login: user.login,
      },
    };
  }
}
