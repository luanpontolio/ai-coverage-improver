# Feature Specification: TypeScript Coverage

**Feature Branch**: `001-coverage-pr-bot`  
**Created**: 2025-12-21  
**Status**: Draft  
**Input**: Developer tool that helps users improve TypeScript test coverage in GitHub repositories via a GitHub App,
coverage analysis, and AI-generated `*.test.ts` files proposed as pull requests.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - View Low-Coverage TypeScript Files (Priority: P1)

As a repository owner, I want to connect my GitHub account, select a repository, and see which TypeScript files have
low coverage so I can prioritize testing work.

**Why this priority**: This delivers immediate value (visibility + prioritization) without any code changes or risk.

**Independent Test**: A user can connect, select a repo with an existing coverage report, and see a list of TypeScript
files with coverage percentages and a clear “below threshold” indicator.

**Acceptance Scenarios**:

1. **Given** I am signed in and have access to a repository with a coverage report, **When** I select the repository,
   **Then** I see a list of TypeScript files with their coverage percentage and which are below the threshold.
2. **Given** I have selected a repository, **When** I view the coverage list, **Then** files below 80% are clearly
   highlighted as “below threshold”.

---

### User Story 2 - Request an Improvement Job (Priority: P2)

As a developer, I want to request a coverage-improvement attempt for a specific TypeScript file and track progress so
I don’t have to write boilerplate tests from scratch.

**Why this priority**: This is the core “automation” step and unlocks the end-to-end experience while keeping the user
in control.

**Independent Test**: In a repository with a known low-coverage TypeScript file, a user can request an improvement and
observe a job lifecycle that reaches a clear terminal state (succeeded with PR link, or failed with a reason).

**Acceptance Scenarios**:

1. **Given** I am viewing a low-coverage TypeScript file, **When** I request an improvement job, **Then** the system
   creates a background job and shows its status transitions (queued → running → finished).
2. **Given** an improvement job fails, **When** I view the job details, **Then** I see a clear failure reason and
   recommended next step (e.g., missing coverage report, unsupported repository setup, insufficient permissions).

---

### User Story 3 - Review Proposed Tests via Pull Request (Priority: P3)

As a developer, I want test improvements to be proposed via a pull request that changes only test files, so I can
review and validate changes using my existing CI.

**Why this priority**: This preserves safety and ownership while enabling meaningful automation.

**Independent Test**: For a selected file, the system can produce a pull request containing only `*.test.ts` changes,
and the user can click through from the product UI to the PR.

**Acceptance Scenarios**:

1. **Given** an improvement job completes successfully, **When** I view the results, **Then** I see a link to the pull
   request and a summary of what changed.
2. **Given** a pull request is created, **When** I inspect the diff, **Then** it contains only test files and does not
   modify production/source files.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Repository is not accessible to the user (permissions changed, repo deleted, private repo).
- GitHub App is not installed on the selected repository or lacks required permissions.
- Coverage report is missing, malformed, or not parseable.
- Coverage report exists but does not map cleanly to repository file paths (renames, moved files).
- Repository contains no TypeScript files, or coverage contains no TypeScript entries.
- Multiple coverage reports exist with conflicting data.
- Target file is already above threshold at the time the job runs (stale UI data).
- A job is requested for a file that no longer exists on the default branch.
- PR creation fails due to branch protection rules or repository settings.
- A prior PR for the same file already exists; system should not spam duplicate PRs and must follow the chosen
  duplicate PR policy.
- AI generation cannot produce valid tests for the repository’s existing test setup; job fails safely with an
  explanation and produces no PR.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST allow users to authenticate with GitHub and associate a GitHub identity with a product user.
- **FR-002**: System MUST list repositories the user can access where the GitHub App is installed (or clearly explain
  if installation is missing).
- **FR-002a**: System MUST analyze coverage from the repository’s default branch and MUST base improvement pull requests
  on the default branch.
- **FR-003**: System MUST analyze existing test coverage for TypeScript files only.
- **FR-004**: System MUST support parsing coverage reports in at least LCOV and JSON formats commonly produced by test
  tooling.
- **FR-004a**: System MUST support reading coverage reports from a repository file path configured by the user (or a
  documented default).
