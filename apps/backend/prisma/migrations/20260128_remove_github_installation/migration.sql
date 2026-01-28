-- Drop foreign key constraint and column from Repository
PRAGMA foreign_keys=OFF;

CREATE TABLE "Repository_new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "defaultBranch" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Repository_new" ("id", "provider", "owner", "name", "defaultBranch", "createdAt", "updatedAt")
SELECT "id", "provider", "owner", "name", "defaultBranch", "createdAt", "updatedAt"
FROM "Repository";

DROP TABLE "Repository";
ALTER TABLE "Repository_new" RENAME TO "Repository";

CREATE UNIQUE INDEX "Repository_provider_owner_name_key" ON "Repository"("provider", "owner", "name");

-- Drop GithubInstallation table
DROP TABLE IF EXISTS "GithubInstallation";

PRAGMA foreign_keys=ON;
