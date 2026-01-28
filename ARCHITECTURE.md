# Architecture: DDD + Operations Pattern

This project follows **Domain-Driven Design (DDD)** combined with the **Operations (Interaction) Pattern** instead of the traditional NestJS Service pattern.

## Why Not Services?

Traditional NestJS applications often lead to:
- **God services** with too many responsibilities
- **Implicit workflows** hidden in service methods
- **Tight coupling** between controllers and business logic
- **Difficulty reusing** logic in background jobs or workers

## Pattern Overview

```
Controller / Worker / CLI
  └── Operation (one interaction)
        └── Domain + Infrastructure Adapters + Repositories
```

### Key Principles

1. **One Operation = One Business Interaction**
   - Each operation represents a complete, meaningful business use case
   - Operations are named after what the system does, not technical concerns

2. **No Business Logic in Controllers**
   - Controllers parse input, call one operation, return output
   - They do NOT orchestrate workflows or call multiple operations

3. **Framework-Aware vs Framework-Independent**
   - **Operations**: Live in application layer, use NestJS DI, orchestrate domain
   - **Domain**: Framework-independent, pure business logic

4. **Operations Replace Services**
   - Files named `*.operation.ts` instead of `*.service.ts`
   - Each operation is a single interaction, not a collection of methods

## Project Structure

```
apps/backend/src/
├── domain/                           # Framework-independent business logic
│   ├── repository.ts                 # Repository domain entity
│   ├── coverage-snapshot.ts          # Coverage snapshot domain entity
│   └── improvement-job.ts            # Improvement job domain entity
│
├── application/
│   └── operations/                   # Business operations (replaces services)
│       ├── list-installation-repositories.operation.ts
│       ├── analyze-repository-coverage.operation.ts
│       ├── request-coverage-improvement.operation.ts
│       ├── run-coverage-improvement.operation.ts
│       ├── generate-tests-with-ai.operation.ts
│       ├── get-job-status.operation.ts
│       ├── start-github-auth.operation.ts
│       └── complete-github-auth.operation.ts
│
├── infrastructure/
│   ├── github/                       # External API adapters
│   │   ├── repos.adapter.ts         # GitHub API → Domain entities
│   │   ├── auth.adapter.ts          # GitHub OAuth adapter
│   │   └── coverage-source.adapter.ts
│   ├── db/                          # Data persistence
│   │   ├── prisma.service.ts        # Prisma client service
│   │   ├── coverage.repository.ts
│   │   ├── job.repository.ts
│   │   └── installation.repository.ts
│   └── queue/                       # Job queue infrastructure
│       └── index.ts
│
├── api/
│   └── http/
│       └── controllers/             # HTTP interface
│           ├── health.controller.ts
│           ├── auth.controller.ts
│           ├── repos.controller.ts
│           ├── coverage.controller.ts
│           └── improvements.controller.ts
│
├── workers/                         # Background job processors
│   └── improvement.worker.ts
│
├── middleware/                      # HTTP middleware
│   ├── auth.guard.ts
│   └── logging.ts
│
├── types/                           # Type definitions
│   └── shims.d.ts                   # TypeScript shims for NestJS/Prisma
│
├── root.module.ts                   # NestJS module configuration
└── main.ts                          # Application entry point
```

## Layer Responsibilities

### Domain Layer (`domain/`)

**Purpose**: Pure business logic, framework-independent

**Contains**:
- Domain entities with business rules
- Value objects
- Domain services (if needed)

**Rules**:
- ❌ No framework imports (NestJS, Express, etc.)
- ❌ No infrastructure concerns (HTTP, database, external APIs)
- ✅ Business rules and validation
- ✅ Domain-specific calculations

**Example**: `ImprovementJob` entity

```typescript
class ImprovementJob {
  markAsRunning(): void {
    if (this.props.status !== 'queued') {
      throw new Error('Can only start a queued job');
    }
    // Business rule enforced in domain
  }
}
```

### Application Layer (`application/operations/`)

**Purpose**: Orchestrate use cases using domain + infrastructure

**Contains**:
- Operations (one per business interaction)
- Each operation has clear input/output types

**Rules**:
- ✅ Can use NestJS DI (`@Injectable()`)
- ✅ Orchestrates domain entities and infrastructure adapters
- ✅ Handles one complete business interaction
- ❌ Does not contain HTTP concerns (status codes, headers)
- ❌ Does not call other operations (avoids hidden workflows)

**Example**: `RequestCoverageImprovementOperation`

```typescript
@Injectable()
export class RequestCoverageImprovementOperation {
  constructor(
    private readonly githubReposAdapter: GitHubReposAdapter,
    private readonly jobRepository: JobRepository,
    private readonly queue: ImprovementQueue,
  ) {}

  async execute(input: RequestCoverageImprovementInput): Promise<RequestCoverageImprovementOutput> {
    // 1. Validate using domain rules
    ImprovementJob.validateTargetFilePath(input.filePath);
    
    // 2. Use infrastructure to fetch data
    const repo = await this.githubReposAdapter.findRepositoryById(input.repositoryId);
    
    // 3. Apply business logic
    const existingJob = await this.jobRepository.findOpenByRepoAndFile(...);
    if (existingJob) { return { job: existingJob, reused: true }; }
    
    // 4. Create and persist domain entity
    const job = await this.jobRepository.createJob(...);
    
    // 5. Trigger infrastructure action
    await this.queue.enqueue(job.id, ...);
    
    return { job, reused: false };
  }
}
```

