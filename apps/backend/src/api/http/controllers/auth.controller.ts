import { Controller, Get, Post, Query, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { StartGithubAuthOperation } from '../../../application/operations/start-github-auth.operation';
import { CompleteGithubAuthOperation } from '../../../application/operations/complete-github-auth.operation';

@Controller('auth/github')
export class AuthController {
  constructor(
    private readonly startGithubAuthOperation: StartGithubAuthOperation,
    private readonly completeGithubAuthOperation: CompleteGithubAuthOperation,
  ) {
    console.log('AuthController constructor');
    console.log('startGithubAuthOperation', this.startGithubAuthOperation);
    console.log('completeGithubAuthOperation', this.completeGithubAuthOperation);
  }

  @Post('start')
  async start(
    @Req() req: Request,
    @Res() res: Response,
    @Query('returnTo') returnTo?: string,
  ) {
    console.log('start', req.session);
    console.log('returnTo', this.startGithubAuthOperation);
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
