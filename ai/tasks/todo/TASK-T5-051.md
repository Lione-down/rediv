# TASK-T5-051 - Reorderable composition preflight

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-050 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Let creators correct prompt and reference order inside the composition preflight before creating a generation workflow, without reselecting nodes or mutating the Canvas document.

## Scope

- Add one pure selection-order move resolver for a chosen T or R input.
- Reorder only within the chosen input kind while preserving the other kind's order.
- Expose keyboard-accessible up/down controls in the existing bounded composition source list.
- Apply changes through selection state only, immediately synchronizing Canvas roles and menu roles.
- Verify adjusted order becomes exact persisted image/video generation input order.

## Non-goals

- Pointer drag sorting, persisted generation input reorder changes, document history entries, backend/provider changes, mobile editing, or cross-kind conversion.

## Acceptance criteria

- Moving `R2` up swaps it with `R1` without changing `T1/T2` order.
- Moving `T1` down swaps it with `T2` without changing reference order.
- Boundary controls are disabled and announce the exact role/title they affect.
- Reordering changes selection state only and creates no document PATCH, graph revision, or history entry.
- Canvas markers, preflight list, created connection metadata, provider context, and reload inspector agree after reordering.
- Image and video composition both consume the adjusted order.
- Desktop and 920px compact controls remain in bounds; 375px readonly exposes no mutation controls.

## Visual direction

- Visual thesis: ordering controls behave like quiet editorial adjustments inside the existing graphite preflight, not a new tool mode.
- Content plan: role, full source title, then two compact directional controls.
- Interaction thesis: one press swaps the nearest same-kind source and updates roles in place with no decorative motion.
