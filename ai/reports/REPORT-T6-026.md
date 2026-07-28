# REPORT-T6-026 - Template instance compatibility lifecycle

- Task: [TASK-T6-026](../tasks/todo/TASK-T6-026.md)
- Plan: [TASK-T6-026-PLAN](../tasks/doing/TASK-T6-026-PLAN.md)
- Progress: [TASK-T6-026-PROGRESS](../tasks/doing/TASK-T6-026-PROGRESS.md)
- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-29`
- Activation baseline: `9c0c4b57186b5e448180af5932ced6b792a3648b`

## Delivered

T6-026 adds a strict, deterministic, owner/project/Canvas/instance-scoped diff between one pinned immutable template
version and one exact published candidate. The classifier is additive-only, orders structured changes and blocking
reasons deterministically, fingerprints the accepted facts, and includes current protected local overrides without a
Canvas, lineage, run, job, quota, asset, or provider write.

Explicit upgrade requires the current Canvas revision, one strict mutation ID, target version, and accepted diff
fingerprint. It preserves the stable instance and Canvas entity IDs, typed content, and local overrides; adds only
deterministic optional defaults; and atomically advances exact version/binding facts. Canvas history undo/redo
reconciles the exact managed version and bindings.

Clone creates a deterministic new instance, node/connection IDs, bindings, steps, and isolated lineage from the
selected current typed state. Source and clone mutate independently. Exact concurrent/repeated requests converge on
one response; changed replay conflicts; durable replay survives Canvas revision pruning.

Detach writes explicit unmanaged markers in the existing Canvas transaction while retaining nodes, connections,
typed content, bindings, history, and historical exact-version/run lineage. Future managed diff/upgrade is blocked.
All three mutations fail closed while a T6-025 run is non-terminal.

## Authority, persistence, and security

- T6-019 immutable versions, T6-021 stable IDs/bindings/steps/instance commit, T6-025 WorkflowRun, and current Canvas
  mutation/history/autosave remain authoritative and are not rewritten.
- One additive table stores commented immutable upgrade/detach replay facts. Its migration is MySQL-only and permits
  destructive downgrade only on guarded disposable `revid_test_*` databases.
- Request integers are field-level strict. Foreign, malformed, stale revision, changed diff, unavailable target,
  active-run, collision, and inconsistent lifecycle-marker cases return bounded errors before partial writes.
- Response snapshots and override reports contain bounded structural facts, not provider raw data, secrets, prompt
  text, or source content.
- No `sessionStorage`, `localStorage`, legacy mock `execution_mode`, frontend-only state, automatic workflow start,
  generation job, quota mutation, or provider call became authority.

## Frontend

The existing selected-card runtime now exposes one accessible lifecycle surface with exact pinned/candidate versions,
structured changes and incompatibility reasons, protected local overrides, and explicit two-stage upgrade, clone, and
detach confirmation. Committed backend document mutations are adopted through the serialized typed Canvas
command/history controller. The 375px experience remains review-only.

## TDD and verification

| Gate | Result |
|---|---|
| Observed pure/API/browser RED | `3 failed`; `4 failed`; `2 failed` at missing T6-026 behavior |
| Final focused backend | `16/16` |
| Final related backend | `126 passed, 12 subtests passed` |
| Complete backend classification | `769 passed, 215 subtests passed`; 3 owned migration-head failures fixed |
| Independent broad boundary | 4 untouched Image generation assertions remain RED at expected `4:3` versus runtime `1:1` |
| Fresh production build | PASS, `5,056 modules transformed` |
| Production-preview Chromium | `15/15` provider-free |
| Desktop and 375px visual review | PASS for structured diff, override protection, clipping, and overflow |
| Project-state, diff, UTF-8, file-size, index, and security audit | PASS |

The broad four-test boundary does not execute a T6-026 changed or dependency path and was not changed in this Task.
All T6-026 focused and related regression is GREEN. Browser/build/screenshot evidence is machine evidence, not Human
acceptance.

## Scope and ownership audit

- No secret/env/provider-raw/prompt/source-content/user-evidence path was read, copied, staged, or committed.
- Protected untracked `.codex/`, listed `.hermes/plans/`, `ai/evidence/t6-012/`, `output/`, `storage/`, and
  `test-results/` remain outside the exact-path index.
- No real/paid provider call, user/production database operation, destructive reset/stash/clean/overwrite, T6-027
  compatibility retirement, legacy removal, release proof, or Human acceptance work was performed.
- Browser screenshots and test output were written only under `D:\works\codexWorks\download`.

## Acceptance assessment

Every non-deferred T6-026 acceptance criterion is satisfied. The sole scoped commit/push and fetched remote parity
complete this delivery. T6-027 was not created or activated; program-level Human visual, interaction, journey, and
release acceptance remains assigned there.
