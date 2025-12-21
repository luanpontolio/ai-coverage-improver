import { Controller, Get } from '@nestjs/common';
import { ReposService } from '../../../application/repos.service';

@Controller('repos')
export class ReposController {
  constructor(private readonly reposService: ReposService) {}

  @Get()
  async list() {
    const repos = await this.reposService.listRepos();
    return { repos };
  }
}

