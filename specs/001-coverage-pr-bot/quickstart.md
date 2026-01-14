# Quickstart: TypeScript Coverage (001-coverage-pr-bot)

**Goal**: Run the API + worker + web UI locally and verify the core workflow end-to-end.

## Prerequisites

- Docker + Docker Compose
- A GitHub App configured for this product (for local dev)

## Environment

Create a local environment file(s) for containers (exact mechanism depends on implementation), providing at minimum:

- GitHub App credentials (App ID, installation scope, private key)
- Session/auth secret(s)
- Redis connection info
- LLM provider configuration (OpenAI-compatible base URL + API key)

## Run locally (MVP)

1. Start dependencies:
   - Redis
   - API
   - Worker
   - Web

2. Open the web UI and sign in via GitHub App flow.

## Validate the core flows

### 1) View low-coverage TypeScript files

- Select a repository where the GitHub App is installed.
- Ensure the coverage report file exists on the default branch at the configured path (MVP supports:
  `coverage/lcov.info` or `coverage/coverage-final.json`).
- Confirm the UI lists TypeScript files and highlights those below 80%.

### 2) Request an improvement

- Choose a file below 80%.
- Request an improvement job (repo admin/owner only).
- Confirm the job shows progress and reaches a terminal state.

### 3) Review the pull request

- Confirm the system creates/updates a PR against the default branch.
- Confirm the diff includes **only** `*.test.ts` files and no production/source changes.

## Troubleshooting

- Missing coverage file: show “unsupported/missing coverage report” error (no job execution).
- Not repo admin/owner: deny improvement request with a clear error.
- Duplicate request: reuse the existing open PR for that repo+file.


