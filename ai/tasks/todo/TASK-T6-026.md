# TASK-T6-026 - Deliver template instance compatibility lifecycle

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: add deterministic template-version diff, explicit additive-compatible instance upgrade, stable instance
  clone, and detach while detecting, displaying, and preserving local overrides through the existing authoritative
  Canvas mutation/history/autosave and MySQL transaction paths.
- Dependency: `T6-025 - DONE / PASS`; activation baseline
  `9c0c4b57186b5e448180af5932ced6b792a3648b`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Canvas authority:
  [V2 Canvas architecture](../../architecture/REVID-V2-CANVAS-ARCHITECTURE.md).
- Decision:
  [Codex Direct Delivery](../../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).
- Plan: [TASK-T6-026-PLAN](../doing/TASK-T6-026-PLAN.md).
- Progress: [TASK-T6-026-PROGRESS](../doing/TASK-T6-026-PROGRESS.md).

## Scope

1. Add one strict, deterministic, owner/project/Canvas/instance-scoped version-diff contract. It compares the pinned
   immutable version with an exact candidate version, reports graph/slot/step/policy/provider-requirement changes,
   classifies compatibility from the frozen additive-only rules, and reports current local overrides and
   non-migratable facts without mutating Canvas, lineage, runs, jobs, quota, or provider state.
2. Compatible upgrade is explicit and requires the current Canvas `base_revision`, one bounded
   `client_mutation_id`, the accepted diff fingerprint, and exact source/target versions. Only an additive-compatible
   candidate may commit; incompatible, stale, foreign, drifted, or changed-diff requests fail with zero partial
   write.
3. Upgrade preserves the existing stable instance and Canvas entity IDs, every current typed Canvas value, and every
   detected allowed local override. It adds only declared optional variables/asset slots with valid defaults and
   updates exact version/lineage facts atomically. It never overwrites or silently discards a local override.
4. Clone creates a new stable instance and isolated lineage with deterministic new Canvas node/connection IDs while
   preserving the selected source instance's ordinary typed content, allowed local overrides, bindings, and exact
   version. Replay returns the same clone and ID map; changed replay facts conflict.
5. Detach is explicit, idempotent, and audit-preserving. It ends future template-management actions for the instance
   while retaining every ordinary Canvas node, connection, typed content value, asset binding projection, history,
   and autosaved document state. Historical exact-version/run lineage remains readable but cannot authorize a new
   managed upgrade.
6. All durable mutation goes through one request-scoped backend transaction and the existing Canvas document
   revision/idempotency authority. Frontend adoption goes through the serialized typed Canvas
   mutation/history/autosave controller; no `sessionStorage`, `localStorage`, legacy mock `execution_mode`, or
   frontend-only state becomes authority.
7. Add minimal accessible instance lifecycle UI that displays exact pinned/candidate versions, compatibility,
   structured changes, local overrides, protected fields, and explicit upgrade/clone/detach confirmation. Mobile
   remains review-only.
8. Prove owner/scope isolation, immutable version selection, compatibility boundaries, override protection,
   replay/concurrency, transaction rollback, clone identity isolation, detach preservation, reload recovery, and zero
   unintended run/job/quota/provider mutation.

## Non-goals

- No T6-027 compatibility retirement, legacy route/payload removal, release proof, or Human visual/interaction/journey
  acceptance.
- No automatic or silent upgrade, execution, WorkflowRun start, generation job, quota mutation, or provider call.
- No compatible classification for node/port/step/required-variable/asset-slot/lock/capability removal or rename,
  dependency/provider-intent/security/result semantic change, or any graph execution-semantic change.
- No rewrite of T6-017 through T6-025 schema, lifecycle, preflight, instantiate, exact lineage, Script/Image/Video,
  WorkflowRun, compact job, provider, same-card, or Canvas mutation/history/autosave contracts.
- No second Canvas store/renderer/history/autosave authority, browser-local persistence authority, or legacy mock
  execution promotion.
- No real/paid provider call, secret/env/provider-raw/prompt/source-content/user-owned evidence access, external
  account action, user/production database mutation, destructive/reset/stash/clean/overwrite, or irreversible
  migration.

## Dependencies and risks

- T6-019 provides immutable definition/version lifecycle; T6-021 provides exact-version instance, binding, stable-ID,
  step/node lineage, transaction, replay, and instance commit facts; T6-025 provides durable WorkflowRun authority
  that must remain unchanged.
- Compatibility is additive-only. Optional variables or slots are compatible only when their defaults are valid and
  resolution is deterministic. Metadata changes are compatible only when they do not alter execution semantics.
- Canvas nodes are ordinary editable state after instantiate. Local-override detection must compare current typed
  state against persisted instance baseline/lineage without treating presentation-only movement as provider intent
  and without copying user content into logs or errors.
- Upgrade, clone, and detach race with Canvas autosave and repeated requests. Exact `base_revision`, row locks,
  canonical fingerprints, and deterministic IDs must prevent lost updates or duplicate lineage.
- Existing WorkflowRuns remain historical audit facts. An active or non-terminal run may make lifecycle mutation
  unsafe; the implementation must fail closed rather than rewrite run lineage.

## Acceptance criteria

1. Focused backend and browser tests first fail because T6-026 diff/upgrade/clone/detach/override behavior is absent,
   and each expected RED is recorded before production implementation.
2. Pure diff produces stable ordered sections and a canonical fingerprint for exact source/candidate versions,
   classifies every frozen compatible/incompatible rule, identifies current local overrides, and makes zero durable
   mutation.
3. Only explicit additive-compatible upgrade succeeds. It retains the same instance and Canvas entity IDs, preserves
   all local overrides and ordinary typed content, adds only valid optional defaults, advances exact version/lineage
   atomically, and is undoable/recoverable through the current Canvas mutation/history/autosave authority.
4. Incompatible, stale, foreign, malformed, retired/unavailable, changed-fingerprint, local-conflict, or
   non-terminal-run cases fail closed with bounded sanitized errors and zero partial Canvas, instance, binding,
   commit, run, job, quota, asset, or provider write.
5. Clone creates one isolated stable instance/lineage and isolated deterministic node/connection IDs while preserving
   typed content, bindings, and local overrides. Exact replay returns the same response; changed replay facts
   conflict; source and clone mutate independently afterward.
6. Detach preserves the complete current Canvas graph and typed content while making template-management state
   explicitly detached. Exact replay is idempotent, future managed upgrade fails, and historical version/run lineage
   remains readable.
7. All lifecycle mutations serialize through MySQL and Canvas revision/idempotency authorities. Concurrent/repeated
   requests neither overwrite local edits nor create duplicate instances, revisions, bindings, commits, or lineage.
8. Frontend lifecycle UI exposes exact version, compatibility, structured diff, local overrides, and protected fields;
   requires explicit confirmation; recovers after reload; uses the typed mutation controller; and stores no
   authoritative lifecycle fact in browser storage.
9. Guarded disposable `revid_test_*` MySQL evidence, focused/related backend and Chromium regression, a fresh
   production build, provider-free built-artifact browser proof, state validator, diff/security audit, exact-path
   staging, one conventional commit/push, and remote parity are recorded.
10. Machine backend/browser/build evidence is not described as Human acceptance; compatibility retirement, release
    proof, and final program-level Human visual, interaction, and journey acceptance remain T6-027.
