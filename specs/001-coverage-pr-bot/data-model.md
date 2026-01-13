# Data Model: TypeScript Coverage (001-coverage-pr-bot)

**Date**: 2025-12-21  
**Scope**: Entities and relationships needed for the MVP feature spec.

## Core Entities

### User

- **Purpose**: Represents an authenticated product user linked to GitHub.
- **Key fields**:
  - `id`
  - `githubUserId`
  - `githubLogin`
  - `createdAt`, `updatedAt`

### GithubInstallation

- **Purpose**: Tracks GitHub App installations and access scope for API calls.
- **Key fields**:
  - `id`
  - `installationId` (GitHub)
  - `accountType` (user/org)
  - `accountLogin`
  - `createdAt`, `updatedAt`

### Repository

- **Purpose**: A repo selected for analysis and improvements.
- **Key fields**:
  - `id`
  - `provider` (GitHub)
  - `owner`, `name`
  - `defaultBranch`
  - `installationId` (links to GithubInstallation)
  - `createdAt`, `updatedAt`

### CoverageSnapshot

- **Purpose**: Point-in-time parsed coverage for a repository default branch.
- **Key fields**:
  - `id`
  - `repositoryId`
  - `ref` (default branch name)
  - `commitSha` (optional if available)
  - `sourcePath` (coverage file path used)
  - `format` (lcov|json)
  - `createdAt`

### CoverageFileMetric

- **Purpose**: Per-file TypeScript coverage metric derived from a snapshot.
- **Key fields**:
  - `id`
  - `snapshotId`
  - `filePath`
  - `coveragePct` (0–100)
  - `isBelowThreshold` (derived; threshold fixed at 80%)

### ImprovementJob

- **Purpose**: Background job lifecycle for improving coverage for a specific file.
- **Key fields**:
  - `id`
  - `repositoryId`
  - `targetFilePath`
  - `status` (see lifecycle)
  - `requestedByUserId`
  - `createdAt`, `startedAt`, `finishedAt`
  - `failureCode` (nullable)
  - `failureMessage` (nullable)
  - `pullRequestUrl` (nullable)
  - `pullRequestNumber` (nullable)

### AIExecution

- **Purpose**: Tracks AI generation attempts for auditing/debuggability.
- **Key fields**:
  - `id`
  - `jobId`
  - `agentType`
  - `status` (started|succeeded|failed)
  - `startedAt`, `finishedAt`
  - `metadata` (non-secret: prompt version, model alias, token counts)

## Relationships

- `GithubInstallation` 1—N `Repository`
- `Repository` 1—N `CoverageSnapshot`
- `CoverageSnapshot` 1—N `CoverageFileMetric`
- `Repository` 1—N `ImprovementJob`
- `User` 1—N `ImprovementJob` (requested by)
- `ImprovementJob` 1—N `AIExecution`

## Lifecycle / State Machines

### ImprovementJob.status

- `queued`: accepted and awaiting worker pickup
- `running`: worker is processing
- `succeeded`: PR created/updated with tests-only changes
- `failed`: terminal failure (no repo changes unless a PR was successfully created)

**Rules**

- Only repo admins/owners can create a job.
- If a system PR is already open for the same repo+file, the job reuses/updates it (no duplicate PRs).
- Jobs always operate on the repository default branch as base.


