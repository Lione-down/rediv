# TASK-T6-017 - Freeze Revid V3 workflow-template V1 contracts

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: approve PRD V1 defaults and freeze the declarative `revid.workflow-template.v1` schema, behavior matrix,
  cross-language contract, canonical fingerprint, portability rules, security abuse cases, and provider projection
  fixtures without runtime UI, migration, database mutation, or provider calls.
- Dependency: `T6-013 - DONE / DEFERRED`; baseline commit `515b8c90097108b05e8cc838e3ba6402e30c366b`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Architecture: [V2 Canvas architecture](../../architecture/REVID-V2-CANVAS-ARCHITECTURE.md).
- Plan: [TASK-T6-017-PLAN](../doing/TASK-T6-017-PLAN.md).
- Progress: [TASK-T6-017-PROGRESS](../doing/TASK-T6-017-PROGRESS.md).
- Report: [REPORT-T6-017](../../reports/REPORT-T6-017.md).

## Scope

1. Freeze the V1 defaults: built-in plus user-owned private templates, three built-in seed categories, immutable private
   publish, explicit compatible upgrades, no V1 import/export, no Pro Alpha selector, explicit-only Image 2.0
   precomposition, quota units plus cost class, target-project asset rebinding, and legacy Graph Template readability.
2. Freeze exact object and field naming for definition/version metadata, variables, asset slots, graph nodes/connections,
   workflow steps, bindings, instances, runs, and provider projections.
3. Add a strict JSON Schema and equivalent Pydantic/TypeScript parsing contracts.
4. Add deterministic RFC 8785-compatible canonical serialization and SHA-256 fingerprint fixtures.
5. Add portable/non-portable classification and sanitized fixtures for Text, Image 2.0, Image 2.1, and Video V2.0
   provider projections.
6. Add fail-closed cases for unknown fields, arbitrary code, endpoint/header/token/local path, job/provider task/result
   URL/base64/quota ledger/owner IDs, forged scope, stale revisions, and forged preflight fingerprints.
7. Define compatibility with legacy Graph Template, T6-013 generation cards, strict Story Production, typed
   command/history/autosave, and compact durable jobs.

## Non-goals

- No runtime Template Library, drawer, Canvas rendering, database model, migration, API lifecycle, capture, preflight
  service, instantiate mutation, WorkflowRun orchestration, upgrade implementation, or compatibility removal.
- No real or paid provider call, external account, secret access, user/runtime data mutation, destructive operation, or
  public/team marketplace.
- No arbitrary JavaScript, Python, Shell, SQL, remote-code template, provider endpoint, header, or credential field.
- No claim that semantic character/scene/prop references are Agnes Video keyframes or typed provider fields.

## Acceptance criteria

1. PRD status/version and every V1 product default are explicit with no unresolved choice entering T6-018.
2. JSON Schema, Pydantic, and TypeScript accept the same portable fixtures and reject the same abuse fixtures.
3. Canonical serialization and fingerprint are identical across backend and frontend for the frozen manifest fixture.
4. Portable classification strips or rejects every non-portable job/provider/result/quota/owner/private-asset field.
5. Provider projections describe only officially supported Text, Image 2.0, Image 2.1, and Video V2.0 request shapes;
   unsupported semantic Video fusion fails closed.
6. Contract parsing, classification, and fingerprinting produce no database, Canvas, quota, job, or provider mutation.
7. Focused observed RED precedes minimal GREEN; related regression, fresh build, provider-free browser contract proof,
   validator, diff/security audit, Task/PLAN/PROGRESS/REPORT reconciliation, one scoped commit, push, and remote parity
   are recorded.

## Completion state

T6-017 is `DONE / PASS`. Every pure contract acceptance criterion is satisfied by shared fixtures, strict cross-language
contracts, provider-free machine/browser evidence, and the recorded audits. No intermediate visual/interaction Human
acceptance was required for this Task; program-level final journey review remains T6-027.
