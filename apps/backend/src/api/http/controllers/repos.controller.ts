import { Controller, Get } from '@nestjs/common';
import { ListInstallationRepositoriesOperation } from '../../../application/operations/list-installation-repositories.operation';

@Controller('repos')
export class ReposController {
  constructor(
    private readonly listInstallationRepositoriesOperation: ListInstallationRepositoriesOperation,
  ) {}

  @Get()
  async list() {
    const repos = await this.listInstallationRepositoriesOperation.execute();
    return { repos };
  }
}

