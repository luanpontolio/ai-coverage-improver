# Implementation Plan: TypeScript Coverage

**Branch**: `001-coverage-pr-bot` | **Date**: 2025-12-21 | **Spec**: `specs/001-coverage-pr-bot/spec.md`  
**Input**: Feature specification from `specs/001-coverage-pr-bot/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Build a web app + API that integrates via a GitHub App, reads a repository-committed coverage report from the default
branch, identifies TypeScript files below a fixed 80% threshold, and lets repo admins request AI-generated `*.test.ts`
changes proposed as pull requests. Improvements run asynchronously via a worker queue and never modify production code,
run tests, or auto-merge.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node.js 20 LTS)  
**Primary Dependencies**: NestJS (API), Next.js (Web), BullMQ + Redis (jobs), LangChain (AI orchestration)  
**Storage**: SQLite (MVP persistence)  
**Testing**: Jest (API + shared packages), contract validation tests, minimal E2E smoke path (as needed)  
**Target Platform**: Containerized Linux (Docker)  
**Project Type**: Modular monorepo (apps/web + apps/api + packages/*)  
**Performance Goals**: MVP usability; analyses and job status should feel responsive in UI (seconds, not minutes)  
**Constraints**: Must not execute untrusted repository tests; must only create `*.test.ts`; default-branch only; fixed 80% threshold  
**Scale/Scope**: MVP: single user / small team; support multiple repos per user; job history persisted

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **Monorepo boundaries**: No cross-app imports; shared code lives in `packages/*`.
- [ ] **Contract-first** (if API touched): Contract updated/confirmed unchanged; compatibility impact documented.
- [ ] **Minimum tests**: Required unit/integration/contract/E2E coverage included per constitution.
- [ ] **Security baseline**: No secrets committed; config validated at startup; safe error handling at boundaries.
- [ ] **Operational readiness** (if API touched): health endpoint/logging/correlation ID addressed.

**Gate Evaluation (pre-Phase 0)**:
- Monorepo boundaries: PASS (plan uses `apps/web`, `apps/api`, `packages/*`)
- Contract-first: PASS (OpenAPI contract to be authored in `specs/001-coverage-pr-bot/contracts/`)
- Minimum tests: PASS (unit tests for packages + API, integration for endpoints, contract validation)
- Security baseline: PASS (GitHub App auth, env config validation, no secrets in repo)
- Operational readiness: PASS (health endpoint + structured request logging with correlation ID)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/
├── web/
│   ├── src/                # Next.js app
│   └── tests/              # optional (MVP may rely on e2e/smoke later)
└── api/
    ├── src/                # NestJS HTTP API
    ├── test/               # Jest tests (unit/integration)
    └── prisma/ or db/       # SQLite schema/migrations (implementation choice)

packages/
├── domain/                 # domain types + invariants (no framework)
├── contracts/              # shared API schemas/types generated from OpenAPI (optional)
├── github/                 # GitHub client abstractions (App installation, repo access)
├── coverage/               # LCOV/JSON parsing + TS filtering
└── shared/                 # cross-cutting utils (logging, config, errors)

```

**Structure Decision**: Modular monorepo to enforce boundaries: UI in `apps/web`, API+worker in `apps/api`, reusable
libraries in `packages/*` per constitution.

## Complexity Tracking

No constitution violations required for this plan. Any future deviation MUST be documented here with rationale and a
follow-up task.
