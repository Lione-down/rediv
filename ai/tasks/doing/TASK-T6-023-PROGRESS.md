# TASK-T6-023 PROGRESS - Template-aware Script/Image and old T6-014 closeout

- State: `DONE`
- Verification outcome: `PASS`
- Last updated: `2026-07-28`
- Baseline: `327e5d216592c8286f643e14d6819320934aed56`
- Task: [TASK-T6-023](../todo/TASK-T6-023.md)
- Plan: [TASK-T6-023-PLAN](TASK-T6-023-PLAN.md)

## Completed work

- Read `AGENTS.md`, `CURRENT.md`, and `ROADMAP.md` completely.
- Fetched `origin` and confirmed clean tracked baseline on `main`, `HEAD == origin/main`, ahead/behind `0/0`.
- Preserved the authorized untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and
  `test-results/` paths without reading, staging, resetting, stashing, cleaning, or overwriting them.
- Reconstructed the exact T6-023 objective, scope, non-goals, and acceptance from the frozen PRD, behavior matrix,
  formal redesign plan, Direct Delivery ADR, accepted modular architecture, and T6-017 through T6-022 Task/REPORT
  authority.
- Confirmed old T6-014 never had a formal Task and its useful same-card Image/batch-sibling remainder is absorbed only
  into T6-023; T6-024 through T6-027 remain excluded.
- Created the independent T6-023 Task, PLAN, and PROGRESS before any business-code edit.
- Observed focused RED: backend rejected `template_lineage` in strict Story Production (`1 failed, 4 passed`);
  frontend lacked selected-shot lineage/output propagation and stale rejection (`2 failed`).
- Added strict sanitized template/version/instance/instance-step/step/Script/shot lineage across T6-021 projection,
  Story Director request/result/merge, selected-shot Image cards, Image requests, and generation-task snapshots.
- Added owner/project/Canvas/instance/step/node validation and exact Canvas Script/Image-card snapshot comparison.
  Stale, foreign, mismatched, or omitted template lineage fails before task/provider dispatch.
- Preserved immutable Story entity/shot IDs and target-ID-only partial merge through the existing Story contract.
- Added one atomic typed N-shot Image graph projection, persisted size/ratio and supported output count, and reused
  existing history/autosave without provider, quota, generation task/job, WorkflowRun, or automatic Image 2.0 work.
- Reused existing same-card Image result and batch-sibling cloning. Siblings preserve template/shot lineage while
  clearing only runtime task/result state, so each output keeps independent task/result/asset/retry identity.
- Closed the useful remainder of provisional old T6-014 without fabricating an old Task or REPORT.
- Kept T6-024 Video compiler, T6-025 WorkflowRun, T6-026 upgrade/clone/detach, and T6-027 retirement/release untouched.

## Exact next action

Stop. T6-024 is dependency-ready for a new Direct Delivery session but is not active.

## Files changed

- `ai/tasks/todo/TASK-T6-023.md`
- `ai/tasks/doing/TASK-T6-023-PLAN.md`
- `ai/tasks/doing/TASK-T6-023-PROGRESS.md`
- `ai/reports/REPORT-T6-023.md`
- Backend template lineage schemas, resolver, Story/Image request paths, strict merge, instance projection, and tests.
- Frontend Script generation, selected-shot Image projection, generation parameters/request transport, workspace
  output-count control, and focused Chromium contracts.

## Commands run

- `git status --short --branch`, `git diff --stat`, `git diff --name-only`, `git rev-parse HEAD`: tracked baseline
  clean; protected untracked paths preserved.
- `git fetch origin`, `git rev-list --left-right --count HEAD...origin/main`: `0 0`.
- Authority and source searches used `rg`; no environment, secret, provider raw, prompt/source content, or user-owned
  evidence file was opened.
- Focused GREEN: backend Story contract `9/9`; frontend template-aware Script/Image `2/2`.
- Related backend: `51 passed, 9 subtests passed`; related Chromium: `28/28`.
- Final lineage/provider-authority hardening: backend `28/28`; Chromium Script/Image/batch `21/21`.
- Final built-artifact Chromium page flows: `2/2` against the configured `vite preview` server.
- Fresh frontend production build: PASS, `5,048 modules transformed`; changed Python modules compile.
- Project-state validator and `git diff --check`: PASS.

## Blockers and release conditions

- None. No deferred T6-023 acceptance remains.
