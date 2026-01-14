# Research: TypeScript Coverage (001-coverage-pr-bot)

**Date**: 2025-12-21  
**Purpose**: Consolidate key technical decisions for MVP planning and avoid downstream rework.

## Decisions

### Decision: Modular monorepo layout

- **Chosen**: `apps/web`, `apps/api`, `packages/*`
- **Rationale**: Enforces constitution boundaries and keeps shared logic reusable and testable.
- **Alternatives considered**:
  - Single `src/` tree: simpler initially, but violates monorepo boundary goals and mixes concerns.

### Decision: Backend framework + pattern

- **Chosen**: NestJS with DDD-style layering and an explicit “Operation” (interaction) pattern:
  operations orchestrate; domain decides; infrastructure executes.
- **Rationale**: Produces a clear, testable workflow for “analyze coverage” and “request improvement” actions.
- **Alternatives considered**:
  - Minimal Express: faster to start, but weaker structure for job orchestration + adapters.

### Decision: Background jobs

- **Chosen**: BullMQ workers backed by Redis.
- **Rationale**: Reliable async execution, retries, and visibility for long-running improvement jobs.
- **Alternatives considered**:
  - In-process queues: simpler but brittle and not production-safe.

### Decision: Persistence (MVP)

- **Chosen**: SQLite for MVP persistence.
- **Rationale**: Minimal ops overhead; sufficient for early iterations and local deployments.
- **Alternatives considered**:
  - PostgreSQL: better concurrency/scaling; deferred until MVP proves workflows.

### Decision: Coverage report ingestion (MVP)

- **Chosen**: Parse coverage from a repository-committed file path on the **default branch**.
- **Rationale**: Aligns with safety constraints (no test execution) and avoids tight coupling to CI vendors.
- **Supported formats**: LCOV (`coverage/lcov.info`) and JSON coverage (`coverage/coverage-final.json`) as common
  outputs in TypeScript/Jest ecosystems.

### Decision: Threshold policy (MVP)

- **Chosen**: Fixed 80% threshold.
- **Rationale**: Simplifies UX, storage, and decision logic; easy to evolve to per-repo later if needed.

### Decision: Who can request improvements

- **Chosen**: Repo admin/owner only.
- **Rationale**: Reduces abuse/PR spam risk and aligns with “safe, reviewable automation” goals.

### Decision: Duplicate PR behavior

- **Chosen**: Reuse/update an existing open system PR for the same repo + file.
- **Rationale**: Prevents PR spam and keeps review context consolidated.

### Decision: AI orchestration constraints

- **Chosen**: Tool-driven agent orchestration (LangChain) with a strict output contract:
  only `*.test.ts` files; never modify production code; never install deps; never run tests.
- **Rationale**: Safety-first; keeps control with developers via PR review.

## Open Questions (Deferred to later planning/implementation)

- How to sandbox repository read/write during job execution (container isolation, resource limits).
- Scaling/retention policies for job history and logs.


