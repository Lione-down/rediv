# REPORT-T6-020 - Portable capture and provider-free preflight

- Task: [TASK-T6-020](../tasks/todo/TASK-T6-020.md)
- Plan: [TASK-T6-020-PLAN](../tasks/doing/TASK-T6-020-PLAN.md)
- Progress: [TASK-T6-020-PROGRESS](../tasks/doing/TASK-T6-020-PROGRESS.md)
- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-28`
- Activation baseline: `617e514454212f359eefe2de87c07c6d66a8dc6f`

## Delivered

T6-020 adds an additive, owner-scoped bridge from one active Canvas graph to the frozen
`revid.workflow-template` V1 contract:

- deterministic template-local node and connection IDs;
- strict topology-only manifest capture without widening the frozen schema;
- explicit promotion of every source-project asset reference to a typed asset slot;
- SHA-256 source-revision binding candidates outside the portable manifest;
- exact fail-closed field classification and stripping of job/task/result/provider/quota/owner/local/source-content
  state;
- exact-version provider-free preflight for typed variables, target owner/project/Canvas, asset
  status/type/revision/cardinality, graph ports/capacity/cycle, current capability, quota units, cost class, and a
  deterministic canonical fingerprint;
- bounded capture/preflight errors that do not echo rejected field names, values, foreign ownership, or source
  content.

The T6-019 definition/version lifecycle, three server-owned built-ins, strict V1 manifest/fingerprint contract,
legacy Graph Template runtime, Canvas document mutation authority, and generation/provider adapters remain
unchanged.

## Mutation and security boundary

Capture and preflight are read-only with respect to product state. Tests count Canvas revisions, template
instances/bindings/steps, WorkflowRuns, GenerationTasks, and quota ledgers before and after success/failure and
observe no change. Production imports confirm no Canvas patch, template instance/run write, generation write, quota
reservation, provider adapter, or provider request is reachable.

Project assets are fetched for validation but enter a portable manifest only as declared slots. A binding succeeds
only for the authenticated owner, target project, active status, exact media type/cardinality, and exact source
revision. Foreign, inactive, stale, duplicate, missing, mismatched, or unclassified inputs fail closed without
cross-owner disclosure.

No environment/secret file, provider raw response, prompt/source content, user-owned evidence, real/paid provider,
user/production database, destructive filesystem operation, or migration was accessed or changed.

## TDD and focused evidence

| Gate | Result |
|---|---|
| Backend portability RED | `4 failed, 1 passed`; unknown fields were still treated as portable |
| Backend route/contract RED | `6 failed`; T6-020 API was absent |
| Frontend classifier RED | `1 failed, 2 passed`; unknown field did not reject |
| Bounded/retired RED | `2 failed`; raw validation detail and retired preflight remained |
| Final backend focused | `13 passed` |
| Final frontend Chromium contract | `3/3 passed` |
| Python changed-file compile | PASS |

The final backend group covers deterministic capture and preflight, strict asset-slot promotion, runtime stripping,
unknown-field rejection, ordered variables-before-assets failure, foreign/inactive/stale asset rejection, graph
port/capacity/cycle, unsupported capability, quota and cost confirmation, retired lifecycle, bounded errors, and
zero unintended mutation.

## Guarded MySQL evidence

The focused API suite used the identity-guarded disposable schema
`revid_test_workflow_template_capture_preflight`. `MySQLTestDatabase` required the `revid_test_*` prefix, created the
exact schema with `utf8mb4`, applied Alembic head, verified the selected database identity, and dropped it during
teardown. An independent read-only residue probe returned `residue_count=0`.

This is real local MySQL integration evidence, not SQLite or mock persistence. It does not operate on user or
production data.

## Regression and build evidence

| Gate | Result |
|---|---|
| Frozen workflow-template/lifecycle/security/model/constraint plus legacy Graph Template/Canvas regression | `85 passed, 3 subtests passed` |
| Broad backend, deterministic three-way file split | `713 passed, 203 subtests passed, 7 failed` |
| Frontend production build | PASS, `5,041 modules transformed` |
| `git diff --check` before final state sync | PASS |

The seven broad failures are the unchanged out-of-scope baseline REDs already present at T6-019:

- two old Image E2E tests expect `4:3` while the current contract defaults to `1:1`;
- one old Image transaction test expects `4:3` and omits current `output_count`;
- one old Video transaction test omits current `resolution: 720p`;
- three superseded semantic multi-image Video contract tests require unsupported Agnes behavior.

Two monolithic full-suite attempts exceeded `604s` and `904s`; the complete sorted test-file set was then split into
three deterministic shards and completed with the totals above. No threshold or test was weakened, and no T6-020
test failed.

## Acceptance assessment

All non-deferred T6-020 acceptance criteria pass:

- portable capture is deterministic and strict;
- project assets become explicit slots and source IDs never enter the portable manifest;
- runtime/provider/job/result/quota/owner/source-content state strips;
- unknown fields fail closed;
- preflight follows the frozen validation stages and returns backend-authoritative quota/cost plus a deterministic
  fingerprint;
- success and failure have zero Canvas/template-instance/quota/job/provider side effects;
- guarded disposable MySQL, related regression, broad classification, build, compile, diff, and security gates are
  recorded.

This is backend/contract and provider-free machine evidence. It is not Human visual/interaction acceptance. T6-021
owns atomic instantiate and lineage; T6-022 through T6-027 remain out of scope, and the final Human journey gate
remains T6-027.
