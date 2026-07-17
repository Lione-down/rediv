# TASK-T5-087 - Workflow templates and safe batch orchestration

- State: `DONE - PASS`
- Report: `ai/reports/REPORT-T5-087.md`
- Objective: add Revid-owned Workflow Templates, dry-run/preflight, dependency order, quota estimation, explicit batch execution, cancellation, and recovery contracts without automatically triggering paid or provider work.
- Dependency: `T5-086 - DONE - PASS` at committed and pushed baseline `cc8015748284e3883e64e22c0d2cd0916851fd02`.

## Product direction

- Reproduce only publicly observable professional workflow capability patterns. Do not copy LibTV private source, templates, schemas, prompt text, branding, iconography, copy, or visual assets.
- Preserve Revid's graphite-black/violet Canvas, typed ports, ordered dependencies, result branches, Storyboard projection, existing generation/task/quota contracts, and mobile review-only boundary.
- A template/dry run must be descriptive and mutation-free. A user must take an explicit action to start an eligible batch; no new workflow feature may silently submit a provider or paid request.
- Backend task/quota/capability truth is authoritative. When real provider, cost, cancellation, or durable batch semantics are unknown, mock/contract scope must fail closed and document the Human Owner release condition.

## Scope

- Audit existing template, Canvas graph, generation task, quota, cancellation, runtime recovery, and provider capability boundaries before selecting a minimal durable contract.
- Define strict versioned Revid-owned workflow-template, preflight, dependency-order, quota-estimate, batch-command, cancellation, and resume/recovery semantics with explicit capability gates.
- Reuse the existing Canvas command/history/autosave, task/result reconciliation, project/canvas scope, auth, and quota ownership; do not create a second scheduler, store, or Canvas engine.
- Deliver mock-first verification for valid/invalid plans, exact dependency order, dry-run zero mutation, zero automatic provider calls, explicit execution/cancel/recovery behavior, and capability/quota drift.

## Acceptance criteria

1. Template, preflight, and batch contracts are versioned, exact, authenticated/scoped, backward-aware, and fail closed for unknown, duplicate, malformed, future, stale, foreign, cyclic, or provider-overclaiming input.
2. Dry-run/preflight is zero-mutation: it creates no provider call, quota reservation, generation task, result, asset, Canvas mutation, or durable batch run.
3. Dependency order is deterministic and visible; no cross-canvas relation is created or inferred.
4. Quota estimates are explicit, conservative, capability-gated, and never treated as a provider reservation or payment authorization.
5. Execution is explicit and preserves existing quota/task/result semantics; cancellation and recovery cannot duplicate work, fabricate progress, auto-retry paid work, or bypass user scope.
6. Existing Canvas history/autosave/reload/revision, typed ports, image operations, shot controls, Storyboard projection, responsive layout, keyboard ownership, reduced motion, and 375px review-only behavior remain non-regressive.
7. Focused tests, relevant regression/build/browser checks, accessible desktop/compact review, and guarded 200/300 evidence are classified; no threshold is weakened.
8. No real provider/paid call, secret access, external account, destructive action, irreversible migration, UI redesign, or new cross-canvas graph edge is introduced without explicit Human Owner authorization.

## Non-goals

- No automatic paid workflow execution, background scheduler, real provider orchestration, billing redesign, cron/queue deployment, cross-project/cross-canvas batch, video editing, audio work, or Agent/Skill work.
- No destructive cancellation, schema migration, or durable reservation model before its contract and Human gate are explicit.

## Human gates

- Real provider calls, paid execution, provider-specific batch/cancel/resume semantics, external accounts, real secrets, destructive actions, irreversible schema changes, and incompatible UX require explicit Human Owner authorization.
