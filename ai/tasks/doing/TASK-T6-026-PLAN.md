# TASK-T6-026 PLAN - Template instance compatibility lifecycle

- State: `DONE`
- Verification outcome: `PASS`
- Baseline: `9c0c4b57186b5e448180af5932ced6b792a3648b`
- Task: [TASK-T6-026](../todo/TASK-T6-026.md)
- Progress: [TASK-T6-026-PROGRESS](TASK-T6-026-PROGRESS.md)

## Authority and stop boundary

The frozen PRD, V1 behavior matrix/schema, immutable lifecycle from T6-019, exact-version/stable-ID/binding/step-node
lineage and instance commit authority from T6-021, current typed Canvas command/history/autosave path, and durable
WorkflowRun authority from T6-025 define this Task.

Deliver only deterministic version diff, explicit additive-compatible upgrade, stable instance clone, detach, local
override detection/protection, and minimal lifecycle UI/API adoption. Stop before T6-027 compatibility retirement,
legacy removal, release proof, or Human acceptance. Do not add another Canvas, history, autosave, job, provider,
browser-local, or mock execution authority.

## Unit 1 - Characterize authority and observe focused RED

1. Inspect T6-019 version lifecycle, T6-021 instance/binding/step-node/commit transaction and replay paths, current
   Canvas document typed mutations, T6-025 non-terminal run authority, and frontend template mutation controller.
2. Freeze strict diff/change/compatibility/override and upgrade/clone/detach request/response/error contracts,
   including deterministic IDs/fingerprints and exact stale/conflict boundaries.
3. Add focused backend REDs for pure compatibility classification, local override detection/protection, compatible
   upgrade, incompatible rejection, clone isolation/replay, detach preservation, concurrency, and zero unintended
   run/job/quota/provider mutation.
4. Add the smallest Chromium RED for structured diff/override presentation, explicit confirmations, typed mutation
   adoption, reload recovery, and review-only mobile behavior.
5. Run the exact focused tests and record the expected missing-behavior failures.

## Unit 2 - Smallest coherent backend GREEN

1. Add pure deterministic manifest diff and additive-only compatibility classification with stable ordered output and
   a canonical accepted-diff fingerprint.
2. Reconstruct current instance facts from persisted exact lineage plus the current Canvas document; detect allowed
   local overrides and protected/locked drift without logging user content.
3. Add strict owner/project/Canvas/instance-scoped diff, upgrade, clone, and detach schemas/routes with bounded
   sanitized errors.
4. Implement upgrade, clone, and detach in request-scoped MySQL/Canvas transactions using exact row locks,
   `base_revision`, canonical request fingerprints, deterministic IDs, and existing instance-commit/replay patterns.
5. Preserve T6-025 WorkflowRun rows as history; fail closed around unsafe active-run or lineage drift instead of
   rewriting run/job authority.

## Unit 3 - Minimal lifecycle frontend GREEN

1. Extend `modules/template` typed API/state for instance diff, compatible upgrade, clone, and detach.
2. Present pinned/candidate version, compatible/incompatible changes, local overrides, and protected fields in one
   accessible lifecycle surface attached to the existing template/Canvas runtime.
3. Require explicit confirmation for each mutation and adopt the committed backend document through the serialized
   typed mutation/history/autosave controller.
4. Recover authoritative state after reload, keep 375px review-only, and persist no lifecycle authority in
   `sessionStorage` or `localStorage`.

## Unit 4 - Focused, related, concurrency, and recovery regression

1. Run focused guarded-MySQL compatibility/lifecycle/transaction/replay/concurrency tests.
2. Run T6-019 through T6-025 lifecycle/preflight/instantiate/Script/Image/Video/WorkflowRun and Canvas
   revision/idempotency regression.
3. Run focused and related Chromium for instantiate, local edit, diff, upgrade, clone, detach, history/autosave,
   Canvas switch/reload, and zero implicit execution.
4. Prove backend restart/reload recovery and concurrent duplicate-request safety without a real provider call.

## Unit 5 - Fresh build, browser proof, and audit

1. Produce a fresh frontend production build before preview/browser evidence.
2. Run provider-free built-artifact browser proof for visible diff/override protection, explicit compatible upgrade,
   clone identity isolation, detach content preservation, reload recovery, and zero run/job/provider start.
3. Run changed-file compile/type checks, project-state validator, `git diff --check`, UTF-8/file-size checks,
   protected-path review, database comment checks when applicable, and owned-path sensitive/artifact scans.
4. Perform a fresh diff review against every T6-026 acceptance criterion and confirm no T6-027 scope.

## Unit 6 - Closure

1. Reconcile Task/PLAN/PROGRESS/REPORT/CURRENT/ROADMAP only after every non-deferred acceptance criterion passes.
2. Recheck `main`, the activation baseline, Git-operation/index state, and protected untracked paths immediately before
   exact-path staging.
3. Stage only owned T6-026 paths, audit the index and sensitive patterns, create one
   `type(scope): subject` commit, and push `main`.
4. Fetch and confirm the full commit SHA, `HEAD == origin/main`, and ahead/behind `0/0`.
5. Mark the thread goal complete only after no T6-026 work remains. Stop without creating or activating T6-027.
