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

- Unit 1 planning/contract audit and Unit 2's first domain slice are complete.
- The asset store now exposes an independent response-shaped Space collection with canonical query state, exact `total/page/page_size` metadata, server-equivalent identical-query single-flight, concurrent different-query handling, and A-B-A pending reuse.
- Latest-query/request/session guards suppress stale success, error, and loading transitions; synchronous token changes clear both Space and the unchanged Home/Workspace default cache.
- Space load actions return `Promise<void>`, so a stale request cannot misrepresent another query or session's collection as its own result.
- Final deterministic mock runtime probe passed 7 concurrency, metadata, error, session-reset, and cache-isolation scenarios; final TypeScript check and production build passed with 4,663 modules.
- Security and architecture review have no remaining findings. Space UI, template reads, detail/mutations, accessibility/fallbacks, real API/MySQL comparison, responsive browser QA, and REPORT closure remain.

## Exact Next Action

Implement the typed template read foundation under `frontend/src/modules/template/**`: current-user unpaginated list and detail flows with identical-request single-flight, stale response protection, and synchronous token reset. Do not add mutations or edit Space UI in that bounded slice.

## Current Blockers

- T4-009 has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This run started from clean `main` at `fb4d83f4a11332263f74dbda52122aaae0b2e6b5` with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- The Codex task-list single-flight query was unavailable, so branch/HEAD/index and Git-operation state must remain unchanged through staging and commit.
- This run owns only `frontend/src/types/asset.ts`, `frontend/src/store/assets.ts`, the active T4-009 PROGRESS, and CURRENT for the verified asset-query bounded unit.
- `/frontend/.playwright-cli/` and `/output/playwright/` are ignored local evidence directories. Their files remain on disk and must not be deleted, moved, force-added, or included in delivery commits without a new explicit scope.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
