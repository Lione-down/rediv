# TASK-T5-080 - Canvas node and connection interaction usability

- State: `DOING`
- Objective: make Canvas connection starting and landing, aggregate multi-selection continuation, normal-group movement, and active connection direction forgiving and deterministic without weakening typed compatibility, command/history, autosave, responsive, or performance guarantees.
- Dependency: `T5-079 - DONE - PASS` at committed and pushed baseline `048a2f2393ddf3a20e728c77e3822708eccabcfb`.

## Scope

- Centralize the visible node layout rect used by hit testing, reveal centering, grouping, and selection-generation placement.
- Separate quiet port visuals from real screen-stable pointer hit targets.
- Filter connection targets by canonical authoring compatibility before nearest-distance ranking and snap to one exact eligible port.
- Render one neutral aggregate hull for every editable multi-selection and expose batch image/video continuation only when the existing selection-generation resolver permits it.
- Move a normal group and all supported descendants by one exact delta through one `move-nodes` command.
- Add restrained directional flow only to draft, selected, lineage, or otherwise active connections, with static reduced-motion fallback.
- Preserve the existing Vue 3, Leafer, SCSS token, typed node registry, `dispatchCommand`, autosave, undo/redo, and T/R/G/V provenance contracts.

## Acceptance criteria

1. Pointerdown inside the declared invisible port hit target but outside the visible dot starts the correct draft connection.
2. The visible port remains 12-16 world pixels, while its active hit target remains 32-44 CSS pixels at 10%, 25%, 50%, 100%, 200%, and 800% zoom; deterministic nearest-anchor resolution prevents overlap ambiguity.
3. Right click never starts a connection; middle button and Space+drag retain pan ownership; Escape and pointercancel remove a draft without mutation.
4. Dropping near multiple ports chooses the nearest compatible port. If no compatible port is in range, the continuation chooser opens exactly once.
5. Compatible target feedback identifies the exact target port; incompatible targets remain visibly unavailable and cannot receive a connection.
6. Every editable multi-selection receives one neutral aggregate hull. Invalid selections show no batch-output trigger and retain truthful feedback.
7. A compatible N-node aggregate previews exact text/reference counts and enabled image/video actions. One action creates one generation node plus N typed edges through the existing `insert-graph` command, one history entry, and one document PATCH.
8. Undo removes the complete batch insertion; redo restores identical IDs, order metadata, node position, and edges.
9. Dragging a normal group moves its group node and every child by the exact same delta; unrelated nodes remain unchanged and affected edges reflow during preview and after commit.
10. Ungroup preserves child world positions and connections. Group creation encloses canonical visible bounds, including intrinsic media and dynamic authoring-card height.
11. Selected, provenance, and draft connections may show three restrained directional flow segments. Idle unrelated edges remain static and reduced-motion produces static emphasis only.
12. Focused interaction suites, related Canvas regression, production build, desktop/compact/review-only visual evidence, full functional Chromium, hygiene gates, and the applicable owned 200-node/300-connection boundary pass.

## Non-goals

- No Storyboard UI, storyboard-group metadata, T5-081 work, timeline engine, concat, export, or new generation recipe.
- No backend, database, provider, quota, Canvas engine, UI framework, or mobile-editing contract change.
- No paid generation, external account, real-secret access, `.env` read, runtime migration, or destructive user-data operation.
- No broad redesign of media cards, authoring nodes, Inspector, comparison tray, or persistent graph semantics.

## Risks and controls

- `use-canvas-stage.ts` and `CanvasStage.vue` are already at or above the preferred file-size boundary; new policy and presentation logic must move into focused modules/components instead of expanding those files blindly.
- Inverse-zoom port hit targets can overlap at low zoom; compatibility filtering, stable tie-breaking, and nearest-anchor tests own determinism.
- Group preview and commit can drift if they resolve different descendants; one pure deterministic ID resolver must feed both paths.
- Connection motion can create paint/performance noise; overlays remain active-only, pointer-passive, CSS-driven, and disabled under reduced motion.
- Raw persisted `width` and `height` remain document data; the new layout resolver changes visible-geometry consumers only and must preserve serialization and provider contracts.

## Human gates

- Paid provider calls, real secret access, external accounts, destructive or irreversible MySQL/filesystem work, and user/runtime migrations remain Human Owner gates.
- The guarded live supervisor may run only with environment already supplied to the process and must not expose credential values.
