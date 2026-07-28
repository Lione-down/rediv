# REPORT-T6-025 - Durable WorkflowRun orchestration

- Task: [TASK-T6-025](../tasks/todo/TASK-T6-025.md)
- Plan: [TASK-T6-025-PLAN](../tasks/doing/TASK-T6-025-PLAN.md)
- Progress: [TASK-T6-025-PROGRESS](../tasks/doing/TASK-T6-025-PROGRESS.md)
- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-29`
- Activation baseline: `5724fdfa0880a5ac6a9bf166e6467414b935d853`

## Delivered

T6-025 adds an explicit, durable, owner/project/Canvas/instance-scoped WorkflowRun authority for one exact
instantiated template version. A run can start only after a fresh runtime preflight, explicit cost confirmation, and
an explicit user start. The start transaction locks and revalidates the current instance, immutable version,
persisted steps and bindings, stable Canvas nodes, source revisions, capability, quota/cost snapshot, and preflight
fingerprint before creating one run, one run-step per frozen instance step, and only dependency-ready jobs.

Run, step, job, and client request IDs are deterministic. Exact replay returns the same bounded run graph; changed
instance/fingerprint/cost facts conflict without an extra write. MySQL deadlock/lock-timeout retry is bounded, and
stale, foreign, malformed, unsupported, or drifted requests fail before run/job side effects.

The durable generation-job runner remains execution authority. Terminal jobs reconcile their owning run; a
provider-free restart sweep can also reconcile active runs without a browser or in-process callback. Successful
prerequisites release each child exactly once using the exact owned upstream result asset. Failed or cancelled
prerequisites block descendants. Run state is derived from persisted step/job state, and cancellation reuses the
existing job cancellation contract.

## Existing-authority reuse and product boundary

- T6-021 exact-version instance/binding/step-node lineage remains authoritative.
- T6-023 typed Script/Image compilation and stable-card lineage remain authoritative.
- T6-024 validates WorkflowRun Video projections before the existing Agnes adapter.
- `revid.generation-job.v2`, current leases, provider adapters, result ingestion, and stable Canvas-card sync remain
  authoritative; WorkflowRun does not mutate the Canvas graph directly.
- Page load only reads `/runs/latest`. Preflight, start, and cancel require explicit user action. Browser-local state
  is not execution or replay authority.
- No third provider path, automatic generation, legacy mock `execution_mode`, T6-026 upgrade/clone/detach behavior,
  or T6-027 retirement/release behavior was introduced.

## Persistence and security

The existing commented WorkflowRun tables are reused. The only schema addition is a non-null, commented
`cost_confirmed` fact for exact replay. Its guarded MySQL migration temporarily defaults existing rows to false,
removes the server default, and permits destructive downgrade only for disposable `revid_test_*` databases.

Read/cancel responses expose bounded run/step/job/result IDs and statuses only. They do not expose prompt, provider
raw response, secret, owner identity, or source content. Foreign and malformed requests are bounded and leave no run
or generation-task write.

## TDD and verification

| Gate | Result |
|---|---|
| Observed backend RED | run API `5 failed`; projection, dependency lineage, concurrency, and cost replay each failed at missing behavior |
| Observed browser RED | `1 failed`, missing WorkflowRun controls |
| Final focused backend | `33/33` |
| Final related backend | `152 passed, 31 subtests passed` |
| Migration/model focus | `10/10` |
| Fresh production build | PASS, `5,052 modules transformed` |
| Fresh production-preview browser regression | `21/21` |
| Final explicit start/reload/cancel built-artifact journey | `1/1` |
| Python compile, project-state, UTF-8, diff/security/index audit | PASS |

All browser evidence is provider-free. No real or paid provider call was made.

## Scope and ownership audit

- No secret/env/provider-raw/prompt/source-content/user-evidence path was read, copied, staged, or committed.
- No user/production database or filesystem mutation, reset, stash, clean, overwrite, or irreversible migration was
  performed.
- Protected untracked `.codex/`, listed `.hermes/plans/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and
  `test-results/` remain excluded from the exact-path index.
- Agent-owned Playwright temporary directories were resolved under `frontend/` and sent to the Windows Recycle Bin;
  they are recoverable and are not repository artifacts.
- T6-026 was neither created nor activated.

## Acceptance assessment

Every non-deferred T6-025 acceptance criterion is satisfied. Provider-free machine tests, build, and browser proof
are not Human visual, interaction, or journey acceptance. Final program-level Human acceptance remains T6-027.
