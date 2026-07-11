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

- Active implementation Task: `T4-005 Unit B - Authorized Real Agnes Smoke`
- State: `BLOCKED - PROCESS KEY REQUIRED`
- Task: `ai/tasks/todo/TASK-T4-005.md`
- Plan: `ai/tasks/doing/TASK-T4-005-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-005-PROGRESS.md`
- Human cost authorization: granted on 2026-07-12 for text/image/video real smoke.
- Credential gate repair: complete and covered by regression test; local `.env` keys are now ignored by the smoke helper.
- Current constraint: Unit B requires a valid process-provided `REVID_AGNES_API_KEY`; the current process has none.
- T4-013 is not dependency-ready until T4-005 Unit B is resolved.

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
- T4-005 Unit B is `BLOCKED - PROCESS KEY REQUIRED`.
- T4-013 remains `TODO`, dependency-blocked by T4-005 Unit B.

## Exact Next Action

Supply a valid `REVID_AGNES_API_KEY` through the process environment, then run authorized text smoke; continue image and video only after text succeeds.

## Current Blockers

- A valid process-provided `REVID_AGNES_API_KEY` is required to complete authorized Unit B real smoke; the rejected local `.env` credential must not be inspected or reused. Cost authorization is already complete.
- No push is authorized; all commits remain local.
- T4-005 direct registration 72-byte password boundary and asset ordering tie behavior remain separate future engineering follow-ups and do not reopen completed Tasks.

## Worktree Protection

- This run started from clean tracked `main` at `cec8e747b478f4bac8a18e227813be25c6f2d749`; no staged, modified, unmerged, detached, or in-progress Git-operation state existed.
- Forty-five root `.playwright-cli/*.yml` snapshots were the only pre-existing untracked paths and remain preserved/excluded.
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
