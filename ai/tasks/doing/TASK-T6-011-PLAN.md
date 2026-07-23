# TASK-T6-011 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: `Unit 5 - complete`
- Task: [TASK-T6-011](../todo/TASK-T6-011.md).
- Progress: [TASK-T6-011-PROGRESS](TASK-T6-011-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Activation baseline: `main`, `HEAD == origin/main == 11cdaaac7be485e219830ebf9a6c589996830a47`.

## Delivery rule

Implement only the T6-011 text-card workflow. Every production behavior must follow a focused failing test, an observed expected RED fingerprint, the smallest coherent GREEN, and refactoring only while green. Rebuild the frontend before preview-backed browser proof.

## Unit sequence

### Unit 0 - Activation and contract inventory

- Status: `complete`
- Create and activate the sole T6-011 Task, PLAN, and PROGRESS.
- Reconcile CURRENT and ROADMAP, then pass project-state validation before business-code edits.
- Inspect the frozen T6-011 RED assertions, compact durable text job schemas/services, allowed-model capabilities, card work model, direct editor, attached surface, typed commands, revision/history/autosave, and legacy compatibility boundaries.

### Unit 1 - Allowed model and mode contracts

- Status: `complete`
- Write focused backend RED assertions for an explicit allowed text-model list, stable IDs, per-mode capability flags, and rejection of omitted/unknown/incompatible selections before mutation.
- Extend only the existing generation capability/job/dispatch boundaries required by text generation.
- Preserve fake-provider/disposable-test isolation and do not call a real provider.

### Unit 2 - Text card empty state and direct editing

- Status: `complete`
- Write focused frontend RED assertions for truthful empty modes, keyboard behavior, direct in-card editing, and zero unintended mutation while browsing modes.
- Reconcile `canvas-card-work-model`, text chooser/composer, and node editor with the canonical T6-010 card model and geometry authority.
- Preserve text/script separation required by T6-012/T6-013 and avoid later workflow behavior.

### Unit 3 - Attached composition and same-card application

- Status: `complete`
- Write focused RED assertions for selected-card attached composition, explicit model submission, refresh/Canvas-switch continuity, same-card result application, and stale-revision recovery.
- Add the smallest text work surface and typed apply-result command/use-case boundary needed for one original card.
- Prove stable IDs, one history/autosave entry, exact undo/redo, no result-card creation, and no overwrite after user edits.

### Unit 4 - Focused and broad verification

- Status: `complete`
- Run focused backend and frontend tests first.
- Rebuild the frontend, then run related text/card/job/history/autosave/compatibility browser regression.
- Run the relevant locked backend and broad frontend suites while excluding only frozen later-Task RED assertions.
- Classify automated visual, functional, and interaction proof separately from Human acceptance.

### Unit 5 - Fresh review and delivery

- Status: `complete`
- Review the complete diff against model authority, mutation ordering, revision safety, compact payloads, accessibility, geometry, stable identity, compatibility, and protected paths.
- Reconcile Task/PLAN/PROGRESS/CURRENT/ROADMAP, create REPORT only after every non-deferred acceptance criterion passes, then run project-state, UTF-8, diff, sensitive-path, staged-secret, and exact-staging checks.
- Commit one scoped change, push `main`, and stop before activating or implementing T6-012.

## Verification order

1. Exact focused RED fingerprint.
2. Smallest coherent GREEN.
3. Focused backend/frontend/browser proof.
4. Fresh production build.
5. Related regression, then relevant broad regression.
6. State, diff, hygiene, staged-secret, commit, and push proof.

## Stop conditions

- Stop before T6-012 or any later Task behavior.
- Stop before a real/paid provider call, secret access, user/runtime migration, destructive operation, external-account change, or compatibility removal.
- Stop on unknown overlapping edits in an owned path.
- End every partial run with PROGRESS and CURRENT recording exact completed work, remaining work, next action, changed files, commands/results, and blocker release conditions.
