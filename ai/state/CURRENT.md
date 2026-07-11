# Revid - Current Project State

Last updated: 2026-07-11

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
- Commit policy: every completed and verified bounded unit or Task phase ends in a scoped local commit; no empty, WIP, mixed-owner, sensitive, or automatic push commits
- Former `revid-codex-pmc-advisor`: `PAUSED`

## Active Task

- Task: `T4-009 - Real-data Space asset workspace`
- State: `TODO`
- Task file: `ai/tasks/todo/TASK-T4-009.md`
- Plan: not created; next run must create `ai/tasks/doing/TASK-T4-009-PLAN.md` before business-code edits
- Progress: not created; next run must create `ai/tasks/doing/TASK-T4-009-PROGRESS.md` before business-code edits
- Target report: `ai/reports/REPORT-T4-009.md`

## Latest Completed Task

- T4-008: `DONE - PASS`
- Report: `ai/reports/REPORT-T4-008.md`
- Outcome: Home is a 499-line authenticated real-data dashboard with project, recent-asset, quota, empty/loading/error/partial/create, session-isolation, and explicit Workspace-navigation behavior.
- Real acceptance: local MySQL revision advanced under Human authorization to `e9f1a2b3c4d5`; schema comments/indexes/FKs/collation passed; project/API/quota/asset data matched parameterized MySQL reads; UI create/reload/backend-restart/outage-recovery and 1440/920/375 browser checks passed; fresh production build transformed 4,663 modules.
- Artifact hygiene: mistaken browser/QA tracking was removed in local commit `3b449b2`; 70 local files remain preserved and ignored, with no history rewrite or push.
- Residual local data: two `t4008_*` acceptance users and project `8836c578-2db1-4624-a55d-e4bdfb25bf98` remain in `revid_db`; deletion was not authorized or performed.

## T4-009 Objective

Refactor Space into a maintainable dark personal asset workspace using real asset, template, and quota data, with filtering, pagination, accessible media previews, detail/navigation behavior, and `Space.vue` at most 500 lines.

## T4-009 Scope

- Allowed edits: `frontend/src/views/app/Space.vue` and existing asset API/store/types.
- Allowed additions: `frontend/src/views/app/components/space/**` and `frontend/src/modules/template/**`.
- Forbidden: backend, Home, Workspace, Canvas, and global design-token changes.
- Acceptance requires real asset/template/MySQL comparison, detail and deletion/hidden semantics, production build, and 1440x900/920px/375px browser evidence.

## Exact Next Action

Create the T4-009 PLAN and PROGRESS documents, then read the complete current Space, asset API/store/types, template endpoints/contracts, quota state, project navigation, and relevant backend models before choosing the first bounded implementation slice. Do not edit T4-009 business code before that contract audit and plan are durable.

## Current Blockers

- T4-009 has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This closure run started from `main` at `1f9a4b0534c53c7378c46ae4bce6e319d75f85a2` with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- Cleanup commit `3b449b2d383777ed006c947a384f60934f0f87ee` is intentional and owned by this run.
- `/frontend/.playwright-cli/` and `/output/playwright/` are ignored local evidence directories. Their files remain on disk and must not be deleted, moved, force-added, or included in delivery commits without a new explicit scope.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
