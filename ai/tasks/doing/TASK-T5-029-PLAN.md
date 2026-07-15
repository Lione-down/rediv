# TASK-T5-029 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: a compact graphite selection tool with one workflow-spark action, using violet only after intent is available.
- Content hierarchy: selected count, compose choice, then existing graph edit actions.
- Interaction thesis: choose image or video, atomically materialize the workflow, and transition selection to the new generation node without a modal.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- Figma keeps multi-object actions attached to the current selection.
- ComfyUI makes workflow construction explicit through typed nodes and edges.
- Runway separates image and video intent before execution.
- Revid combines these patterns through one selection-local subtype menu and the existing canonical graph command.

## Units

1. Add a pure request-ready selection resolver and atomic generation-fragment command factory.
2. Add the selection-toolbar compose menu and command interaction.
3. Verify valid mixed/text/image composition and every excluded selection class.
4. Verify atomic PATCH, undo/redo, reload order, preflight, readonly, responsive, and visual behavior.
5. Run build, focused/related/full Chromium, diff, and hygiene gates.
6. Synchronize durable state, write REPORT, commit, and push.

## Risks

- Port compatibility alone is weaker than actual request inclusion, so availability must reuse the authoritative generation-context resolver.
- Prompt and media orders are independent and must not inherit selection-click order.
- Toolbar width may clip near viewport edges after adding an action.
- Inserted edges must share one autosave and history boundary with the new node.
