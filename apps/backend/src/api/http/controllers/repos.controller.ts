import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ListInstallationRepositoriesOperation } from '../../../application/operations/list-installation-repositories.operation';

@Controller('repos')
export class ReposController {
  constructor(
    private readonly listInstallationRepositoriesOperation: ListInstallationRepositoriesOperation,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const session = req.session as any;
    const accessToken = session?.accessToken;
    const user = session?.user;

    if (!accessToken || !user) {
      throw new UnauthorizedException('Not authenticated');
    }

    const repos = await this.listInstallationRepositoriesOperation.execute({
      accessToken,
      installationId: user.installationId,
    });

    return { repos };
  }
}

