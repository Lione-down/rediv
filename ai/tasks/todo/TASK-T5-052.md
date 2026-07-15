# TASK-T5-052 - Dense composition preflight scalability

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-051 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Keep composition review, ordering, and generation actions usable when creators combine a near-limit set of mixed Canvas nodes.

## Scope

- Verify a deterministic 10-node composition with 2 text prompts and 8 unique images.
- Make the source list the only scrolling region inside the composition preflight.
- Keep summary plus image/video generation actions visible while the source list scrolls.
- Preserve keyboard reorder for the first and last references across the scroll boundary.
- Prove exact adjusted image and video input order through persisted context.

## Non-goals

- More than 8 provider image references, list virtualization, drag sorting, backend limits, paid provider calls, mobile editing, or changing prompt truncation semantics.

## Acceptance criteria

- Ten valid mixed sources expose all `T1..T2` and `R1..R8` identities.
- The source list has bounded vertical overflow while the composition panel itself does not scroll.
- Image and video actions stay visible before and after scrolling the source list to either boundary.
- Keyboard focus can reach and reorder `R8` without closing the preflight or mutating the document.
- The adjusted eight-image order is exact in image and video generation commands and resolved context.
- Desktop and 920px compact menus stay in viewport with long localized titles.
- 375px readonly continues to expose no composition mutation.

## Visual direction

- Visual thesis: dense inputs read as a compact editorial queue inside the established graphite popover.
- Content plan: fixed summary, independently scrollable source queue, fixed image/video actions.
- Interaction thesis: scroll only the queue; keyboard reorder and primary choices never move out of reach.
