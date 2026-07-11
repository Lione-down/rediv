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

- Units 1-4 are complete: contract audit, guarded real-data asset/template foundations, extracted mutation/detail coordinators, the real Space controller/presentation slice, and accessible media/deletion failure semantics.
- `Space.vue` is a 497-line coordinator backed by real asset, template, and `/me` quota stores. Generation-sourced credential-free HTTPS image/video URLs render directly, while upload, relative, malformed, unsupported, missing, and decoder-failed media use stable differentiated fallbacks whose accessible names include the reason.
- Compact cards have no nested media controls; labelled video controls appear only in detail. Confirmed asset soft-delete refreshes collections and corrects an invalid last page; confirmed template hard-delete invalidates guarded detail/list state and force-refreshes the collection. Mutation failures remain owned by their exact detail target.
- The destructive alertdialog has explicit naming, cancel-first focus, Escape/Tab/Enter behavior, deletion locks, failure focus return, and a 0s reduced-motion path compatible with the installed Naive/vueuc focus trap. The 375px overview rail no longer produces an orphaned quota character.
- Final mock Chromium passed 18 assertions with 0 unexpected console errors/warnings, 320/375/920/1440 no-overflow geometry, no-ACAO real media, fallback, failure, keyboard, pagination, and refresh checks. Screenshots are under `output/playwright/t4-009-unit4/`; final production build transformed 4,693 modules.
- Fresh media privacy, deletion/session/concurrency, UI/accessibility, reduced-motion, and responsive findings were fixed; final security/contract and UI/accessibility re-reviews returned CLEAN. All current implementation files remain below 500 lines and `git diff --check` passed.
- Unit 5 real API/MySQL comparison and final cross-width acceptance remain, followed by REPORT and Task/ROADMAP closure.

## Exact Next Action

Run Unit 5's authorized local real API/MySQL comparison for asset/template rows, filters, totals, detail, media, and deletion/refresh semantics; then complete final 1440x900/920px/375px browser acceptance, production regression, fresh diff review, REPORT, and Task/ROADMAP closure only if every non-deferred criterion passes.

## Current Blockers

- T4-009 has no recorded Human gate or dependency blocker.
- T4-005 Unit B real Agnes smoke remains a separate Human cost gate and must not run without explicit authorization.
- The backend direct registration API 72-byte password boundary remains a separate normal engineering follow-up.
- No push is authorized; local cleanup and closure commits remain local until the Human Owner explicitly requests push.

## Worktree Protection

- This delivery unit started from clean `main` at `bab95e6c6ca3d2f2367395ffac31d0c4f38308f1`, with no staged, modified, untracked, unmerged, detached, or in-progress Git-operation state.
- The Codex task-list single-flight query was unavailable, so branch/HEAD/index and Git-operation state must remain unchanged through staging and commit.
- This verified Unit 4 owns `frontend/src/views/app/Space.vue`, `frontend/src/views/app/components/space/{space-asset-preview,space-delete-zone,space-detail-drawer,space-overview-header,space-presentation,use-space-deletion}.*`, T4-009 PLAN/PROGRESS, and CURRENT. No backend, dependency, generated output, secret, or global design file belongs to the unit.
- `/frontend/.playwright-cli/` and `/output/playwright/` are ignored local evidence directories. Their files remain on disk and must not be deleted, moved, force-added, or included in delivery commits without a new explicit scope.
- Preserve unrelated future worktree changes; never reset, clean, or overwrite them.

## Historical Evidence

- T4-003 report: `ai/reports/REPORT-T4-003-DIRECT.md`
- T4-004 report: `ai/reports/REPORT-T4-004.md`
- T4-007 report: `ai/reports/REPORT-T4-007.md`
- T4-008 report: `ai/reports/REPORT-T4-008.md`
- Former CURRENT timeline: `ai/state/archive/CURRENT-HERMES-THROUGH-2026-07-10.md`
- Frozen Hermes operating files: `ai/automation/archive/hermes-retired-2026-07-10/`
