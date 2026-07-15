# TASK-T5-035 - Contextual typed node continuation

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-034 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Make the existing typed continuation workflow discoverable from a selected Canvas node through a quiet contextual action inspired by AIGCCanvasFlow, while preserving Revid's canonical port compatibility, atomic command, history, and panel-safe reveal contracts.

## Scope

- Show one downstream continuation trigger for a single editable, unlocked, supported node with at least one compatible output continuation.
- Reuse the existing continuation chooser and compatibility resolver instead of introducing a second node menu.
- Position the trigger at the selected node's canonical output edge with a fixed screen-space hit target.
- After an explicit trigger creation, select and minimally reveal the created node while preserving zoom and source graph.
- Verify desktop, zoom, compact drawer, keyboard, reduced-motion, locked/unsupported, and 375px readonly boundaries.

## Non-goals

- Copying AIGCCanvasFlow colors or glow treatment, always-visible controls, automatic execution, upstream trigger UI, backend changes, mobile editing, or replacing port dragging.

## Acceptance criteria

- Eligible single selection exposes one accessible `继续此节点` action; ineligible and multi-selection states expose none.
- The action opens the existing chooser with exactly canonical compatible types and full keyboard navigation.
- Selection creates one node plus one typed edge in one document patch and one undo boundary.
- The created node becomes selected and is minimally revealed without zoom change; undo/redo remain camera-neutral.
- Trigger geometry stays attached across zoom/pan and does not overlap the output port hit target.
- Compact drawer insets, reduced motion, readonly mobile, build, focused/related browser, visual, file-size, diff, and sensitive-path gates pass.
