# TASK-T5-054 - Ordered multi-generation edge identity

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-053 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Make a selected edge identify its exact ordered role in a multi-node generation workflow, not merely its broad prompt, reference, or result type.

## Scope

- Resolve selected generation input identity from the authoritative generation context.
- Resolve selected generated-result identity from the authoritative result-variant lineage.
- Show exact `Tn`, `Rn`, and `Vn` roles in the existing selected-edge surface.
- Expose when a connected prompt or media input is excluded from the effective request.
- Preserve collision avoidance, insertion, reroute, keyboard, readonly, and zero-inspection-mutation behavior.

## Non-goals

- Reordering directly from the edge surface, persistent labels on unselected edges, changing provider limits, editing graph metadata, or changing result variant persistence.

## Acceptance criteria

- Reordered prompt inputs expose exact `T1..Tn` identities matching provider prompt order.
- Reordered media inputs expose exact `R1..Rn` identities matching provider reference order.
- Generated result edges expose exact `V1..Vn` identities from the same resolver used by result lineage.
- Excluded empty, missing, unsupported, duplicate, or over-limit inputs remain identifiable and explicitly state that they are not participating.
- Reloaded persisted `input_order` produces the same selected-edge identity.
- Only the selected edge renders one identity surface; graph inspection creates no document PATCH.
- 1440px, 920px, and 375px readonly states remain bounded, collision-free, and keyboard accessible.

## Visual direction

- Visual thesis: exact editorial role notation inside the quiet selected-edge surface.
- Content plan: `Tn/Rn/Vn` role chip, optional excluded state, source, direction, target.
- Interaction thesis: no new control; reuse contextual reveal, collision displacement, and passive readonly inspection.
