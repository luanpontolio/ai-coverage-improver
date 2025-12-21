# AI Coverage Improver (monorepo)

Developer tool that analyzes TypeScript coverage from a repo-committed report on the default branch, highlights files below 80%, and lets repo admins request AI-generated `*.test.ts` via PRs. Monorepo layout: `apps/web`, `apps/api`, `packages/*`.

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Workspace

Install deps:
```bash
pnpm install
```

## Project Layout

- `apps/api` — NestJS API (in progress)
- `apps/web` — Next.js UI (in progress)
- `packages/domain` — domain types
- `packages/contracts` — shared API schemas
- `packages/github` — GitHub client abstractions
- `packages/coverage` — coverage parsing
- `packages/shared` — cross-cutting utilities

## Environment

Copy `.env.example` (add if missing) and fill:
- GitHub App creds
- `REDIS_URL`
- `DATABASE_URL` (SQLite)
- `SESSION_SECRET`
- `LLM_API_BASE` / `LLM_API_KEY`
- `COVERAGE_SOURCE_PATH` (default `coverage/lcov.info`)

## Scripts

Current placeholders (to be replaced as implementation proceeds):
- `pnpm lint`
- `pnpm format`
- `pnpm test`
- `pnpm dev:api`
- `pnpm dev:web`

## Notes

- Default-branch only; fixed 80% threshold; tests-only PRs; no test execution/auto-merge.

