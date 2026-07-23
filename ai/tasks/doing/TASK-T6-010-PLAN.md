# TASK-T6-010 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `Complete`
- Task: [TASK-T6-010](../todo/TASK-T6-010.md).
- Progress: [TASK-T6-010-PROGRESS](TASK-T6-010-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Activation baseline: `main`, `HEAD == origin/main == dc9696fa7a568a38f0ab8980f3b20ea78c72800a`.

## Delivery rule

Implement only canonical card presentation/geometry and node rename. Every production behavior must follow a focused failing test, the expected RED fingerprint must be recorded, and the smallest coherent GREEN must precede refactoring. Rebuild the frontend before preview-backed Playwright proof.

## Unit sequence

### Unit 0 - Activation and contract inventory

- Status: `complete`
- Create and activate the sole T6-010 Task, PLAN, and PROGRESS.
- Reconcile CURRENT and ROADMAP, then pass project-state validation before business-code edits.
- Inspect the frozen rename RED contracts, command/executor/history/autosave boundaries, materialized-card compatibility projection, visible-layout/renderer/DOM-surface geometry, port/edge/hit-target ownership, stage insets, and current title/reference presentation.

### Unit 1 - Canonical card view model

- Status: `complete`
- Write focused RED assertions for one typed card presentation projection across supported card families and legacy result compatibility.
- Add `canvas-card-view-model.ts` as a pure presentation boundary for title, body, lifecycle, media, ports, work surface, and result compatibility state.
- Replace only duplicated presentation derivations proven to be inside T6-010; retain legacy result persistence and later-Task workflow boundaries.

### Unit 2 - Rename command and editor

- Status: `complete`
- Run the frozen rename contract first and record its expected absent-command/executor failures.
- Add `rename-node` to the existing typed command/executor boundary with exact undo/redo and autosave semantics.
- Add the external upper-left title editor with keyboard, focus, cancel, commit, readonly, duplicate-title, and no-drag/no-selection-theft behavior.
- Prove reload, duplication, Canvas switching, stable IDs, connections, generation/job bindings, and reference bindings.

### Unit 3 - Single visible geometry authority

- Status: `complete`
- Write focused RED assertions that expose any divergence between visible card rectangles, Leafer nodes, DOM surfaces, ports, edge endpoints, hit targets, title placement, and attached work surfaces.
- Add `canvas-card-geometry.ts` and route the affected presentation/interaction surfaces through its visible-layout result.
- Clamp attached surfaces against the measured stage rectangle and panel/safe insets, not the browser window.
- Prove supported zoom, responsive/panel layouts, and delayed intrinsic-media aspect changes without graph/history/camera mutation.

### Unit 4 - Focused and broad verification

- Status: `complete`
- Run focused command/view-model/geometry/browser proof first.
- Rebuild the frontend, then run related card interaction, renderer, port/edge, work-surface, persistence, and durable-generation regression.
- Run the relevant broad frontend suite while excluding only frozen later-Task RED assertions that T6-010 does not own.
- Classify automated visual/interaction evidence separately; request Human acceptance only if Task completion contract requires it.

### Unit 5 - Fresh review and delivery

- Status: `complete`
- Review the complete diff against scope, command/history/autosave integrity, stable identity, geometry ownership, compatibility, accessibility, interaction arbitration, and protected paths.
- Reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP, create REPORT only after every non-deferred acceptance criterion passes, then run project-state, UTF-8, diff, sensitive-path, staged-secret, and exact-staging checks.
- Commit one scoped change, push `main`, and only then create the next dependency-ready T6 Task in a new goal-mode Codex session.

## Verification order

1. Exact focused RED fingerprint.
2. Smallest coherent GREEN.
3. Focused unit/browser proof.
4. Fresh production build.
5. Related browser regression, then relevant broad regression.
6. State, diff, hygiene, staged-secret, commit, and push proof.

## Stop conditions

- Stop before T6-011 or any later Task behavior.
- Stop before removing legacy result persistence or implementing same-card generation application owned by T6-014/T6-016.
- Stop before a real/paid provider call, secret access, user/runtime migration, destructive operation, external-account change, or incompatible contract change.
- Stop on unknown overlapping edits in an owned path.
- End every partial run with PROGRESS and CURRENT recording exact completed work, remaining work, next action, changed files, commands/results, and blocker release conditions.
