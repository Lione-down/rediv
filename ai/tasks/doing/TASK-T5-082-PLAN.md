# TASK-T5-082 Plan

- State: `DONE - PASS`
- Objective: deliver a registry-driven, keyboard-safe action surface and exact local image grid split while reusing authenticated project asset uploads and the atomic Canvas command model.

## Locked design direction

- Visual thesis: a compact graphite-black action surface with violet focus and selection, existing Canvas spacing, typography, radii, and depth steps, with media remaining the visual anchor.
- Content plan: search first, scan eligible professional actions, inspect a concise unavailable reason only where useful, execute explicitly, and return to the same Canvas context.
- Interaction thesis: Canvas-owned Slash, deterministic arrows, Enter, and Escape; quiet opacity/transform feedback only, disabled under reduced motion, and no automatic execution.
- Existing product vocabulary is authoritative: inspect `v2-canvas-tokens.scss`, current Canvas menus/toolbars, focus treatment, motion, localized copy, and responsive ownership before styling.
- CSS strategy: current scoped Vue SCSS plus existing Canvas tokens. No new library, token family, icon family, gradient, glass, or modal escape hatch.
- TDD rule: every production behavior begins with one focused failing test whose failure proves the missing requirement.

## Unit 0 - Durable activation

1. Read the complete project rules, CURRENT, ROADMAP, direct-delivery ADR, last Task pattern, and relevant design/TDD instructions.
2. Verify T5-081 Task, PLAN, PROGRESS, REPORT, CURRENT, ROADMAP, local HEAD, branch, and `origin/main` agree on `DONE - PASS`.
3. Record the baseline worktree and preserve untracked `.hermes/plans` and `output/` outside ownership.
4. Create T5-082 Task, PLAN, and PROGRESS; add ROADMAP order 82-90; make T5-082 the only `DOING` Task.
5. Re-read the truth set and repeat Git guards before business-code edits.

Success gate: T5-082 is the only active implementation Task and durable state agrees on scope, baseline, acceptance, gates, and exact next action.

## Unit 1 - Existing contract and coordinator audit

1. Map current node/action/recipe registries, asset upload clients, canonical image node builders, `insert-graph`, history/autosave, selection, shortcut, menu/drawer, readonly, and performance boundaries.
2. Read current Canvas token, menu, toolbar, focus, motion, localized copy, and 1440/1366/920/375 responsive patterns.
3. Measure touched coordinator files and define extraction seams before implementation.
4. Refresh this PLAN and PROGRESS with exact owned modules, test files, integration points, and the first RED fingerprint.

Success gate: the implementation design reuses existing truthful contracts and identifies no hidden schema, provider, paid, or destructive dependency.

### Verified integration design

- Pure contracts: add `professional-action-registry.ts`, `professional-action-commands.ts`, and `image-grid-split.ts` under `frontend/src/modules/canvas/`.
- UI and orchestration: add `CanvasProfessionalActionPalette.vue`, `use-canvas-professional-actions.ts`, and `use-canvas-image-grid-split.ts`; keep production logic out of `CanvasStage.vue` and `CanvasWorkspace.vue` except narrow props, events, and composition wiring.
- Keyboard owner: extend `use-canvas-stage-keyboard.ts` through `use-canvas-stage.ts` so plain Slash is accepted only from the focused Canvas surface, never Shift+Slash, editable/interactive/dialog targets, IME composition, readonly, blocked overlays, or active pointer/connection interactions.
- Existing mutation path: reuse `uploadProjectAsset()` through `project-resource-store.uploadAsset()`, then build canonical project image nodes and dispatch exactly one `insert-graph` command through the current executor, history, mutation, and autosave stack.
- Existing project boundary: selected targets must resolve to a matching `source: 'upload'`, active image in the already authenticated project resource snapshot. Generated results, empty asset placeholders, stale URLs, mismatched projects, future serialization, locks, parents, and multi-selection fail closed.
- Crop session: fetch/decode the selected upload once, derive integer pixel boundaries with `floor(dimension * boundary / gridSize)`, encode and upload one PNG at a time, release each transient file/blob before the next, and close the decoded source in `finally`.
- Placement: lay output nodes out in the crop's row-major grid to the right of the source, calculate one whole-block collision-safe anchor, and persist versioned crop indices/bounds in ordinary node content JSON.
- Focused tests: add registry/pure geometry/command specs first, then browser palette, ownership, upload, atomic mutation, undo/redo/reload, responsive, reduced-motion, and partial-failure cases. Extend the existing resource mock only for deterministic multi-upload failure and uploaded crop evidence.

## Unit 2 - Pure professional action registry

