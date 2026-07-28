# TASK-T6-025 PLAN - Durable WorkflowRun orchestration

- State: `DONE`
- Verification outcome: `PASS`
- Baseline: `5724fdfa0880a5ac6a9bf166e6467414b935d853`
- Task: [TASK-T6-025](../todo/TASK-T6-025.md)
- Progress: [TASK-T6-025-PROGRESS](TASK-T6-025-PROGRESS.md)
- Report: [REPORT-T6-025](../../reports/REPORT-T6-025.md)

## Authority and stop boundary

The frozen PRD, V1 behavior matrix/schema, completed T6-018/T6-021 persistence and exact instance lineage, T6-023
Script/Image lineage, T6-024 provider-valid Video compiler, current compact generation-job runner, and existing typed
Canvas command/history/autosave path define this Task.

Deliver only explicit durable WorkflowRun start/status/cancel, dependency scheduling, persisted job lineage, restart
reconciliation, and minimal explicit-run UI/API adoption. Stop before T6-026 upgrade/clone/detach and T6-027
retirement/release/Human acceptance. Do not create another provider, job, Canvas, browser-local, or mock execution
authority.

## Unit 1 - Characterize authority and observe focused RED

1. Inspect the T6-018 run tables, T6-021 persisted bindings/instance steps, T6-023/T6-024 card/request lineage,
   generation task transaction/repository/lease runner, frontend job sync, and current template UI.
2. Freeze request/response/state/error contracts for explicit start/read/cancel and one pure current-card step
   compiler.
3. Add focused guarded-MySQL REDs for missing start/replay/fresh-preflight/DAG/reconcile/restart/cancel behavior.
4. Add the smallest browser RED for explicit confirmation, zero implicit run, durable status recovery, and current
   same-card job adoption.
5. Run the exact focused tests and record expected missing-behavior failures.

## Unit 2 - Smallest coherent backend GREEN

1. Add strict run schemas and owner-scoped routes with bounded sanitized errors.
2. Add a request-scoped orchestration service/repository that rebuilds exact instance bindings, reruns current
   preflight, validates stable nodes/configuration, and atomically persists the run, run steps, and ready job lineage.
3. Reuse the existing generation task transaction and deterministic per-step client request identity; do not add a
   provider dispatch route.
4. Extend the existing durable job runner with repeatable persisted WorkflowRun reconciliation so a terminal job
   releases or blocks dependent steps exactly once after callbacks, process failure, or restart.
5. Keep result ingestion and Canvas materialization on current generation/asset/job-sync/typed-command authorities.

## Unit 3 - Minimal explicit-run frontend GREEN

1. Add typed API/status state for start/read/cancel under the existing template/canvas modules.
2. Expose one explicit confirmed run action only for an instantiated eligible template; do not run on parse,
   instantiate, load, selection, or card creation.
3. Recover run and step/job state after reload and adopt existing generation-job delta/result handling for the stable
   owning cards.
4. Keep mobile review-only and current Workflow/Storyboard/Canvas identity boundaries.

## Unit 4 - Focused, related, and restart regression

1. Run focused orchestration/route/repository/runner/step-compiler tests on guarded disposable MySQL.
2. Run T6-019 through T6-024 lifecycle/preflight/instantiate/Script/Image/Video and compact job/runner regression.
3. Run focused and related Chromium for template instantiate, explicit run, job sync, same-card result, cancellation,
   reload, and zero implicit execution.
4. Prove backend restart/reconcile and concurrent duplicate-worker safety without a real provider call.

## Unit 5 - Fresh build, browser proof, and audit

1. Produce a fresh frontend production build before preview/browser evidence.
2. Run provider-free built-artifact browser proof for explicit run, durable recovery, dependency/failure/cancel state,
   same-card adoption, and zero page-load/instantiate execution.
3. Run changed-file compile/type checks, project-state validator, `git diff --check`, UTF-8/file-size checks,
   protected-path review, and owned-path sensitive/database-artifact scans.
4. Perform a fresh diff review against every T6-025 acceptance criterion and confirm no T6-026/T6-027 scope.

## Unit 6 - Closure

1. Reconcile Task/PLAN/PROGRESS/REPORT/CURRENT/ROADMAP only after every non-deferred acceptance criterion passes.
2. Recheck `HEAD` against the activation baseline immediately before exact-path staging.
3. Stage only owned T6-025 paths, audit the index, create one `type(scope): subject` commit, and push `main`.
4. Fetch and confirm `HEAD == origin/main` with ahead/behind `0/0`.
5. Mark the thread goal complete only after no T6-025 work remains. Stop without activating T6-026.
