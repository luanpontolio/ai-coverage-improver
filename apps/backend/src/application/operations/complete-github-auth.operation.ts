import { Injectable, BadRequestException } from '@nestjs/common';
import { GitHubAuthAdapter } from '../../infrastructure/github/auth.adapter';
import { InstallationRepository } from '../../infrastructure/db/installation.repository';

export interface CompleteGithubAuthInput {
  session?: any;
  code: string;
  state: string;
}

export interface CompleteGithubAuthOutput {
  user: {
    id: string;
    login: string;
    installationId?: string;
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
    private readonly installationRepository: InstallationRepository,
  ) {}

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

    const { user, installation } = await this.authAdapter.exchangeCode(input.code);

    if (installation) {
      await this.installationRepository.upsert({
        installationId: installation.installationId,
        accountType: installation.accountType,
        accountLogin: installation.accountLogin,
      });
    }

    if (input.session) {
      input.session.user = {
        id: user.id,
        login: user.login,
        installationId: installation?.installationId,
      };
      input.session.oauthState = undefined;
      input.session.returnTo = undefined;
    }

    return {
      user: {
        id: user.id,
        login: user.login,
        installationId: installation?.installationId,
      },
    };
  }
}
