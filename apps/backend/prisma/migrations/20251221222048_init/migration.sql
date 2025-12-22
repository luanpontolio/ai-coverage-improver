-- CreateTable
CREATE TABLE "GithubInstallation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Repository_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "GithubInstallation" ("installationId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverageSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "commitSha" TEXT,
    "coverageSourcePath" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "thresholdPct" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoverageSnapshot_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverageFileMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "coveragePct" REAL NOT NULL,
    "isBelowThreshold" BOOLEAN NOT NULL,
    CONSTRAINT "CoverageFileMetric_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CoverageSnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImprovementJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "targetFilePath" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "pullRequestUrl" TEXT,
    "pullRequestNumber" INTEGER,
    CONSTRAINT "ImprovementJob_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "metadata" TEXT,
    CONSTRAINT "AIExecution_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImprovementJob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubInstallation_installationId_key" ON "GithubInstallation"("installationId");

-- CreateIndex
CREATE INDEX "CoverageSnapshot_repositoryId_ref_idx" ON "CoverageSnapshot"("repositoryId", "ref");

-- CreateIndex
CREATE INDEX "CoverageFileMetric_snapshotId_idx" ON "CoverageFileMetric"("snapshotId");

-- CreateIndex
CREATE INDEX "ImprovementJob_repositoryId_targetFilePath_status_idx" ON "ImprovementJob"("repositoryId", "targetFilePath", "status");

-- CreateIndex
CREATE INDEX "ImprovementJob_status_idx" ON "ImprovementJob"("status");
