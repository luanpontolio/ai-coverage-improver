import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface RepositoryRecord {
  id: string;
  provider: string;
  owner: string;
  name: string;
  defaultBranch: string;
}

export interface UpsertRepositoryInput {
  provider: string;
  owner: string;
  name: string;
  defaultBranch: string;
}

/**
 * Repository Database Repository
 *
 * Handles persistence of repository metadata
 */
@Injectable()
export class RepositoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: UpsertRepositoryInput): Promise<RepositoryRecord> {
    const repo = await this.prisma.repository.upsert({
      where: {
        provider_owner_name: {
          provider: input.provider,
          owner: input.owner,
          name: input.name,
        },
      },
      create: {
        provider: input.provider,
        owner: input.owner,
        name: input.name,
        defaultBranch: input.defaultBranch,
      },
      update: {
        defaultBranch: input.defaultBranch,
      },
    });

    return {
      id: repo.id,
      provider: repo.provider,
      owner: repo.owner,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
    }
  }

  async findById(id: string): Promise<RepositoryRecord | null> {
    const repo = await this.prisma.repository.findUnique({
      where: { id },
    });

    if (!repo) return null;

    return {
      id: repo.id,
      provider: repo.provider,
      owner: repo.owner,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
    };
  }

  async findByProviderOwnerName(
    provider: string,
    owner: string,
    name: string
  ): Promise<RepositoryRecord | null> {
    const repo = await this.prisma.repository.findUnique({
      where: {
        provider_owner_name: {
          provider,
          owner,
          name,
        },
      },
    });

    if (!repo) return null;

    return {
      id: repo.id,
      provider: repo.provider,
      owner: repo.owner,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
    };
  }
}

