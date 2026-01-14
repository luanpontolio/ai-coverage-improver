# Tasks: TypeScript Coverage

**Input**: Design documents from `/specs/001-coverage-pr-bot/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for new/changed behavior per the project constitution. Include unit tests for shared/business logic and integration/contract coverage for API changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create monorepo structure per plan (apps/web, apps/api, packages/{domain,contracts,github,coverage,shared})
- [x] T002 Initialize workspace tooling (package manager, root scripts, lint/format config) in `package.json`
- [x] T003 Configure TypeScript base configs and path aliases for apps/* and packages/* in `tsconfig.*`

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Add environment config templates (GitHub App creds, Redis, SQLite, LLM) in `.env.example`
- [x] T005 Scaffold NestJS app in `apps/api/src/main.ts` with HTTP server + base modules
- [x] T006 Scaffold Next.js app in `apps/web/src/` with routing shell
- [x] T007 Scaffold shared packages (`packages/domain`, `packages/shared`, `packages/github`, `packages/coverage`, `packages/contracts`)
- [x] T008 Add request logging + correlation ID middleware in `apps/api/src/middleware/logging.ts`
- [x] T009 Add health endpoint in `apps/api/src/api/http/controllers/health.controller.ts`
- [x] T010 Configure Redis + BullMQ connection factory in `apps/api/src/infrastructure/queue/`
- [x] T011 Define SQLite schema/migrations for core tables (repositories, coverage_snapshots, coverage_files, improvement_jobs, ai_executions) in `apps/api/prisma/` or `apps/api/db/`
- [x] T039 Implement GitHub App auth start/callback controllers + session issuance in `apps/api/src/api/http/controllers/auth.controller.ts`
- [x] T040 Implement web auth flow (GitHub App redirect + callback handling) in `apps/web/src/pages/api/auth/github/*.ts`
- [x] T041 Persist GitHub installation metadata and repo access linkage in `apps/api/src/infrastructure/db/installation.repository.ts`
- [x] T042 Add API auth/session guard middleware for all secured endpoints in `apps/api/src/middleware/auth.guard.ts`

## Phase 3: User Story 1 - View Low-Coverage TypeScript Files (Priority: P1) 🎯 MVP

**Goal**: Repo owner sees TS coverage list with files below 80% highlighted.
**Independent Test**: With a coverage file on default branch, user lists repos and sees TS files + below-80% highlight.

### Tests for User Story 1 (REQUIRED) ⚠️

- [x] T012 [P] [US1] Unit tests for coverage parsers (LCOV/JSON) in `packages/coverage/test/coverage.parser.test.ts`

### Implementation for User Story 1

- [x] T013 [US1] Implement LCOV/JSON coverage parsing in `packages/coverage/src/parser.ts`
- [x] T014 [US1] Implement GitHub repo listing (installation-based) in `packages/github/src/repos.ts`
- [x] T015 [US1] Implement GET `/repos` controller + service in `apps/api/src/api/http/controllers/repos.controller.ts`
- [x] T016 [US1] Persist coverage snapshots + file metrics in `apps/api/src/infrastructure/db/coverage.repository.ts`
- [x] T017 [US1] Implement coverage fetch from default branch + parse in `apps/api/src/application/coverage.service.ts`
- [x] T018 [US1] Implement GET `/repos/{repoId}/coverage` endpoint in `apps/api/src/api/http/controllers/coverage.controller.ts`
- [x] T019 [P] [US1] Integration tests for `/repos` and `/repos/{repoId}/coverage` in `apps/api/test/coverage.e2e-spec.ts`
- [x] T020 [US1] Frontend: repo selection + coverage table UI in `apps/web/src/pages/index.tsx`
- [x] T021 [US1] Frontend: highlight files below 80% and handle missing/unsupported coverage in `apps/web/src/components/CoverageTable.tsx`

## Phase 4: User Story 2 - Request an Improvement Job (Priority: P2)

**Goal**: Repo admin requests an improvement job for a low-coverage TS file; job runs asynchronously.
**Independent Test**: For a low-coverage file, a job can be requested and reaches a terminal state with status visible.

### Tests for User Story 2 (REQUIRED) ⚠️

- [x] T022 [P] [US2] Unit tests for ImprovementJob domain (status transitions, admin-only guard) in `packages/domain/test/improvementJob.test.ts`
- [x] T023 [P] [US2] Integration tests for POST `/repos/{repoId}/improvements` (admin-only, duplicate PR reuse) in `apps/api/test/improvements.e2e-spec.ts`

### Implementation for User Story 2

- [x] T024 [US2] Add DB persistence for improvement_jobs and ai_executions in `apps/api/prisma/schema.prisma` (or `db/schema.sql`)
- [x] T025 [US2] Implement job producer service (BullMQ) in `apps/api/src/application/improvement.queue.ts`
- [x] T026 [US2] Implement POST `/repos/{repoId}/improvements` controller with admin-only check and duplicate-PR reuse in `apps/api/src/api/http/controllers/improvements.controller.ts`
- [x] T027 [US2] Implement GitHub PR client (create/update PR) in `packages/github/src/pr.ts`
- [x] T028 [US2] Implement worker to process improvement jobs (clone/fetch repo default branch, gather context, invoke AI, write `*.test.ts`, open/update PR, update status) in `apps/api/src/workers/improvement.worker.ts`
- [x] T029 [US2] Frontend: "Request improvement" action + job status display in `apps/web/src/components/JobStatus.tsx`
- [x] T043 [US2] Enforce "no test execution / no auto-merge" and default-branch base in worker + PR body in `apps/api/src/workers/improvement.worker.ts`
- [x] T044 [US2] Add failure taxonomy + user-facing error messages for job failures in `apps/api/src/api/http/filters/` and worker status updates

## Phase 5: User Story 3 - Review Proposed Tests via Pull Request (Priority: P3)

**Goal**: Developer reviews PR containing only generated tests; can see link and summary.
**Independent Test**: After a job succeeds, user can open the PR link; diff contains only `*.test.ts`.

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T030 [P] [US3] Contract/integration tests for GET `/jobs/{jobId}` including PR link in `apps/api/test/jobs.e2e-spec.ts`
- [ ] T031 [P] [US3] Worker safeguard test to ensure only `*.test.ts` files are proposed in `apps/api/test/improvement.worker.spec.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Implement GET `/jobs/{jobId}` controller to return status + PR link in `apps/api/src/api/http/controllers/jobs.controller.ts`
- [ ] T033 [US3] Enforce tests-only diff check before PR update in `apps/api/src/workers/improvement.worker.ts`
- [ ] T034 [US3] Frontend: job detail/PR link view in `apps/web/src/pages/jobs/[jobId].tsx`
- [ ] T045 [US3] Implement worker sandbox/isolation for untrusted repos (restricted FS/network) in `apps/api/src/workers/improvement.worker.ts`

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T035 [P] Update OpenAPI contract (`specs/001-coverage-pr-bot/contracts/openapi.yaml`) from implemented controllers
- [ ] T036 [P] Add structured error responses and mapping for common failure codes in `apps/api/src/api/http/filters/`
- [ ] T037 [P] Add minimal end-to-end happy-path smoke (auth → list repos → coverage → request improvement → job status) script in `apps/api/test/smoke.e2e-spec.ts`
- [ ] T038 Add docs refresh for quickstart with any updated env/config steps in `specs/001-coverage-pr-bot/quickstart.md`
- [ ] T046 [P] Align OpenAPI with fixed coverage path policy and auth/health endpoints in `specs/001-coverage-pr-bot/contracts/openapi.yaml`

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → US1 (P1) → US2 (P2) → US3 (P3) → Polish.
- US1 is MVP baseline; US2 depends on queue + GitHub PR client; US3 depends on job lifecycle from US2.

## Parallel Example: User Story 1

- Run in parallel: T012 (unit parser tests) and T014 (GitHub repo listing) before wiring controllers.
- After T015/T018, run T019 integration tests in parallel with T020/T021 frontend work.

## Implementation Strategy

1) Complete Phase 1–2 (shared + foundational).  
2) Deliver US1 as MVP (list low-coverage files).  
3) Add US2 (job request + worker).  
4) Add US3 (PR review link + tests-only guard).  
5) Polish (contract sync, error handling, smoke).

