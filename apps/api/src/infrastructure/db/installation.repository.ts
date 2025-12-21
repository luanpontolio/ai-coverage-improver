export interface InstallationRecord {
  id: string;
  installationId: string;
  accountType: string;
  accountLogin: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InstallationRepository {
  async upsert(record: InstallationRecord): Promise<void> {
    // TODO: implement persistence (SQLite/ORM)
  }

  async findByInstallationId(installationId: string): Promise<InstallationRecord | null> {
    // TODO: implement lookup
    return null;
  }
}

