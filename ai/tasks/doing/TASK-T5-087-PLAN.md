# TASK-T5-087 Plan

- State: `DONE - PASS`
- Objective: deliver the smallest strict mock-first workflow-template and safe batch orchestration unit, preserving current provider, quota, and Canvas truthfulness.

## Unit 0 - Audit and contract lock

- Status: `completed`

1. Read current state and inspect existing template registry, Canvas graph semantics, generation task states, quota controls, cancellation/recovery logic, T5-075 through T5-086 reports, and relevant ADRs.
2. Determine whether an existing durable contract can represent workflow runs without a migration; do not assume provider cancellation, cost, or scheduler behavior.
3. Record exact v1 template/preflight/batch fields, lifecycle states, dependency ordering, estimate semantics, capability scope, and every Human gate before business-code edits.
4. Create RED tests for malformed/cyclic/foreign workflows, dry-run zero mutation, and no automatic provider/quota activity.

Success gate: Task/PLAN/PROGRESS and CURRENT/ROADMAP identify T5-087 as the only active Task; scope and unknown provider behavior are explicit.

### Locked v1 boundary

- Existing `/templates` are graph capture/instantiation records only. They do not represent a workflow run, batch ownership, provider cancellation, or recovery.
- Existing `generation_tasks` are one request per task; their truthful lifecycle is `queued/running/succeeded/failed/timed_out`. There is no authenticated cancel/resume endpoint. Do not overload it with fabricated batch states.
- Existing quota is authoritative and charges one unit only when a generated asset is successfully persisted. Active task reservations are a 15-minute concurrency guard, not a cost estimate or payment authorization.
- T5-087 therefore introduces a frontend-owned, exact `workflow-orchestration` v1 contract. It preflights canonical generation nodes already in the active Canvas, derives a deterministic dependency order, and estimates only existing Revid quota units (`1` per eligible image/video node). It has no currency or provider-cost claim.
- A preflight is a pure return value: no Canvas command/history/autosave, task, asset, quota, reservation, provider transport, or durable run write. Capability/context drift, malformed node data, missing quota, foreign/missing endpoints, duplicate selection, and dependency cycles fail closed.
- The only executable lifecycle is explicitly labelled `mock`. It is session-scoped local state, never calls `requestCanvasGeneration`, and records no provider task/result/asset/quota mutation. A recovered active mock run becomes `paused`; resumption requires a new explicit user action and never auto-retries real work.
- Durable batch storage, provider-specific cancel/resume, real batch cost, quota reservation, scheduler/worker deployment, and any non-mock execution remain Human Owner gates.

## Unit 1 - Strict contract and dry-run

- Status: `completed`

1. Implement only the minimal versioned template/preflight parser and capability boundary supported by audit evidence.
2. Reuse current project/canvas/auth/task/quota ownership and prove deterministic dependency ordering plus conservative estimates.
3. Prove dry-run is zero mutation and capability/context drift fails closed.

Success gate: preflight is deterministic, scoped, inspectable, and cannot trigger generation or reserve quota.

## Unit 2 - Explicit mock batch lifecycle

- Status: `completed`

1. Add the smallest explicit UI/command surface only after the contract is green; preserve existing Canvas layout and 375px review-only behavior.
2. Prove mock execution, cancel, resume/recovery, retry boundaries, and task/result reconciliation without automatic provider/paid work.
3. Stop at an exact Human gate if durable schema, real provider cancellation, quota reservation, or scheduler semantics cannot be represented safely.

Success gate: every mutation is explicit, scoped, reversible where applicable, and cannot silently trigger paid work.

## Unit 3 - Regression and closure

- Status: `completed`

1. Run focused and related backend/Canvas/generation regression, build, Chromium, visual/a11y, hygiene, and guarded performance evidence.
2. Write REPORT and close Task/PLAN/PROGRESS/CURRENT/ROADMAP only after all non-deferred acceptance evidence is classified.
3. Exact-stage, commit, and push only T5-087 owned files.

Closure evidence: final async-overlay focused Chromium passed 14/14, production build passed 4,900 modules, and all 466 non-performance functional Chromium titles passed in 8.6 minutes. The separately guarded SwiftShader mock performance title retained its unchanged 55 FPS/33ms limits and is classified transparently in `REPORT-T5-087.md`, matching the established T5-085 evidence pattern; no Canvas hot path changed and no threshold was weakened.

## Stop rules

- Stop before a real/paid provider call, secret access, external account, destructive action, schema migration, cross-canvas relation, second engine/store, mobile editing, or incompatible UX.
- Stop and re-plan when the existing contracts cannot represent an action truthfully or a durable/paid operation would need unapproved provider semantics.
- Preserve `.codex/`, `.hermes/plans`, `output/`, and `TASK-T5-091.md`; never stage them.
