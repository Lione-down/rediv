# TASK-T5-029 - Multi-selection generation composition

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-028 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Turn two or more selected, request-ready text and image sources into one image or video generation workflow through a single atomic Canvas action.

## Scope

- Resolve whether every selected node can become an included generation input.
- Offer image and video composition from the existing selection toolbar.
- Create one canonical generation node to the right of the selected bounds.
- Connect all selected sources in stable graph order with independent prompt/media `input_order` metadata.
- Commit the node and all connections through one `insert-graph` command and one undo boundary.
- Support mixed text/image, text-only, and image-only composition.
- Verify desktop, compact desktop, readonly, undo/redo, reload persistence, and request preflight order.

## Non-goals

- Immediate provider execution, automatic prompt writing, unsupported-media conversion, grouping, camera animation, backend changes, or mobile editing.

## Acceptance criteria

- The action is available only for at least two unlocked, unparented, supported sources where every source is included by the authoritative generation-context resolver.
- Empty text, missing image asset, video/audio media, duplicate image asset, more than eight images, generation/group/note, child, locked, and unsupported selections expose no composition action.
- Image and video choices create the correct canonical subtype, one node, and all typed edges atomically.
- T and R ordering follows stable Canvas node order and persists through reload; preflight reflects the same order.
- One undo removes the entire inserted fragment and one redo restores it exactly.
- Readonly 375px exposes no mutation action.
- Focused/relevant/full Chromium, build, visual, UTF-8, file-size, diff, and sensitive-path gates pass.
