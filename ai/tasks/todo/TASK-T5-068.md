# TASK-T5-068 - Comparison variant panel-safe reveal

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-067 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Objective

Make selection from the result comparison tray locate the exact canonical result on Canvas, including distant or offscreen variants, while preserving responsive overlay ownership and inspection-only behavior.

## Scope

- Route comparison selection through the existing Canvas node selection and panel-safe reveal contract.
- Prove minimum translation for an offscreen sibling and no translation for an already-visible sibling.
- Preserve zoom, exact V lineage, tray dismissal, compact drawer ownership, readonly review, and zero graph mutation.

## Non-goals

- New camera math, fit-to-lineage behavior, graph layout, physical result stacking, provider calls, schema changes, or mobile editing.

## Acceptance criteria

- Choosing a distant V variant closes the tray, selects the exact result, and reveals it inside the unobscured Canvas area.
- Reveal preserves zoom and produces at most one viewport persistence update.
- Choosing an already-visible result does not move the viewport.
- Compact and readonly handoff do not leave a drawer or mask obscuring the selected result.
- Comparison selection produces no Canvas document mutation.

## Verification

- Add focused Chromium RED coverage with a distant canonical sibling and viewport/document request assertions.
- Run result-lineage and related reveal regressions, production build, visual inspection, diff, file-size, and sensitive-path gates.
