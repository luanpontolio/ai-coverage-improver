import { Controller, Get, Post, Query, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { StartGithubAuthOperation } from '../../../application/operations/start-github-auth.operation';
import { CompleteGithubAuthOperation } from '../../../application/operations/complete-github-auth.operation';
import { GetCurrentUserOperation } from '../../../application/operations/get-current-user.operation';
import { LogoutOperation } from '../../../application/operations/logout.operation';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly startGithubAuthOperation: StartGithubAuthOperation,
    private readonly completeGithubAuthOperation: CompleteGithubAuthOperation,
    private readonly getCurrentUserOperation: GetCurrentUserOperation,
    private readonly logoutOperation: LogoutOperation,
  ) {}

  @Get('me')
  async me(@Req() req: Request) {
    console.log('=============== req.session ===============', req.session);
    const { user } = await this.getCurrentUserOperation.execute({
      session: req.session,
    });

    return { user };
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    const { success } = await this.logoutOperation.execute({
      session: req.session,
    });

    return { success };
  }

  @Post('github/start')
  async start(
    @Req() req: Request,
    @Res() res: Response,
    @Query('returnTo') returnTo?: string,
  ) {
    const { redirectUrl } = await this.startGithubAuthOperation.execute({
      session: req.session,
      returnTo,
    });

    res.json({ redirectUrl });
  }

  @Get('github/callback')
  async callback(
    @Req() req: Request,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const { user } = await this.completeGithubAuthOperation.execute({
      session: req.session,
      code,
      state,
    });

    res.json({ status: 'signed-in', user });
  }
}
