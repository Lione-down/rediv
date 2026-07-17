# TASK-T5-090 Plan

- State: `DONE - PASS`
- Objective: establish a strict Revid-owned Agent/Skill interface that T5-091 can reuse without a parallel runtime or scope leak.

## Unit 0 - Native-contract audit and boundary decision

- Status: `completed`

1. Inspect existing authenticated API dependencies, project/Canvas ownership checks, canonical document commands, generation capability/request normalization, quota/task/result persistence, frontend generation context, and existing Palette/overlay patterns.
2. Verify whether a truthful native execution handoff can be reused without migration, provider call, new durable task/store, client-only authorization, or cross-Canvas data.
3. Lock the minimum manifest shape, registration ownership, discovery/preflight route(s), native execution handoff/fail-closed rule, UI exposure, and test matrix.

Success gate: the Task/PLAN/PROGRESS describe a deterministic v1 contract, exact non-goals, Human gates, and no ambiguity about which existing authority owns each action.

### Locked v1 contract decision

- `current_user` plus `canvases.get_canvas(project_id, canvas_id, user_id)` is the required authenticated discovery/preflight scope guard; no client-supplied ownership claim is trusted.
- A manifest is a code-owned exact id/version/intent/execution-mode definition. The registry is closed: duplicate, unknown, disabled, malformed, future, imported, external, and cross-Canvas definitions are rejected.
- The only v1 manifest is `revid.canvas-context.v1`. It emits deterministic Canvas-local context from a bounded canonical selected-node identity set, is `mock-only`, and returns no task, quota, provider, asset, graph, history, autosave, or durable output authority.
- The common executor contract supports `mock-only` and `unavailable`. It does not expose native image/video/text execution because those existing routes enter provider/task flows immediately and have no generic acknowledgement contract. T5-091 must register built-ins through this interface and separately use only truthful future native handoff authority.

## Unit 1 - Contract, registration, and native preflight/execution handoff

- Status: `completed`

1. Implement the audit-approved backend/frontend contract and Revid-built registration only.
2. Prove auth/project/Canvas/version/capability/unknown/disabled failure modes and zero-mutation preflight behavior.
3. Add the narrowest existing UI surface only if it preserves keyboard, accessibility, reduced motion, responsive ownership, and Canvas lifecycle boundaries.

Success gate: a Skill cannot escape native scope or imply execution it lacks; T5-091 has one reusable strict registration/preflight/execution interface.

## Unit 2 - Regression and closure

- Status: `completed`

1. Run focused tests first, then relevant backend/frontend regression, build, browser/visual/accessibility, hygiene, and classified 200/300 evidence.
2. Write REPORT and close Task/PLAN/PROGRESS/CURRENT/ROADMAP only after every non-deferred criterion has evidence.
3. Exact-stage, commit, and push only T5-090-owned files.

## Stop rules

- Stop before `.env`/secret access, paid/provider calls, external accounts, installation, arbitrary or imported Skill execution, migration, worker/scheduler/storage deployment, destructive overwrite, cross-Canvas relation, mobile editing, or incompatible UX.
- Preserve `.codex/`, `.hermes/plans`, `output/`, and `TASK-T5-091.md`; never stage them.
