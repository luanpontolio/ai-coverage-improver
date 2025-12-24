-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Repository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "installationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Repository_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "GithubInstallation" ("installationId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Repository" ("createdAt", "defaultBranch", "id", "installationId", "name", "owner", "provider", "updatedAt") SELECT "createdAt", "defaultBranch", "id", "installationId", "name", "owner", "provider", "updatedAt" FROM "Repository";
DROP TABLE "Repository";
ALTER TABLE "new_Repository" RENAME TO "Repository";
CREATE UNIQUE INDEX "Repository_provider_owner_name_key" ON "Repository"("provider", "owner", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
