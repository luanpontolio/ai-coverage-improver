import { Injectable } from '@nestjs/common';

export interface LogoutInput {
  session?: any;
}

export interface LogoutOutput {
  success: boolean;
}

/**
 * Operation: Logout
 *
 * Destroys the user session, logging them out.
 */
@Injectable()
export class LogoutOperation {
  async execute(input: LogoutInput): Promise<LogoutOutput> {
    if (input.session) {
      // Destroy the session
      await new Promise<void>((resolve, reject) => {
        input.session.destroy((err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    return { success: true };
  }
}
