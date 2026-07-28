# REPORT-T6-021 - Atomic workflow-template instantiate and lineage

- Task: [TASK-T6-021](../tasks/todo/TASK-T6-021.md)
- Plan: [TASK-T6-021-PLAN](../tasks/doing/TASK-T6-021-PLAN.md)
- Progress: [TASK-T6-021-PROGRESS](../tasks/doing/TASK-T6-021-PROGRESS.md)
- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-28`
- Activation baseline: `61c88b3c51a4dfdf4cfafb320206abe5ea23e55b`

## Delivered

T6-021 adds a strict owner-scoped instantiate route for one exact immutable workflow-template version and one active
Canvas. The transaction:

- locks and revalidates owner/project/Canvas, base revision, exact published version and manifest fingerprint;
- reruns the T6-020 provider-free preflight against current typed bindings, asset source revisions, graph validity,
  capability, quota/cost snapshot, and compares its canonical fingerprint;
- allocates deterministic stable instance, node, connection, binding, asset-item, and step identifiers;
- projects the frozen topology-only manifest into ordinary canonical Canvas entities with deterministic
  server-owned layout and safe placeholder configuration;
- calls the existing in-session Canvas document patch as the only graph write authority;
- persists the exact instance, typed variable/asset bindings, ordered asset/source-revision items, step/node
  lineage, Canvas revision metadata, and one immutable sanitized replay snapshot before one commit.

Two additive commented MySQL tables close frozen-contract gaps without changing T6-018 compatibility:
`workflow_template_asset_binding_items` preserves up to nine ordered items per slot, and
`workflow_template_instance_commits` preserves strict idempotent replay after normal Canvas revision pruning.

T6-020 capture/preflight, T6-019 lifecycle, the frozen V1 manifest, legacy Graph Template, quota/generation/provider
authorities, and every T6-022+ scope remain unchanged.

## Atomicity, idempotency, and security boundary

An identical `client_mutation_id` retry returns the same instance/entity maps and committed mutation snapshot,
including after its Canvas revision is pruned and the runtime restarts. Reuse with any changed request fact conflicts.
Concurrent identical requests serialize to one revision and one lineage set.

Draft/retired/foreign or fingerprint-drifted versions, foreign project/Canvas/assets, stale base/preflight/source
revision/quota, invalid ports/capacity/cycle, and target-ID collisions fail closed. A forced exception after the
Canvas patch rolls back the graph revision and all instance/lineage rows together.

Success and failure count zero quota ledger, GenerationTask/job, WorkflowRun, and provider-request mutation. No
environment/secret file, provider raw response, prompt/source content, user-owned evidence, real/paid provider,
user/production database, or runtime schema was accessed or changed.

## TDD and guarded MySQL evidence

| Gate | Result |
|---|---|
| Initial route RED | `5 failed`, expected missing T6-021 route |
| Ordered multi-asset RED | `1 failed`, bounded unsupported-lineage response |
| Revision-pruning replay RED | `1 failed`, `mutation_id_reused` |
| Final focused guarded MySQL | `24 passed, 3 subtests passed` |
| Changed-file compile | PASS |
| Alembic heads | single `e0f1a2b3c4d5` |

The focused group proves one-revision atomic persistence, isolated stable IDs, complete typed lineage, optional and
multi-item slots, replay/restart/concurrency, forced rollback, exact scope/version/preflight/graph/quota revalidation,
bounded failures, and zero unintended mutation.

The tests used only identity-guarded disposable `revid_test_*` MySQL schemas. One forced broad-suite timeout
interrupted normal teardown and left inactive `revid_test_db`; exact guarded cleanup removed only that disposable
schema, and the independent recheck returned `residue_count=0`. No user or production database was operated.

## Regression and build evidence

| Gate | Result |
|---|---|
| Workflow-template/lifecycle/legacy Graph Template/Canvas regression | `125 passed, 6 subtests passed` |
| Broad backend across all 112 sorted test files | `734 passed, 206 subtests passed, 7 failed` |
| Frontend production build | PASS, `5,041 modules transformed` |
| Bounded production files | controller `385` lines; lineage service `158` lines |

The seven broad failures exactly match the T6-020 out-of-scope baseline: two old Image E2E `4:3` expectations, one
old Image transaction with `4:3`/`output_count` drift, one old Video transaction missing current `resolution`, and
three superseded semantic multi-image Video contract REDs. No T6-021 test failed.

One deterministic three-way shard exceeded `604s` without a summary. Its full file set was rerun without skips as
two deterministic `%6` sub-shards, which passed `273` tests plus `94` subtests. No threshold was weakened.

## Acceptance assessment

All non-deferred T6-021 acceptance criteria pass. Exact version and current preflight facts are revalidated; one
existing Canvas patch and all lineage commit atomically; stable IDs and strict replay survive concurrency, pruning,
and restart; every invalid path has zero partial/product-execution side effects; guarded MySQL, regression, broad
classification, build, compile, state, diff, and security gates are recorded.

This is backend/contract machine evidence, not Human visual/interaction acceptance. T6-022 owns Template Library
and configuration UI, T6-023 through T6-026 own generation/run/upgrade behavior, and the final Human journey gate
remains T6-027.
