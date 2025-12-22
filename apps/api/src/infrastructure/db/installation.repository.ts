import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface InstallationRecord {
  id: string;
  installationId: string;
  accountType: string;
  accountLogin: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Installation Repository - Infrastructure layer
 * Persists and retrieves GitHub installation data using Prisma
 */
@Injectable()
export class InstallationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(record: Omit<InstallationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    await this.prisma.githubInstallation.upsert({
      where: { installationId: record.installationId },
      update: {
        accountType: record.accountType,
        accountLogin: record.accountLogin,
      },
      create: {
        installationId: record.installationId,
        accountType: record.accountType,
        accountLogin: record.accountLogin,
      },
    });
  }

  async findByInstallationId(installationId: string): Promise<InstallationRecord | null> {
    const installation = await this.prisma.githubInstallation.findUnique({
      where: { installationId },
    });

    if (!installation) return null;

    return {
      id: installation.id,
      installationId: installation.installationId,
      accountType: installation.accountType,
      accountLogin: installation.accountLogin,
      createdAt: installation.createdAt,
      updatedAt: installation.updatedAt,
    };
  }
}

