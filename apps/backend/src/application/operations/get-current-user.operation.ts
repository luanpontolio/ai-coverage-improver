import { Injectable } from '@nestjs/common';

export interface GetCurrentUserInput {
  session?: any;
}

export interface GetCurrentUserOutput {
  user: {
    id: string;
    login: string;
  } | null;
}

/**
 * Operation: Get Current User
 *
 * Returns the currently authenticated user from the session.
 */
@Injectable()
export class GetCurrentUserOperation {
  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    const user = input.session?.user;
    console.log('=============== user ===============', user);
    if (!user) {
      return { user: null };
    }

    return {
      user: {
        id: user.id,
        login: user.login,
      },
    };
  }
}
