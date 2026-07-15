# TASK-T5-044 - Zoom-consistent generation composer geometry

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-043 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Keep the selected generation node's detached composer visually proportional to its Canvas node across zoom levels so multi-input full-trace views do not clip prompt text or cover graph content.

## Scope

- Scale the detached composer as one world-space surface, including typography, padding, border, and focus outline.
- Preserve its existing world geometry and screen-space footprint at the same viewport.
- Verify selected multi-input generation workflows at low, normal, and high zoom.
- Verify desktop, compact desktop, and readonly/mobile boundaries.

## Non-goals

- Composer redesign, prompt behavior changes, new controls, graph mutation, auto-fit changes, provider calls, backend work, or mobile editing.

## Acceptance criteria

- At 44% to 51% trace-fit zoom, composer content scales with its frame and no longer clips into oversized text.
- At 100% the composer appearance and edit behavior remain unchanged.
- At supported 10% and 800% zoom limits, geometry remains finite and aligned with the generation node.
- The composer remains absent at the existing 720px mobile boundary.
- Editing, autosave, selection, fit, toolbar collision avoidance, and graph history regressions pass.
- Browser screenshots prove the result at 1440x900, 920x760, and 375x812.

## Visual direction

- Visual thesis: preserve Revid's quiet dark-purple graph and make the editor behave as a true part of the selected node rather than a screen-space form floating over it.
- Content plan: node identity first, compact prompt surface second, inspector remains the detailed authoring surface.
- Interaction thesis: zoom changes scale the complete composer continuously; focus and editing semantics stay stable without added motion.
