/*
  Warnings:

  - You are about to drop the column `pullRequestNumber` on the `ImprovementJob` table. All the data in the column will be lost.
  - You are about to drop the column `pullRequestUrl` on the `ImprovementJob` table. All the data in the column will be lost.
  - You are about to drop the column `targetFilePath` on the `ImprovementJob` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImprovementJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clonePath" TEXT,
    "requestedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "clonedAt" DATETIME,
    "finishedAt" DATETIME,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    CONSTRAINT "ImprovementJob_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ImprovementJob" ("createdAt", "failureCode", "failureMessage", "finishedAt", "id", "repositoryId", "requestedByUserId", "startedAt", "status") SELECT "createdAt", "failureCode", "failureMessage", "finishedAt", "id", "repositoryId", "requestedByUserId", "startedAt", "status" FROM "ImprovementJob";
DROP TABLE "ImprovementJob";
ALTER TABLE "new_ImprovementJob" RENAME TO "ImprovementJob";
CREATE INDEX "ImprovementJob_repositoryId_status_idx" ON "ImprovementJob"("repositoryId", "status");
CREATE INDEX "ImprovementJob_status_idx" ON "ImprovementJob"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
