# TASK-T5-031 - Generation result placement and reveal

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-030 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make every foreground generation output immediately discoverable on a complex Canvas while keeping repeated results visually distinct, preserving the user's current generation context, and never stealing focus during background reconciliation.

## Scope

- Place canonical result variants in a deterministic non-overlapping column to the right of their generation node.
- Avoid overlap with existing graph nodes when selecting the next result slot.
- Preserve the current zoom and minimally translate the viewport only when a newly completed foreground result is outside the panel-safe visible area.
- Keep the generation node selected and its inspector open after result reveal.
- Keep background polling, reload reconciliation, Canvas switching, and readonly review free of automatic viewport or selection changes.
- Verify repeated image/video results, left/right panels, compact desktop, reload, background completion, lineage, undo/redo, and persisted viewport behavior.

## Non-goals

- Provider calls, backend changes, automatic graph-wide layout, zoom changes, animated camera travel, mobile editing, or redesigning result cards.

## Acceptance criteria

- First and repeated results never occupy the same visual bounds and retain one canonical source edge each.
- Placement is deterministic from authoritative graph state and avoids unrelated occupied bounds.
- Foreground success keeps zoom and selection stable while moving no farther than required to reveal the complete result inside desktop panel-safe bounds.
- Already-visible results cause no viewport mutation.
- Background/reload reconciliation and readonly review never pan or steal selection.
- Image/video media, result lineage, run history, reload, undo/redo, and autosave remain correct.
- Build, focused/related/full Chromium, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
