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
- State: `DOING`
- Task file: `ai/tasks/todo/TASK-T4-009.md`
- Plan: `ai/tasks/doing/TASK-T4-009-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T4-009-PROGRESS.md`
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

## Latest T4-009 Progress

- Unit 1 contract audit and all three Unit 2 domain slices are complete: independent Space asset queries, guarded template reads, and typed asset/template detail/delete/use flows.
- Asset detail/delete IDs validate before state changes and encode path segments. Per-ID single-flight plus request/session guards prevent stale settlements; a successful soft-delete applies the returned row, clears matching detail, invalidates older requests, and refreshes previously loaded default/Space collections without converting refresh failure into mutation failure.
- Template hard-delete handles the exact 204 empty response, removes the unpaginated row, clears matching detail, and invalidates older list/detail responses. Template use returns the exact project result, reuses identical pending IDs, and rejects a different ID locally because every backend POST creates a non-idempotent project.
- Deterministic runtime evidence passed 9 original scenarios, 4 race-fix scenarios, and 3 final use-lock scenarios. All 22 focused backend asset/template contracts and the final 4,663-module production build passed.
- Deep review found two concurrency defects and one use-contract documentation mismatch; all were fixed and re-probed. Security and root adversarial review found no remaining hard stop.
- The touched asset/template stores are now 616/571 lines. Unit 3 must first extract the verified Space-only coordinator and template mutation helper into already allowed paths before adding UI logic; Space UI, accessibility/fallbacks, real API/MySQL comparison, responsive browser QA, and REPORT closure remain.

## Exact Next Action

Implement Unit 3's first bounded slice: extract the verified Space-only asset detail/delete coordinator and template mutation helper into the Task's allowed addition paths, preserve current store action contracts, bring both stores to approximately 500 lines or less, and rerun deterministic probes/build before wiring Space UI.

## Current Blockers

- T4-009 has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This delivery unit started from clean `main` at `cce0e29bc10c8909bffa934c4c5806c3710bd287` with no staged, modified, untracked, or unmerged paths.
- The Codex task-list single-flight query was unavailable, so branch/HEAD/index and Git-operation state must remain unchanged through staging and commit.
- The verified detail/mutation unit owns only `frontend/src/api/assets.ts`, `frontend/src/store/assets.ts`, `frontend/src/modules/template/{types,api,store}.ts`, the active T4-009 PLAN/PROGRESS, and CURRENT; no backend, Space UI, dependency, or global design file belongs to this unit.
- `/frontend/.playwright-cli/` and `/output/playwright/` are ignored local evidence directories. Their files remain on disk and must not be deleted, moved, force-added, or included in delivery commits without a new explicit scope.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
