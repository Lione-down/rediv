# TASK-T5-005 - Incremental renderer and command interactions

- State: `DOING`
- Phase: Product V2 / Phase 5
- Dependency: T5-004 `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Started: 2026-07-13

## Objective

Replace the rebuild-on-change Canvas renderer with a persistent keyed Leafer scene, then make pointer, keyboard, toolbar, and context-menu editing converge on one command model for selection, multi-move, duplicate, grouping, connection, arrangement, and view controls.

## Scope

- persistent Leafer world group with keyed node visual create, update, and delete;
- viewport transform updates without rebuilding node visuals;
- single, additive, and marquee selection plus multi-node movement;
- command contracts shared by pointer, keyboard, toolbar, and context-menu actions;
- duplicate, group, ungroup, connect, delete, align, distribute, lock, unlock, and stable auto-arrange;
- shortcut scope, accessible shortcut guidance, and synchronized DOM graph accessibility list;
- zoom 10% to 800%, fit graph/selection, view toggles, and focused performance/browser evidence.

## Non-goals

- autosave batching, idempotency, revision conflicts, 100-step command history, checkpoints, or restore UI owned by T5-006;
- node registry and project-shared asset/generation redesign owned by T5-007;
- final 200-node/300-connection milestone certification owned by T5-008;
- global non-Canvas page redesign, user/runtime migration execution, paid calls, secret access, or destructive data/filesystem work.

## Delivery Units

1. Unit A - persistent keyed Leafer world and incremental node reconciliation.
2. Unit B - command contract, selection state, and multi-node move/duplicate/delete.
3. Unit C - group, ungroup, connect, shortcut scope, and DOM accessibility list.
4. Unit D - fit, zoom, view toggles, align/distribute/lock, and stable auto-arrange.
5. Unit E - focused performance, browser, accessibility, regression, and Task closure evidence.

## Acceptance Criteria

- [x] Viewport pan and zoom update one persistent world transform and never clear or rebuild unchanged node visuals.
- [x] Node create, content/status/selection update, position update, and delete reconcile keyed visuals incrementally.
- [x] Single, modifier, marquee, and connection selection are deterministic and Canvas-scoped.
- [x] Dragging any selected node moves the whole selection as one command, with no API request during pointermove.
- [ ] Pointer, keyboard, toolbar, and context-menu mutations dispatch one typed command contract.
- [ ] Duplicate, group, ungroup, connect, delete, align, distribute, lock, unlock, and stable auto-arrange validate their selection and graph constraints.
- [x] The shortcut contract is Canvas-focus scoped, ignores editable controls, and is documented in an accessible panel.
- [x] Leafer visuals have a synchronized keyboard-reachable DOM list for locate, selection, connection review, and allowed deletion.
- [ ] Zoom spans 10% to 800%; fit graph/selection and view toggles remain usable across the required viewport matrix.
- [ ] Focused unit/browser tests, frontend build, relevant regression, fresh diff review, and hygiene gates pass.

## Linked Decisions And Specifications

- `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`
- `ai/decisions/ADR-002-v3-1-technology-stack.md`
- `ai/decisions/ADR-004-mysql-only-runtime-and-tests.md`
- `ai/decisions/ADR-005-project-multi-canvas.md`
- `ai/requirements/REVID-V2-PRD.md`
- `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- `ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md`
- `ui/REVID-V2-DESIGN-SYSTEM.md`

## Risks And Controls

- Visual or input regression: preserve current geometry, tokens, and event callbacks while changing only renderer lifecycle in Unit A.
- Hidden full-scene work: test the keyed reconciliation planner and statically reject `leafer.clear()` plus scene `JSON.stringify` invalidation.
- Reactive overwork: split node appearance, position, selection, viewport, and resize update paths instead of one deep scene watcher.
- Command/persistence boundary drift: T5-005 commands describe local graph intent; T5-006 owns save batching, revision advancement, and durable history.
- Mobile mutation leakage: every new command entry point must retain the existing below-768px review-only guard.
