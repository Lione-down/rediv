# REPORT-T6-019 - Workflow-template lifecycle domain and owner-scoped API

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-28`
- Activation baseline: `9bdd5806a8c377b732a3218fd052dfd762fa3583`
- Task: [TASK-T6-019](../tasks/todo/TASK-T6-019.md).
- Plan: [TASK-T6-019-PLAN](../tasks/doing/TASK-T6-019-PLAN.md).
- Progress: [TASK-T6-019-PROGRESS](../tasks/doing/TASK-T6-019-PROGRESS.md).

## Delivered

- Added strict owner-scoped create/list/get/draft-update/exact-source new-version/publish/retire endpoints under
  `/api/workflow-templates`.
- Added exactly three immutable server-owned V1 built-ins for product ad, knowledge/talking-head, and multi-shot
  narrative. The product-ad seed matches the frozen canonical fixture fingerprint.
- Added a session-bound SQLAlchemy repository and transaction-owning lifecycle controller. Definition row locks
  serialize draft update, new-version, publish, and retire writes.
- Atomically persisted private definition metadata, exact version manifest/fingerprint, and normalized variable/asset
  slot rows on the existing T6-018 schema.
- Enforced private draft identity, reserved built-in namespace, owner-scoped not-found behavior, one active draft,
  monotonic versions, published immutability, and retired exact-version readability.
- Added bounded HTTP error contracts without returning owner identity, provider credentials/raw data, Canvas
  content, quota, jobs, or runtime-only state.
- Preserved the legacy `/templates` Graph Template API and all Canvas, generation, quota, job, and provider paths.

## TDD and verification

- RED: the inherited focused suite first produced `8 failed`; every failure was the expected missing lifecycle route.
- Focused lifecycle GREEN: `8/8` on guarded disposable `revid_test_workflow_template_lifecycle_api` MySQL.
- Security review added a targeted RED proving default nested-validation errors echoed a rejected provider field/value;
  bounded route validation removed the echo, followed by targeted `1/1` and lifecycle `8/8` GREEN.
- The focused suite proves owner isolation, three built-ins, normalized slots, invalid-manifest rollback, immutable
  publish, monotonic exact-source draft creation, concurrent `201/409`, retire preservation, zero unrelated mutation,
  and backend restart persistence.
- Frozen workflow-template contract/security/model/migration/constraint plus lifecycle group: `49/49`.
- Legacy Graph Template regression: `21/21`; one unchanged `TestInMemoryStore` collection warning.
- Canvas document regression: `17/17` plus `3/3` subtests.
- Python compile, exact seven-route audit, canonical product-ad fingerprint, project-state validator, and
  `git diff --check`: passed.

## Broad-suite classification

The full backend completed with `700 passed`, `203 subtests passed`, `7 failed`, and three unchanged
`TestInMemoryStore` collection warnings. No failing production or test file overlaps the T6-019 diff:

- three old Image assertions expect `4:3` and omit the current `output_count`;
- one old cinematic Video handoff expects top-level `resolution`;
- three old semantic-video assertions require superseded semantic-fusion fields and a nine-reference boundary.

These are the same approved-program contract drift recorded by T6-018 and remain assigned to T6-023/T6-024. T6-019
does not weaken thresholds or widen scope to repair them.

## Security and evidence boundaries

- `.gitignore` review found no environment-file allowlist. Intended staged paths contain no env-like file, protected
  evidence, or high-confidence secret signature.
- No environment file, credential, provider raw payload/response, prompt, user source content, or protected
  user-owned evidence was read, copied, staged, or committed.
- Database evidence used only the guarded disposable `revid_test_*` identity. No user/runtime database was migrated,
  downgraded, dropped, truncated, cleaned, or otherwise mutated.
- No Canvas document, quota, generation task, provider job, real/paid provider, external account, schema migration,
  or legacy Graph Template row was created or changed by the lifecycle flow.
- No frontend/browser evidence is claimed because this Task changes no frontend, Canvas presentation, or interaction.
  Machine API/persistence evidence is not Human visual/interaction acceptance; the unified Human gate remains T6-027.

## Decision

T6-019 is `DONE / PASS`. Every non-deferred acceptance criterion is satisfied by observed TDD, guarded real-MySQL
lifecycle/concurrency/restart evidence, legacy and Canvas regression, broad-suite classification, and explicit
state/diff/security audits. T6-020 may start only after the scoped commit is pushed and `HEAD == origin/main`.