- **FR-005**: System MUST compute and display coverage per TypeScript file, including file path and percentage.
- **FR-006**: System MUST identify and highlight files below a fixed 80% threshold.
- **FR-007**: System MUST allow the user to request an improvement attempt for a specific file.
- **FR-007a**: System MUST allow requesting improvement jobs only for users who are repository admins/owners (per
  GitHub’s role model) and MUST deny other users with a clear error message.
- **FR-008**: System MUST run improvement attempts asynchronously as background jobs.
- **FR-009**: System MUST persist job state and job history and expose status to the user.
- **FR-010**: System MUST generate only test files (matching `*.test.ts`) and MUST NOT modify production/source code.
- **FR-011**: System MUST propose changes by opening a pull request in the target repository.
- **FR-012**: System MUST link improvement jobs to the generated pull request (when created) and show that link in the UI.
- **FR-012a**: If a system-generated pull request is already open for the same repository + file, the system MUST reuse
  and update that pull request rather than creating a new one.
- **FR-013**: System MUST NOT run tests on behalf of the user and MUST NOT auto-merge pull requests.
- **FR-014**: System MUST provide clear failure reasons and safe outcomes (no repo changes) when jobs fail.
- **FR-015**: System MUST isolate background job execution to reduce risk when handling untrusted repositories.

### Assumptions

- Users connect via GitHub sign-in and manage access through the GitHub App installation model.
- Coverage data is sourced from a coverage report file committed to the repository (at a configured path), such that
  the system can parse it without executing the repository’s test suite.
- Coverage analysis is performed against the repository’s default branch.
- The system detects and adapts to the repository’s existing test setup; if it cannot safely generate tests that fit,
  it fails the job with an explanation rather than guessing.

## Clarifications

### Session 2025-12-21

- Q: Where does the system read coverage reports from? → A: Repository file path (configured)
- Q: Which branch/ref is analyzed + where do PRs target? → A: Default branch only
- Q: Duplicate PR behavior (same repo + same file)? → A: Reuse the existing open PR (update it)
- Q: Who is allowed to request an improvement job? → A: Repo admin/owner only
- Q: Coverage threshold scope? → A: Fixed 80%

### API Contract *(mandatory if API is involved)*

<!--
  ACTION REQUIRED: If this feature changes or adds API behavior, specify the API surface here.
  This is a compatibility contract: consumers (including the web app) rely on it.
-->

- **Endpoints added/changed**:
  - `POST /auth/github/start`: begin GitHub sign-in
  - `GET /auth/github/callback`: complete sign-in
  - `GET /repos`: list available repositories for the signed-in user
  - `GET /repos/{repoId}/coverage`: return coverage summary + low-coverage files for TypeScript
  - `POST /repos/{repoId}/improvements`: request an improvement job for a file
  - `GET /jobs/{jobId}`: job status + result details (including PR link when available)
- **Request/Response schema changes**: Initial version; schemas include repo identifiers, file paths, coverage
  percentages, job state, timestamps, and optional PR link.
- **Auth requirements**: All endpoints (except auth callback flow) require an authenticated user session.
- **Backward compatibility**: v1 contract; any future breaking change requires migration/deprecation plan.
- **Contract location**: `specs/001-coverage-pr-bot/contracts/` (e.g., OpenAPI or equivalent)

### Key Entities *(include if feature involves data)*

- **User**: A product user account linked to a GitHub identity.
- **Repository**: A GitHub repository the user can select for analysis and improvements.
- **CoverageReport**: Parsed coverage input for a repository + point-in-time reference (e.g., commit/ref).
- **CoverageFileMetric**: Per-file TypeScript coverage percentage and below-threshold flag.
- **ImprovementJob**: Background job request for a repository + target file + status + timestamps.
- **PullRequest**: The proposed change created by the system, linked back to an ImprovementJob.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: A new user can connect GitHub and view a repository’s low-coverage TypeScript file list in under 3 minutes.
- **SC-002**: For a repository with valid coverage data, 95% of coverage analyses complete and display results without
  manual intervention.
- **SC-003**: 90% of requested improvement jobs reach a terminal state (PR created or failed with a clear reason) and
  can be understood by a developer without support.
- **SC-004**: 0% of system-generated pull requests modify production/source files; only test files are changed.
