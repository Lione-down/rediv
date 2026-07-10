# T4-008 Progress - Real-Data Home Project And Asset Dashboard

Last updated: 2026-07-11

## State

- Before this run: `DOING`, Slices A, B1, and B2 completed and committed
- Current: `BLOCKED`
- Bounded unit: Slice C authorized-runtime preflight
- Starting branch: `main`
- Starting HEAD: `6e2ea259c7e0b85caae6a9d72722ba02a460a546`
- Pre-existing staged/modified files: none
- Pre-existing untracked files: `frontend/.playwright-cli/` and `output/`; browser evidence only, excluded from delivery staging
- Unmerged paths, detached HEAD, or in-progress Git operation: none

## Completed Work

- Slice A project-domain foundation, Slice B1 asset-domain hardening, and Slice B2 Home presentation/session isolation remain complete and committed.
- Home is a 499-line authenticated real-data dashboard with five domain-aligned local components, explicit loading/empty/error/partial/zero-quota states, immediate project creation, and scalar `project_id` Workspace navigation.
- Previous focused evidence remains green: project-store harness 20 checks, credential-binding race harness 4 checks, mocked real-router browser matrix 12/12, responsive overflow checks at 1440/920/375, and production build with 4,663 modules.
- Confirmed the local MySQL service is listening and that `REVID_TEST_MYSQL_ADMIN_URL` is available in process environment without printing or persisting its value.
- Started a credential-safe backend launcher from an artifact directory with no `.env` loading. The backend reached local `revid_db` and failed closed because the database revision is `d8c5b9a4e2f0`, while current code requires `e9f1a2b3c4d5`.
- Inspected the pending migration: it is the existing additive generation-task migration that creates the commented `generation_tasks` table and indexes. No database or migration command was run because both are outside T4-008 scope.
- Started the frontend with Vite `envFile: false`, confirmed its local listener, then stopped the exact process owned by this run after the backend gate failed.

## Remaining Work

1. Resolve the local MySQL schema-readiness gate.
2. Run authenticated project creation, refresh persistence, recent assets, quotas, and API-failure acceptance against the real backend.
3. Cross-check the acceptance project ID, name, and `created_at` in MySQL without exposing credentials.
4. Capture 1440x900, 920px, and 375px browser, console, keyboard, copy-fit, and overflow evidence.
5. Perform the final diff review, write REPORT, and close T4-008 only if every non-deferred criterion passes.

## Exact Next Action

Human Owner chooses one release path: authorize applying existing additive migration `e9f1a2b3c4d5` to local `revid_db`, or provide an already-current authorized local runtime. Once the database reports the required revision, restart the backend and execute the full Slice C real-service matrix.

## Files Changed This Run

- `ai/tasks/todo/TASK-T4-008.md` - records the active database revision blocker and release paths.
- `ai/tasks/doing/TASK-T4-008-PLAN.md` - marks Slice C blocked at runtime preflight and adds the Human gate.
- `ai/tasks/doing/TASK-T4-008-PROGRESS.md` - records fresh runtime evidence, remaining work, and the exact release condition.
- `ai/state/CURRENT.md` - updates the rolling snapshot to `BLOCKED`.
- `ai/state/ROADMAP.md` - aligns T4-008 state with the active blocker.
- `pitfalls.md` - records the schema-readiness and no-mock-substitution rule.
- `output/playwright/t4-008-slice-c/start-backend.py` and startup logs - ignored local runtime evidence; never staged.

## Commands And Summarized Results

- Required read set, active ADR, automation memory, and Git baseline: PASS; `main` at `6e2ea259c7e0b85caae6a9d72722ba02a460a546`, no staged/modified/unmerged/Git-operation state, with only known untracked browser artifacts.
- Codex task-list single-flight query: unavailable after timeout; branch/HEAD/index fallback was used and must be rechecked before commit.
- `git status --short --branch -uall`: PASS; `main` is ahead of `origin/main` by 10 and all dirty paths are known untracked browser artifacts.
- MySQL no-password probe: expected FAIL with access denied; no credential fallback was attempted.
- Process/User/Machine environment presence check: PASS; only presence flags were printed, and the injected MySQL runtime URL was available without value disclosure.
- Credential-safe Uvicorn startup against local `revid_db`: BLOCKED before serving HTTP; exact fingerprint `Database schema revision mismatch (current=d8c5b9a4e2f0, head=e9f1a2b3c4d5)`.
- Pending migration source audit: PASS; `e9f1a2b3c4d5_add_generation_tasks.py` revises `d8c5b9a4e2f0`, creates one fully commented table and indexes, and was not executed.
- Vite startup with `envFile: false`: PASS on local port 9099; the exact owned process was stopped and the port closed after backend startup failed.
- Real-service API/MySQL/browser matrix: NOT RUN because the backend correctly rejected the stale schema. Mock evidence was not substituted.

## Blockers And Release Conditions

- Active blocker: local `revid_db` is one Alembic revision behind current code, so real backend and browser acceptance cannot run.
- Release condition: Human Owner authorizes the existing additive migration for this local database, or supplies an authorized runtime already at `e9f1a2b3c4d5`.
- Impact: T4-008 cannot write REPORT or close; Slices A/B remain implemented and previously verified.
- T4-005 Unit B remains a separate Human cost gate and is outside T4-008.
