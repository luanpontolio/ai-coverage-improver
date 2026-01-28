/*
  Warnings:

  - Added the required column `targetFilePath` to the `AIExecution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImprovementJob" ADD COLUMN "analyzedAt" DATETIME;
ALTER TABLE "ImprovementJob" ADD COLUMN "filesFailed" INTEGER;
ALTER TABLE "ImprovementJob" ADD COLUMN "filesProcessed" INTEGER;
ALTER TABLE "ImprovementJob" ADD COLUMN "filesSucceeded" INTEGER;
ALTER TABLE "ImprovementJob" ADD COLUMN "processingStartedAt" DATETIME;
ALTER TABLE "ImprovementJob" ADD COLUMN "targetFilesCount" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AIExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "targetFilePath" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "testFilePath" TEXT,
    "confidence" REAL,
    "uncoveredLinesBefore" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" TEXT,
    CONSTRAINT "AIExecution_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImprovementJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AIExecution" ("agentType", "finishedAt", "id", "jobId", "metadata", "startedAt", "status") SELECT "agentType", "finishedAt", "id", "jobId", "metadata", "startedAt", "status" FROM "AIExecution";
DROP TABLE "AIExecution";
ALTER TABLE "new_AIExecution" RENAME TO "AIExecution";
CREATE INDEX "AIExecution_jobId_status_idx" ON "AIExecution"("jobId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