### Infrastructure Layer (`infrastructure/`)

**Purpose**: Technical implementations, external system adapters

**Contains**:
- Adapters for external APIs (GitHub, AI services)
- Repository implementations (database access)
- Queue implementations
- File system operations

**Rules**:
- ✅ Implements technical concerns
- ✅ Adapts external systems to domain interfaces
- ✅ Can use NestJS DI
- ❌ Should not contain business rules (those belong in domain)

**Example**: `GitHubReposAdapter`

```typescript
@Injectable()
export class GitHubReposAdapter {
  async findRepositoryById(repoId: string): Promise<Repository | undefined> {
    const githubRepo = await findRepoById(repoId);
    return githubRepo ? Repository.fromGitHubRepo(githubRepo) : undefined;
  }
}
```

### API Layer (`api/http/controllers/`)

**Purpose**: HTTP interface, thin routing layer

**Contains**:
- HTTP controllers
- Route definitions
- Request/response mapping

**Rules**:
- ✅ Parse HTTP input
- ✅ Call ONE operation
- ✅ Map operation output to HTTP response
- ❌ No business logic
- ❌ No orchestration of multiple operations
- ❌ No direct database or external API calls

**Example**: `ImprovementsController`

```typescript
@Controller('repos/:repoId/improvements')
export class ImprovementsController {
  constructor(
    private readonly requestCoverageImprovementOperation: RequestCoverageImprovementOperation,
  ) {}

  @Post()
  async requestImprovement(@Param('repoId') repoId: string, @Body() body: RequestImprovementBody) {
    // Parse input
    const input = { repositoryId: repoId, filePath: body.filePath, ... };
    
    // Call operation
    const { job, reused } = await this.requestCoverageImprovementOperation.execute(input);
    
    // Return output
    return { job: job.toJSON(), reused };
  }
}
```

### Workers Layer (`workers/`)

**Purpose**: Background job processors

**Contains**:
- Worker entry points that execute operations

**Rules**:
- ✅ Execute ONE operation per worker
- ❌ No business logic in workers (belongs in operations)

**Example**: `improvement.worker.ts`

```typescript
export const processImprovementJob = async (jobId: string, jobRepository: JobRepository): Promise<void> => {
  const operation = new RunCoverageImprovementOperation(jobRepository);
  await operation.execute({ jobId });
};
```

## Operations in This Project

### 1. ListInstallationRepositoriesOperation
**Interaction**: Fetch all repositories accessible by the GitHub App installation

**Location**: `application/operations/list-installation-repositories.operation.ts`

**Input**: None

**Output**: `Repository[]`

**Used by**: `ReposController.list()`

---

### 2. AnalyzeRepositoryCoverageOperation
**Interaction**: Fetch, parse, and save coverage data for a repository

**Location**: `application/operations/analyze-repository-coverage.operation.ts`

**Input**: 
- `repositoryId: string`
- `thresholdPct?: number`

**Output**: 
- `snapshot: CoverageSnapshot`

**Used by**: `CoverageController.getCoverage()`

**Workflow**:
1. Find repository via GitHub adapter
2. Fetch coverage source file
3. Parse coverage content
4. Create domain entity (CoverageSnapshot)
5. Persist snapshot via repository

---

### 3. RequestCoverageImprovementOperation
**Interaction**: Create and enqueue a coverage improvement job

**Location**: `application/operations/request-coverage-improvement.operation.ts`

**Input**:
- `repositoryId: string`
- `filePath: string`
- `requestedByUserId: string`
- `isAdmin: boolean`

**Output**:
- `job: ImprovementJob`
- `reused: boolean`

**Used by**: `ImprovementsController.requestImprovement()`

**Workflow**:
1. Validate file path using domain rules
2. Check admin permissions
3. Verify repository exists
4. Check for existing open job (deduplication)
5. Create new job if needed
6. Enqueue for async processing

---

### 4. RunCoverageImprovementOperation
**Interaction**: Execute the complete coverage improvement workflow in 3 phases

**Location**: `application/operations/run-coverage-improvement.operation.ts`

**Input**:
- `jobId: string`

**Output**:
- `job: ImprovementJob`

**Used by**: `improvement.worker.processImprovementJob()`

**Workflow**:

**Phase 1: Clone Repository**
1. Mark job as cloning
2. Fetch repository metadata
3. Clone repository to local filesystem
4. Mark job as cloned

**Phase 2: Analysis**
1. Mark job as analyzing
2. Fetch coverage data from repository
3. Identify files below coverage threshold (80%)
4. Create AIExecution records for each file
5. Mark job as analyzed

