# TASK-T5-037 - Multi-selection input role preview

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-036 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make multi-node generation composition visually predictable before creation by showing each selected source's exact prompt or reference role and independent input order directly on the Canvas.

## Scope

- Project ordered `T` and `R` source roles from the same command used to create a selection generation workflow.
- Show compact fixed-screen role markers on eligible multi-selection nodes.
- Keep prompt and image ordering independent and consistent with persisted connection metadata and provider preflight.
- Hand off to existing generation provenance after workflow creation.
- Verify mixed, text-only, image-only, result remix, invalid, compact, readonly, undo/redo, and no-mutation preview boundaries.

## Non-goals

- Previewing speculative edges or a ghost generation node, changing placement, reordering inputs, executing providers automatically, backend changes, mobile editing, or copying reference-product styling.

## Acceptance criteria

- Eligible selected sources show `T1..Tn` and `R1..Rn` according to the exact command connections.
- The compose menu counts and video semantics agree with the markers.
- Opening, closing, or viewing the markers produces no document mutation.
- Creating image/video workflows preserves the displayed independent order in connection metadata, provenance, preflight, and request payload.
- Invalid, locked, grouped, duplicate, unsupported, and readonly selections show no editable intent preview.
- Build, focused/related Chromium, desktop/compact visual, file-size, diff, and sensitive-path gates pass.
