import { Controller, Get, Post, Query, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { StartGithubAuthOperation } from '../../../application/operations/start-github-auth.operation';
import { CompleteGithubAuthOperation } from '../../../application/operations/complete-github-auth.operation';

@Controller('auth/github')
export class AuthController {
  constructor(
    private readonly startGithubAuthOperation: StartGithubAuthOperation,
    private readonly completeGithubAuthOperation: CompleteGithubAuthOperation,
  ) {}

  @Post('start')
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

  @Get('callback')
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
