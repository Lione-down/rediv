# Revid - Current Project State

Last updated: 2026-07-12

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid calls, real secrets, destructive or irreversible operations
- Hermes status: retired; no Queue, card, profile, Reviewer, or HANDOFF work is active
- Decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Delivery Automation

- Active: `revid-codex-direct-delivery-controller`
- Cadence: hourly at minute 00 local time
- Model: `gpt-5.4`, xhigh reasoning
- Commit policy: every completed verified unit ends in a scoped local commit; no automatic push

## Active Delivery

- Active implementation Task: `T4-013 - Full E2E, visual QA, security checks and documentation closure`
- State: `VERIFYING - DOCUMENTATION CLOSURE`
- Task: `ai/tasks/todo/TASK-T4-013.md`
- Plan: `ai/tasks/doing/TASK-T4-013-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-013-PROGRESS.md`
- Backend closure evidence: fresh `.venv` regression 189/189, focused MySQL/runtime 12/12, and disposable Alembic/schema/comments/FK matrix passed. Frontend production build and Chromium mock E2E pass 4/4, including the authenticated workflow plus Login, Home, Workspace, and Space at 1440x900, 920x900, and 375x900 with 12 sanitized screenshots and horizontal-overflow guards. Final repository/index secret hygiene passed. T4-013 now requires evidence-classified REPORT/review closure; fresh current retained-runtime record/restart inspection remains unavailable without process-supplied runtime configuration.

## Latest Completed Task

- Task: `T4-005 - GenerationTask persistence and authorized Agnes smoke`
- State: `DONE - PASS`
- Task file: `ai/tasks/todo/TASK-T4-005.md`
- Plan: `ai/tasks/doing/TASK-T4-005-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-005-PROGRESS.md`
- Report: `ai/reports/REPORT-T4-005.md`
- Outcome: GenerationTask persistence, provider diagnostics, text/image/video real smoke, runtime MySQL task/asset linkage, quota semantics, and controlled failure persistence are complete.
- Verification: real provider text/image/video PASS; real FastAPI text persistence relation PASS; controlled image failure persistence PASS; focused 11/11, generate 16/16, backend 189/189.
- Provider limitation: the successful image response exposed no provider request ID; no ID was fabricated and the nullable contract is documented.

## Project Status

- T4-003, T4-004, T4-005, T4-007, T4-008, T4-009, T4-011, and T4-012 are `DONE - PASS` within their authorized scope.
- T4-013 is `DOING - SECURITY CLOSURE` and is the only active implementation Task.

## Exact Next Action

Write `REPORT-T4-013.md` and `REVIEW-PHASE4-COMPLETE.md`, explicitly classify all mock, disposable-MySQL, retained-runtime, real-service, browser, and deferred evidence, then reconcile Task/ROADMAP/CURRENT if every non-deferred acceptance criterion is satisfied.

## Current Blockers

- No push is authorized; all commits remain local.
- Fresh current retained-runtime record and restart inspection requires process-supplied `REVID_DB_*` settings or an already configured running backend; `.env` must not be opened.
- T4-005 direct registration 72-byte password boundary and asset ordering tie behavior remain separate future engineering follow-ups and do not reopen completed Tasks.

## Worktree Protection

- The security-closure run started from clean tracked `main` at `c80f21fd6eb40965f5b2ba728dff4bc6d5d026cb`; no staged, modified, unmerged, detached, or in-progress Git-operation state existed.
- Forty-five root `.playwright-cli/*.yml` snapshots were the only pre-existing untracked paths and remain preserved/excluded.
- Additional root `.playwright-cli` outputs and ignored `output/playwright/t4-013-responsive/` evidence created during responsive QA remain excluded from staging.
- Local non-production Canvas fixture data remains preserved; broad cleanup was not authorized.
- Preserve unrelated future changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- T4-009 report: `ai/reports/REPORT-T4-009.md`
- T4-005 report: `ai/reports/REPORT-T4-005.md`
- T4-012 report: `ai/reports/REPORT-T4-012.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