**Phase 3: Batch Processing**
1. Mark job as processing
2. For each file below threshold:
   - Load LCOV coverage data
   - Parse detailed coverage for the specific file
   - Generate tests using AI (via GenerateTestsWithAIOperation)
   - Write test file to cloned repository
   - Update progress counters
3. Mark job as succeeded/failed

**Key Features**:
- Batch processing of multiple files below threshold
- Detailed progress tracking (filesProcessed, filesSucceeded, filesFailed)
- Comprehensive error categorization (REPO_CLONE_FAILED, NO_FILES_TO_IMPROVE, etc.)
- Continues processing other files even if one fails

---

### 5. StartGithubAuthOperation
**Interaction**: Initiate GitHub OAuth authentication flow

**Location**: `application/operations/start-github-auth.operation.ts`

**Input**:
- `session?: any` - Express session object
- `returnTo?: string` - Optional redirect URL after auth

**Output**:
- `redirectUrl: string` - GitHub OAuth authorization URL

**Used by**: `AuthController.start()`

**Workflow**:
1. Build GitHub OAuth URL with state token
2. Store state in session for validation
3. Store returnTo URL if provided
4. Return redirect URL

---

### 6. CompleteGithubAuthOperation
**Interaction**: Complete GitHub OAuth authentication

**Location**: `application/operations/complete-github-auth.operation.ts`

**Input**:
- `session?: any` - Express session object
- `code: string` - OAuth authorization code
- `state: string` - OAuth state token

**Output**:
- `user: { id: string; login: string }`

**Used by**: `AuthController.callback()`

**Workflow**:
1. Validate OAuth code and state
2. Verify state matches session
3. Exchange code for access token
4. Fetch GitHub user information
5. Store access token in session
6. Attach user to session
7. Return user information

**Note**: This project uses OAuth App authentication (not GitHub App), so there are no installations to manage.

---

### 7. GenerateTestsWithAIOperation
**Interaction**: Generate test code for a specific file using LLM

**Location**: `application/operations/generate-tests-with-ai.operation.ts`

**Input**:
- `clonePath: string` - Path to cloned repository
- `filePath: string` - Target file to generate tests for
- `lcovContent: string` - LCOV coverage data

**Output**:
- `testFilePath: string` - Path to generated test file
- `testCode: string` - Generated test code
- `confidence: number` - Confidence score (0-1)
- `uncoveredLinesCount: number` - Number of uncovered lines
- `targetCoverage: number` - Current coverage percentage

**Used by**: `RunCoverageImprovementOperation` (Phase 3)

**Workflow**:
1. Read source file from cloned repository
2. Parse detailed LCOV coverage for the specific file
   - Extract uncovered lines
   - Extract uncovered functions
   - Calculate current coverage percentage
3. Check for existing test files
4. Call LLM adapter with context:
   - Source code
   - Existing test code (if any)
   - Detailed coverage data
5. Write generated test code to file system
6. Return test metadata

**Key Features**:
- Parses detailed coverage data (lines, functions)
- Detects and augments existing tests
- Provides confidence score for generated tests
- Creates test directory structure automatically

---

### 8. GetJobStatusOperation
**Interaction**: Retrieve status and details of an improvement job

**Location**: `application/operations/get-job-status.operation.ts`

**Input**:
- `repositoryId: string` - Repository identifier
- `jobId: string` - Job identifier

**Output**:
- `job: ImprovementJob` - Job domain entity with full status

**Used by**: `ImprovementsController.getJobStatus()`

**Workflow**:
1. Find job by ID in repository
2. Validate job exists (throws NotFoundException if not found)
3. Wrap in domain entity
4. Return job with status

**Key Features**:
- Simple status retrieval operation
- Validates job existence
- Returns full job details including:
  - Status (queued, cloning, cloned, analyzing, analyzed, processing, succeeded, failed)
  - Progress counters (filesProcessed, filesSucceeded, filesFailed)
  - Timestamps (startedAt, clonedAt, analyzedAt, processingStartedAt, finishedAt)
  - Failure information (failureCode, failureMessage)

---

## Benefits of This Pattern

### ✅ Clear System Behavior
- Each operation name describes exactly what the system does
- No need to dig through service methods to understand workflows

### ✅ Explicit Workflows
- Operations make all steps visible
- No hidden orchestration in service methods

### ✅ No "God Services"
- Each operation is focused on one interaction
- Prevents services from growing unbounded

### ✅ Better Async Support
- Workers call the same operations as controllers
- Consistent behavior across sync and async contexts

### ✅ Easier Testing
- Test one operation = test one complete scenario
- Clear input/output boundaries

### ✅ Strong DDD Alignment
- Domain layer stays pure
- Operations coordinate domain + infrastructure
- Clean separation of concerns

---

## Next Steps

- [x] Implement actual AI generation in `RunCoverageImprovementOperation` ✅
- [x] Create operations for job status queries ✅
- [ ] Replace in-memory job queue with BullMQ + Redis
- [ ] Add authentication guard and real user context
- [ ] Create pull requests with generated tests
- [ ] Add comprehensive integration tests for each operation
- [ ] Implement re-run coverage after test generation to measure improvement