1. Write focused RED cases in `canvas-professional-action-registry.spec.ts` for stable IDs, deterministic search/category ordering, eligible and unavailable states, unknown actions, stale contexts, readonly, locked/grouped nodes, unsupported media, and 375px fail-closed behavior. The expected first RED is the missing `professional-action-registry` module.
2. Add typed action definitions and a pure resolution API separated from execution side effects.
3. Register only truthful existing or T5-082-owned intents and delegate execution to current command/action boundaries.
4. Revalidate eligibility immediately before dispatch and return a bounded non-mutating rejection when context changed.

Success gate: identical context produces identical action results, and unsupported or stale contexts cannot execute.

## Unit 3 - Slash Palette and keyboard ownership

1. Write browser RED cases proving Slash opens only from Canvas-owned context and is ignored by editable controls, dialogs, menus, drawers, IME composition, drag/connection gestures, readonly review, and 375px review-only mode.
2. Add the palette as a focused component/composable outside oversized Canvas coordinators.
3. Implement accessible search, deterministic filtered order, arrow/Home/End navigation, Enter execution, Escape/outside cancellation, and Canvas focus restoration.
4. Reuse existing tokens, focus rings, density, radius, dark surface steps, localized copy style, and reduced-motion behavior.
5. Prove open/filter/navigate/cancel produce zero graph, asset, generation, history, autosave, and viewport mutations.

Success gate: the palette is an accessible action projection, not a new command or state system.

## Unit 4 - Exact crop geometry and project asset pipeline

1. Write pure RED tables for 4, 9, 16, and 25 row-major partitions, non-divisible dimensions, full pixel coverage, no gaps/overlap, stable index/row/column, and invalid counts/dimensions.
2. Add one pure integer-boundary crop geometry module shared by extraction and tests.
3. Write browser/API-boundary RED cases for one eligible canonical project image, source immutability, foreign/external/result/video/broken/locked/grouped rejection, exact upload count, project ownership, and partial failure before graph mutation.
4. Decode the current project image through the existing same-origin asset surface, extract bounded image blobs, upload each through the existing authenticated project asset API, and release transient resources promptly.
5. Keep the source project asset and Canvas node unchanged; persist no blob/data URL.

Success gate: exact crop assets exist under the current project, ordered by the shared geometry, with zero graph mutation on any pre-insert failure.

## Unit 5 - One atomic Canvas insertion

1. Write browser RED cases for exact 4/9/16/25 canonical node counts, deterministic collision-aware placement, one `insert-graph`, one history entry, one PATCH, source preservation, and unrelated graph stability.
2. Build the crop nodes through the existing canonical project asset node factory and one graph command.
3. Verify exact undo, redo, autosave, reload, recovery, selection, and stable crop order.
4. Verify 25-output execution remains bounded and does not degrade current Canvas interaction or rendering.

Success gate: successful split is one atomic graph mutation and history boundary regardless of crop count.

## Unit 6 - Integrated verification and closure

1. Run focused registry, shortcut, palette, crop, upload, asset ownership, command, history, autosave, reload, recovery, responsive, accessibility, and reduced-motion specs.
2. Run related Canvas action, recipe, selection, connection, group, Storyboard, media, generation, and keyboard regression.
3. Build `frontend`, inspect 4/9/16/25, invalid, error, 920px, 375px, keyboard, and reduced-motion rendered states, then run the full functional Chromium Canvas suite.
4. Run the guarded owned 200-node/300-connection live supervisor only for verification, ensure temporary frontend/backend processes close afterward, and retain classified evidence under ignored `output/`.
5. Run fresh diff review, `git diff --check`, UTF-8, file-size/growth, sensitive-path, secret-pattern, tracked/staged artifact, exact staged-scope, and HEAD-drift gates.
6. Write `REPORT-T5-082.md`, close Task/PLAN/PROGRESS/CURRENT/ROADMAP, stage only owned paths, commit with a scoped message, and push `main` only when every non-deferred criterion passes.

Success gate: code, tests, evidence, durable state, commit, and `origin/main` agree on `DONE - PASS`, with frontend/backend closed after verification.

## Stop rules

- Stop and document a blocker if implementation requires a database or migration change, new backend endpoint, provider/paid call, secret access, destructive data work, new UI/graph/image library, second Canvas store, cross-canvas edge, mobile editing, or incompatible UX.
- Stop and re-plan if crop output cannot remain project-owned, source-preserving, fail-closed, and one graph mutation, or if Slash cannot preserve current keyboard ownership.
- Preserve pre-existing untracked `.hermes/plans` and `output/`; never stage them.
