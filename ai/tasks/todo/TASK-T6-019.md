# TASK-T6-019 - Deliver workflow-template lifecycle domain and owner-scoped API

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: deliver the owner-scoped workflow-template definition/version lifecycle and API on the T6-018
  persistence foundation, including create, list, get, draft update, new draft version, publish, and retire behavior.
- Dependency: `T6-018 - DONE / PASS`; activation baseline
  `9bdd5806a8c377b732a3218fd052dfd762fa3583`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-019-PLAN](../doing/TASK-T6-019-PLAN.md).
- Progress: [TASK-T6-019-PROGRESS](../doing/TASK-T6-019-PROGRESS.md).

## Scope

1. Add a request-scoped SQLAlchemy repository and lifecycle controller for workflow-template definitions, versions,
   and normalized slots without changing the T6-018 schema.
2. Add strict request/response contracts and `/api/workflow-templates` routes for:
   - visible built-in and authenticated-owner private definitions;
   - creating a private definition with version 1 draft;
   - reading one exact version;
   - updating only a private draft;
   - creating the next draft version from an exact owned source version;
   - publishing a draft as an immutable exact version;
   - retiring a published version while keeping it readable.
3. Keep the three frozen V1 built-in categories server-owned and read-only.
4. Validate every persisted manifest with `revid.workflow-template.v1`, canonicalize it, and persist its SHA-256
   fingerprint and normalized slot rows in one transaction.
5. Enforce owner scope fail-closed, serialize lifecycle writes with row locks, map deterministic domain errors to
   bounded HTTP contracts, and preserve the legacy `/templates` Graph Template runtime unchanged.
6. Prove lifecycle, owner isolation, immutability, concurrency/transaction rollback, API response hygiene, restart
   persistence, zero Canvas/quota/job/provider mutation, and relevant regression on guarded disposable MySQL.

## Non-goals

- No T6-020 portable capture, field classifier, asset binding, capability/quota preflight, or preflight fingerprint.
- No T6-021 instantiate, Canvas mutation, instance/binding/step lineage, or graph ID remap.
- No T6-022 frontend store, Template Library, configuration drawer, or Workflow/Storyboard UI.
- No T6-023 Script/Image, T6-024 Video, T6-025 WorkflowRun, or provider adapter behavior.
- No T6-026 diff, compatible upgrade, clone, or detach. The current program sequence assigns those behaviors to
  T6-026 even though the older untracked redesign proposal mentioned clone in T6-019.
- No T6-027 compatibility retirement or Human journey acceptance.
- No public/team marketplace, import/export, arbitrary code, real/paid provider call, quota mutation, generation job,
  user/runtime database migration, schema change, destructive cleanup, or legacy `templates` rewrite.

## Acceptance criteria

1. Focused lifecycle/repository/API tests first fail only because T6-019 production modules/routes/contracts are
   absent.
2. Authenticated users can create, list, and read their own private definitions/versions; other owners receive a
   fail-closed not-found response with no existence disclosure.
3. All users can read the three server-owned built-in definitions and exact versions, but every built-in write is
   rejected.
4. Create persists one definition, one version-1 draft, and exact normalized variable/asset slot rows atomically.
5. Only a draft may be updated; published and retired version manifest/fingerprint/slots remain unchanged.
6. Publishing validates and canonicalizes the final manifest, changes lifecycle exactly once, records
   `published_at`, and makes subsequent update/publish attempts fail closed.
7. A new draft version is monotonic and exact-definition scoped; concurrent creation cannot produce duplicate
   versions or partial rows.
8. Retiring changes only lifecycle availability metadata; the published manifest, fingerprint, slots, and exact
   version read remain available and unchanged.
9. Invalid manifest/template identity, owner spoofing, unknown fields, duplicate keys, and transaction failures leave
   zero partial writes.
10. API responses contain no owner data from another user and no secret, provider endpoint/header/token, raw
    provider response, Canvas content, quota, job, or runtime-only data.
11. Guarded disposable MySQL focused and restart evidence, relevant legacy Template/Canvas regression, relevant broad
    backend checks, state validator, diff/security audit, one scoped commit/push, and remote parity are recorded.

## Completion state

T6-019 is `DONE / PASS`. The owner-scoped lifecycle/API, three immutable built-ins, normalized slot persistence,
published immutability, retired exact-version reads, transaction/concurrency behavior, guarded disposable-MySQL
restart evidence, relevant regression, broad-suite classification, and state/diff/security audits satisfy every
non-deferred acceptance criterion. No T6-020+ behavior or Human UI acceptance claim was added.
