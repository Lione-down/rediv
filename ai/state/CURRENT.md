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

- Active implementation Task: none
- State: `WAITING HUMAN COST GATE`
- Gate: `T4-005 Unit B - Authorized Real Agnes Smoke`
- Gate source: `ai/tasks/todo/TASK-T4-005.md`
- T4-013 is not dependency-ready until T4-005 Unit B is resolved.
- No paid text/image/video call may run without explicit Human Owner authorization.

## Latest Completed Task

- Task: `T4-012 - Canvas interaction and persistence`
- State: `DONE - PASS`
- Task file: `ai/tasks/todo/TASK-T4-012.md`
- Plan: `ai/tasks/doing/TASK-T4-012-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-012-PROGRESS.md`
- Report: `ai/reports/REPORT-T4-012.md`
- Outcome: project-scoped Canvas persistence, decomposition, optimistic rollback, move debounce/flush, multi-selection, marquee, keyboard behavior, context actions, connection selection/deletion, responsive minimap navigation, and browser acceptance are complete.
- Verification: backend Canvas CRUD 19/19; frontend build 4,702 modules; controlled and real browser/API evidence covered persistence/failure paths; 25%-200% connection/minimap QA and 1440x900/920x900/375x900 no-overflow acceptance passed.
- Final sizes: `CanvasStage.vue` 133, stage composable 473, geometry 154, SCSS 227, store 297; all Canvas-local files remain below 500 lines.

## Project Status

- T4-003, T4-004, T4-005 Unit A, T4-007, T4-008, T4-009, T4-011, and T4-012 are `DONE - PASS` within their authorized scope.
- T4-005 Unit B is `TODO - HUMAN COST GATE`.
- T4-013 remains `TODO`, dependency-blocked by T4-005 Unit B.

## Exact Next Action

Wait for the Human Owner to explicitly authorize or decline paid T4-005 Unit B text/image/video Agnes real smoke. If authorized, read the existing T4-005 Task/PLAN/PROGRESS/REPORT and execute only the authorized call class; if declined, record the product decision and reassess T4-013 dependency closure.

## Current Blockers

- Human Owner decision required: paid T4-005 Unit B real Agnes smoke authorization or explicit decline.
- No push is authorized; all commits remain local.
- T4-005 direct registration 72-byte password boundary and asset ordering tie behavior remain separate future engineering follow-ups and do not reopen completed Tasks.

## Worktree Protection

- This run started from clean tracked `main` at `42ec258792cae0d97f99df3bcc94ff44e06be3d5`; no staged, modified, unmerged, detached, or in-progress Git-operation state existed.
- Thirty-eight root `.playwright-cli/*.yml` snapshots were the only pre-existing untracked paths and remain preserved/excluded.
- Additional root `.playwright-cli` outputs and ignored `output/playwright/` evidence created during Unit B3 remain excluded from staging.
- Local non-production Canvas fixture data remains preserved; broad cleanup was not authorized.
- Preserve unrelated future changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- T4-009 report: `ai/reports/REPORT-T4-009.md`
- T4-012 report: `ai/reports/REPORT-T4-012.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
