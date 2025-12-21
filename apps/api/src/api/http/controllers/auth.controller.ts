import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('auth/github')
export class AuthController {
  @Post('start')
  start(@Res() res: Response) {
    // Placeholder: build GitHub App OAuth URL
    res.json({ redirectUrl: 'https://github.com/login/oauth/authorize' });
  }

  @Get('callback')
  callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    // Placeholder: exchange code for session; set session cookie
    res.json({ status: 'signed-in', code, state });
  }
}

