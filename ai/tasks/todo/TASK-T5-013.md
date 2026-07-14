# TASK-T5-013 - Repair Canvas node editing, generation lifecycle, and connections

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-012 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Bring the implemented Canvas workflow back into agreement with the approved libTv-inspired product direction: editable creative nodes, recoverable long-running generation, visible playable results, and legible directional data flow.

## Scope

- Make registry-backed editable nodes expose a contextual content editor and persist edits through the Canvas command/autosave path.
- Separate long-running generation behavior from the shared 15-second request timeout and preserve an honest recoverable task state.
- Make successful image/video assets render inside result nodes with explicit loading, unavailable, and retry states.
- Improve port and connection direction, hit feedback, selection, and drag affordance without replacing the Canvas engine.
- Add focused regression coverage and real-browser evidence at the supported desktop viewport.

## Non-goals and human gates

- No database schema, migration, provider contract, Canvas engine, or unrelated visual redesign.
- No paid provider call, real secret access, or destructive operation.

## Acceptance criteria

- Script and prompt nodes declared editable by the node registry can be edited contextually and persist after reload.
- Image and video generation are not falsely declared failed solely because the shared 15-second client timeout elapsed.
- Queued/running/succeeded/failed/timed-out states remain distinguishable and retryable from durable task data.
- A succeeded image or video task materializes exactly one linked result node whose media is visibly rendered or whose concrete load failure is shown; a green empty card is not an accepted success state.
- Connections visibly communicate direction, ports communicate compatible roles, and hover/drag/selection feedback is clear.
- Focused tests, frontend build, and real-browser Canvas verification pass.

## Active unit

- Complete. Final evidence: `ai/reports/REPORT-T5-013.md`.
