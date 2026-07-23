# TASK-T6-007 Progress

- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-007](../todo/TASK-T6-007.md).
- Plan: [TASK-T6-007-PLAN](TASK-T6-007-PLAN.md).
- Activation date: 2026-07-23.
- Activation baseline: `07dfa5b06b4920677a513b5ac562aa191ee7eaf3`.

## Completed Work

- T6-006 replacement workflow, architecture, rejected-code disposition, and T6-007 through T6-016 sequence received explicit Human approval.
- Activated T6-007 as the sole implementation Task.
- Scoped T6-007 to replacement RED contract tests and precise expected failure fingerprints only.
- Re-read the complete active fact chain, accepted T6-006 architecture, detailed dependency-ordered execution plan, and Git baseline.
- Confirmed `HEAD` and `origin/main` are both `07dfa5b06b4920677a513b5ac562aa191ee7eaf3`.
- Confirmed the worktree contains only the preserved user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` paths.
- Mapped replacement contract ownership: T6-008 compact/durable jobs, T6-009 cursor sync, T6-010 rename/card identity, T6-012/T6-013 director/script, T6-014 same-card images, T6-015 semantic video, and T6-016 compatibility retirement.
- Added four backend RED modules covering compact submit/status/result DTOs, hard byte budgets, semantic reference preservation, nine-reference bounds, and the versioned built-in story-production document.
- Added four Playwright RED modules covering rename/history/reload identity, v2 durable submit and refresh restoration, same-card and image-batch results, non-selectable story-director ownership, semantic capability/context, and connected-image `@` binding stability.
- Labeled overlapping legacy keyframe, full-task-response, project-wide polling, and hidden result-projection expectations as compatibility behavior without changing their assertions.
- Confirmed all `21` replacement tests fail only through named `T6-007 RED [...]` fingerprints for absent runtime contracts.
- Confirmed legacy compatibility regression `32/32` and production build `4,988 modules transformed` pass.

## Remaining Work

- No T6-007 implementation or verification work remains.
- Delivery-only actions remain: exact staging, commit, push, and post-push creation of a new `/goal` Task to activate T6-008.

## Exact Next Action

Precisely stage the T6-007-owned files, review the staged diff and sensitive paths, commit and push, then create a new goal-mode Codex Task that activates T6-008 only.

## Files Changed

- `ai/tasks/todo/TASK-T6-007.md` - completed Task contract and evidence.
- `ai/tasks/doing/TASK-T6-007-PLAN.md` - dependency-ordered RED test plan.
- `ai/tasks/doing/TASK-T6-007-PROGRESS.md` - activation and exact next action.
- `ai/state/CURRENT.md` and `ai/state/ROADMAP.md` - sole active Task reconciliation.
- `ai/reports/REPORT-T6-007.md` - completion and RED failure evidence.
- `backend/tests/test_generation_job_compact_contract.py` and `backend/tests/test_generation_job_payload_budget.py` - compact DTO and hard-budget RED contracts.
- `backend/tests/test_semantic_video_reference_contract.py` and `backend/tests/test_story_director_contract.py` - semantic reference and built-in director RED contracts.
- `frontend/tests/e2e/canvas-node-rename-contract.spec.ts`, `canvas-durable-generation-contract.spec.ts`, `canvas-script-director-contract.spec.ts`, and `canvas-semantic-video-references.spec.ts` - replacement browser RED contracts.
- `backend/tests/test_generation_parameter_contract.py`, `backend/tests/test_canvas_generation_transactions.py`, `frontend/tests/e2e/canvas-generation-parameters-v6.spec.ts`, `canvas-generation-runtime-feedback.spec.ts`, and `canvas-card-work-model.spec.ts` - compatibility-only labels.

## Commands Run And Results

- `git status --short; git diff --stat; git diff --name-only; git rev-parse HEAD; git rev-parse origin/main`: baseline and preserved user-owned paths confirmed.
- Read-only source/test inventory: current v1 full-task DTOs, request-bound generation, keyframe coercion, project-wide polling, hidden result projection, selectable cinematic controls, and absent rename/durable-job contracts reconfirmed.
- Four repository-locked backend RED commands: `10/10` expected failures with compact/schema/semantic/director fingerprints.
- Four focused Chromium RED commands: `11/11` expected failures with rename/durable/same-card/batch/director/semantic fingerprints.
- `backend\.venv-ci-check\Scripts\python.exe scripts\run-backend-tests.py tests.test_generation_parameter_contract`: `13/13` pass.
- `backend\.venv-ci-check\Scripts\python.exe scripts\run-backend-tests.py tests.test_canvas_generation_transactions`: disposable-MySQL `13/13` pass.
- Legacy compatibility Playwright grep across three touched specs: `6/6` pass.
- `npm run build`: pass, `4,988 modules transformed`.
- `git diff --check`: pass; line-ending notices are Git normalization warnings, not whitespace errors.
- `backend\.venv-ci-check\Scripts\python.exe scripts\validate-project-state.py`: all metadata/link checks pass, with one intentional transition failure (`expected one active T6 Task while unfinished Tasks exist, found []`) until the required post-push T6-008 goal-mode activation restores the single-active invariant.

## Blockers And Release Conditions

- No current blocker.
- T6-008 runtime implementation remains dependency-blocked until this T6-007 delivery is committed and pushed.
