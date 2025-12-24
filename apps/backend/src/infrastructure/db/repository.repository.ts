import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface RepositoryRecord {
  id: string;
  provider: string;
  owner: string;
  name: string;
  defaultBranch: string;
  installationId: string | null;
}

export interface UpsertRepositoryInput {
  provider: string;
  owner: string;
  name: string;
  defaultBranch: string;
  installationId?: string | null;
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
    console.log('=============== input ===============', input);
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
        installationId: input.installationId || null,
      },
      update: {
        defaultBranch: input.defaultBranch,
        installationId: input.installationId || null,
      },
          });

          return {
            id: repo.id,
            provider: repo.provider,
            owner: repo.owner,
            name: repo.name,
            defaultBranch: repo.defaultBranch,
            installationId: repo.installationId,
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
      installationId: repo.installationId,
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
      installationId: repo.installationId,
    };
  }
}

