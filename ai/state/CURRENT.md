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
- Allowed additions: `frontend/src/views/app/components/space/**`, `frontend/src/modules/asset/**`, and `frontend/src/modules/template/**`.
- Forbidden: backend, Home, Workspace, Canvas, and global design-token changes.
- Acceptance requires real asset/template/MySQL comparison, detail and deletion/hidden semantics, production build, and 1440x900/920px/375px browser evidence.

## Latest T4-009 Progress

- Units 1-3 are complete: contract audit, guarded real-data asset/template foundations, extracted mutation/detail coordinators, and the real Space controller/local presentation slice.
- `Space.vue` is now a 479-line page coordinator backed by real asset, template, and `/me` quota stores. Nine scoped presentation/style files provide type filters, API pagination, loading/retained-error/empty/boundary states, differentiated basic previews, template reuse, quota counts, and asset/template detail UI.
- Native button view switching and pagination replace inaccessible controls from the installed Naive version. Persistent labelled regions, filter groups, drawer naming, bounded labels, focus visibility, contrast, reduced motion, long-content wrapping, and zero-total page correction are implemented.
- Successful template creation is persisted in the template store before navigation. Leaving Space suppresses stale route pushes without losing the new project; re-entry exposes a recoverable notice, navigation failure retains the exact ID, and template-use errors are scoped to their owning template.
- Final mock Chromium QA passed keyboard switching/pagination, zero-result recovery, stale template completion recovery, exact Workspace navigation, 320px no-overflow assertions, 375px and 1440px screenshots, and 0 console errors/warnings. Final `npm run build` transformed 4,689 modules.
- Deep security, architecture/concurrency, and UI/accessibility review findings were fixed; final architecture/concurrency and UI/accessibility re-reviews returned CLEAN. All current implementation files are below 500 lines and `git diff --check` passed.
- Unit 4 real media URL/load fallback and confirmed asset/template deletion remain, followed by Unit 5 real API/MySQL and final cross-width acceptance plus REPORT closure.

## Exact Next Action

Implement Unit 4's real image/video URL rendering and stable load fallback, then add explicitly confirmed asset/template deletion with contract-accurate collection/detail refresh behavior and focused failure/keyboard/browser verification.

## Current Blockers

- T4-009 has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This delivery unit started from clean `main` at `cf56c05f405115acb4766e27c28e71f6f6643ce5`, ahead of `origin/main` by seven commits, with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- The Codex task-list single-flight query was unavailable, so branch/HEAD/index and Git-operation state must remain unchanged through staging and commit.
- This verified UI unit owns `frontend/src/views/app/Space.vue`, `frontend/src/views/app/components/space/**`, `frontend/src/modules/template/{store,mutation-controller}.ts`, T4-009 PLAN/PROGRESS, and CURRENT. No backend, dependency, generated output, secret, or global design file belongs to the unit.
- `/frontend/.playwright-cli/` and `/output/playwright/` are ignored local evidence directories. Their files remain on disk and must not be deleted, moved, force-added, or included in delivery commits without a new explicit scope.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
