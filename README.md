# AI Coverage Improver (monorepo)

Developer tool that analyzes TypeScript coverage from a repo-committed report on the default branch, highlights files below 80%, and lets repo admins request AI-generated `*.test.ts` via PRs. Monorepo layout: `apps/web`, `apps/backend`, `packages/*`.

## Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Complete guide to the DDD + Operations Pattern used in this project

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Workspace

Install deps:
```bash
pnpm install
```

## Project Layout

- `apps/backend` — NestJS API (following DDD + Operations Pattern)
- `apps/web` — Next.js UI (in progress)
- `packages/github` — GitHub client abstractions
- `packages/coverage` — coverage parsing

## Environment

Copy `.env.example` (add if missing) and fill:
- GitHub App creds
- `REDIS_URL`
- `DATABASE_URL` (SQLite)
- `SESSION_SECRET`
- `LLM_API_BASE` / `LLM_API_KEY`
- `COVERAGE_SOURCE_PATH` (default `coverage/lcov.info`)

## Scripts

- `pnpm lint` — Run linter
- `pnpm format` — Format code
- `pnpm test` — Run tests (uses test database)
- `pnpm dev:backend` — Start NestJS dev server
- `pnpm dev:web` — Start Next.js dev server
- `pnpm db:generate` — Generate Prisma Client
- `pnpm db:migrate` — Run database migrations
- `pnpm db:studio` — Open Prisma Studio

## Notes

- Default-branch only; fixed 80% threshold; tests-only PRs; no test execution/auto-merge.

