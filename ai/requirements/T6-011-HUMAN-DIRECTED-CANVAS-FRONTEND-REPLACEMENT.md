# T6-011 Human-directed Canvas frontend replacement

- Status: `HUMAN DIRECTED / ACTIVE`
- Direction date: `2026-07-24`
- Human direction: replace the complete visible and interactive Canvas frontend, including cards, from the supplied video rather than continuing incremental repair of the current UI.
- Reference video: `C:\Users\mkd\Videos\20260724_154111.mp4`
- Duration: `00:26:32`
- Existing behavior contract: [T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT](T6-011-HUMAN-CONFIRMED-CANVAS-CARD-INTERACTION-CONTRACT.md).

## 1. Decision and boundary

The current Canvas frontend is no longer a visual or interaction baseline. Its route, stores, commands, persistence adapters, and backend integrations may be reused only where they preserve accepted data authority. Existing Canvas shell, card chrome, persistent Inspector, surface composition, tool placement, and scattered overlays must not constrain the replacement design.

The replacement keeps:

- Vue 3, TypeScript, Pinia, Naive UI, and the existing build toolchain;
- Leafer as the world, camera, coordinate, and low-level hit-test engine unless the Human Owner explicitly directs an engine replacement;
- MySQL, Canvas documents, stable project/Canvas/node/edge IDs;
- graph commands, history, autosave, undo/redo, revisions, and Canvas switching;
- durable compact generation jobs, provider/model authority, quota and fail-closed boundaries;
- legacy document readability and result compatibility adapters.

The replacement discards as design authority:

- the current `CanvasWorkspace` visible shell and permanent right Context Panel;
- the current mixed Leafer/DOM card presentation;
- generic rounded authoring cards with internal duplicate type/title headers;
- permanently stacked generation parameters and technical state;
- global or detached work surfaces that are not geometrically owned by one card;
- old tool placement, duplicated menus, and visual snapshots that conflict with the video.

No real or paid provider call, secret access, user/runtime migration, destructive operation, database rewrite, framework rewrite, or T6-012+ behavior is authorized.

## 2. Video-derived product structure

### 2.1 Global Canvas shell

- Full-viewport near-black dotted Canvas with no permanent side Inspector.
- Top-left compact project/workspace and Canvas selector.
- Top-center `Workflow / Storyboard` view switch.
- Top-right compact account/share/capability utilities. Director/Agent imitation is excluded from T6-011.
- Bottom-center floating primary tool dock.
- Bottom-left quiet asset/library and viewport utilities, including zoom.
- Panels and popovers appear on demand and do not reserve permanent Canvas width.
- The minimap, Ctrl+mouse-wheel Canvas zoom, right-click Canvas menu, top-right utilities, and bottom-dock workflow actions remain functional production behaviors rather than decorative chrome.

### 2.2 Node grammar

- One external icon plus title/type identity line sits above each node body.
- Media nodes render the actual image/video as the node body. Metadata remains external and secondary.
- Text nodes are content surfaces, not form cards.
- Script cards stay compact and display stage/progress plus one explicit action into the structured Script workspace.
- Empty Image and Video nodes use a media-shaped placeholder with truthful workflow choices.
- Result is materialized into the owning generation card; legacy result nodes remain readable but are not manually creatable.
- Default title and type must never render as duplicate visible words.

### 2.3 Selection and tools

- Idle nodes show content, external identity, minimum lifecycle, and ports only.
- Selection enhances the same boundary and attaches one contextual toolbar.
- Toolbar placement is collision-aware and remains visually connected to the selected node.
- Media transformations live in the selected-node toolbar or its popovers.
- No selection state creates another body, another `+`, another status surface, or a permanent Inspector.

### 2.4 Attached composer

- The active Text, Script, Image, Video, Video Composition, or Audio workflow owns one attached composer.
- Composer width is screen-space stable and may exceed the world-space card width.
- The composer contains references, inline mention tokens, prompt, model, mode, parameters, and submit.
- Compact parameter summaries open into focused popovers.
- Above/below collision placement must never cover the external node label, ports, toolbar, or safe viewport insets.
- Deselect hides the composer without changing persisted configuration.

### 2.5 Script workspace

- The compact Script card opens a dedicated structured workspace through an explicit action.
- The workspace may occupy the full Canvas viewport and presents stage progress, structured rows/columns, editable fields, batch actions, and close/return behavior.
- Opening and closing it preserves graph selection, Canvas camera, Script identity, history, and autosave.
- It is a focused workflow surface, not an enlarged permanent node.

### 2.6 Text workflow

- Resting Text is a content surface with external identity.
- Double-click enters direct editing and attaches a rich-text toolbar.
- The editor captures text/IME input and does not drag the card or pan the Canvas.
- Assisted Text uses the same card-attached composer and explicit allowed model selection.

### 2.7 Image workflow

- Empty Image Generation uses a media-shaped placeholder and selected-card composer.
- Connected images are numbered thumbnails and atomic inline thumbnail/name tokens.
- Prompt, model, ratio, quality, resolution, count, and submit stay in the composer or compact parameter popover.
- Image transformations are contextual selected-card tools.
- Successful results replace the placeholder on the same stable card.

### 2.8 Video workflow

- Empty Video Generation exposes only supported text-to-video, first-frame, and first/last-frame paths.
- First and last frames remain explicit semantic roles.
- Ratio, resolution, duration, audio, count, model, mode, and ordered references live in the attached composer.
- Reference media and generated video remain separate bodies until the result returns to the original card.
- Video Composition remains a separate authoring workflow.
- Audio Generation remains visible but backend-model-gated and currently unavailable without compatible models.

### 2.9 Ports and edges

- One visible acquisition `+` exists on the left and one on the right of every ordinary card, independent of how many typed logical ports the card retains.
- Input/output acquisition is symmetric and elastic.
- Multiple typed logical inputs may converge through one visible control, but connection/drop resolves exactly one compatible logical pair or fails closed.
- The visible acquisition control, its hit region, and follow radius scale with the Canvas viewport rather than remaining fixed in screen space at low zoom.
- Image results show the whole source frame without cover-cropping, and playable video results do not retain a redundant lifecycle overlay over native controls.
- The visible `+` starts or accepts a connection gesture; persisted edges attach to the card boundary, never to the `+`.
- Resting edges are thin and quiet; hover, draft, selection, and flow enhance the same path.
- Persisted and draft edges are always the bottom-most graph content and never paint over card bodies, labels, media, editors, or controls.
- Visible controls, acquisition centers, draft origins, card-boundary attachment points, and SVG endpoints share one projected geometry authority while retaining their distinct roles.

## 3. Frozen video evidence map

| Time | Replacement requirement |
|---|---|
| `00:00:00-00:02:45` | Global shell, compact Script card, node-local composer, model menu, selected toolbar, and explicit Script workflow entry. |
| `00:02:45-00:07:45` | Dedicated full structured Script workspace, stage progress, editable table content, batch actions, and return to Canvas. |
| `00:08:00-00:10:30` | Graph continuation, media/video bodies, selected toolbars, and mixed node topology. |
| `00:10:30-00:11:15` | External Text identity, double-click direct editor, rich-text toolbar, and port continuation menu. |
| `00:11:15-00:14:45` | Empty Image body, attached composer, upload/reference workflow, generation progress, and compact parameters. |
| `00:15:00-00:18:30` | Multiple image references, numbered thumbnails, inline mentions, edge-backed removal, and prompt editing. |
| `00:18:45-00:20:15` | Empty Video modes, explicit first/last frames, ratio/resolution/duration/audio/count popover, and attached composer. |
| `00:20:15-00:24:45` | Dense graph overview, generated media bodies, video continuation, result application, and zoom-legible hierarchy. |
| `00:25:00-00:26:32` | Selected-media transformation toolbar and focused adjustment popovers. |

## 4. Visual theme and atmosphere

Visual thesis: a restrained, near-black cinematic graph where media and authored content carry the visual weight and all controls recede until interaction.

- Canvas: reuse the existing Revid near-black and dotted-grid tokens.
- Surfaces: use luminance steps rather than dark drop shadows as the primary depth cue.
- Accent: keep the accepted Revid violet for focus/selection and current semantic success/warning/danger tokens.
- Do not copy LibTV branding, private assets, proprietary icons, copy, model names, or provider identity.

## 5. Typography and component rules

- Reuse the current Revid system Latin/CJK stack; do not introduce a new font dependency.
- External node labels use one compact 11-12px level with type icon, title, and optional metadata.
- Node content uses 13-16px according to zoom projection; direct Text editing may scale larger only when explicitly editing.
- Technical IDs, provider raws, lineage dumps, and compatibility labels are absent from normal Canvas chrome.
- Radius scale remains the existing named Revid scale. Media bodies use the established medium radius; tool docks/popovers use large/pill tokens consistently.
- No `transition: all`, glassmorphism default, decorative gradient, or generic card grid treatment.

## 6. Layout and depth

- Canvas content consumes the full route viewport.
- Top and bottom chrome floats above the Canvas and never changes world coordinates.
- Card bodies are world-space; attached work surfaces and toolbars use explicit screen-space placement contracts.
- External labels, toolbars, composers, ports, and edges must be disjoint at supported zooms.
- Dark surface hierarchy uses the existing Canvas base, card/content step, elevated composer step, and prominent popover step.

## 7. Interaction and accessibility

- Interaction states are explicit: idle, selected, card-drag, Canvas-pan, direct-edit, composing, toolbar, port-drag, submitting, running, succeeded, failed, disabled.
- Only one state owns the pointer/keyboard stream at a time.
- Every icon-only action has an accessible name, visible focus, and at least a 40px acquisition target where it is a primary control.
- Keyboard selection, direct editing, composer traversal, token reorder/removal, Script workspace open/close, undo/redo, and Escape restoration are required.
- Reduced motion disables flow and decorative transitions without hiding state.
- Desktop is the editing target; compact/mobile remains review-only.

## 8. Replacement architecture

The new visible runtime will be developed under a dedicated replacement subtree and consume existing typed domain ports:

```text
CanvasWorkspace route and orchestrator
  -> canvas-runtime shell
    -> world projection layer
    -> DOM node layer
    -> SVG edge layer
    -> attached surfaces layer
    -> floating shell chrome
  -> existing typed commands / stores / API clients
```

The old visible subsystem may remain callable only inside isolated regression/compatibility fixtures until the cutover. Production must never render old and replacement Canvas bodies simultaneously.

Replacement ownership:

- new shell owns top/bottom chrome and viewport insets;
- new world projection owns one frame-coherent node/edge/port layout;
- new DOM cards own all visible node bodies and direct interaction;
- Leafer owns world/camera/hit proxy only;
- existing commands own graph/history/autosave mutation;
- existing generation services own job/provider/quota mutation.
- normal persisted-card progress/reload polling uses exact compact bound-job status/result routes and does not call the current-Canvas delta list.

### 8.1 Retain / replace / retire matrix

| Current surface or authority | R8J disposition | Cutover rule |
|---|---|---|
| `canvas.ts`, Canvas document/list/revision stores, stable graph IDs | **Retain** | Consume through typed adapters; do not fork graph state into a replacement-only store. |
| `canvas-commands.ts`, command executor, history, autosave and revision APIs | **Retain** | Every replacement mutation must enter through the same command/history authority. |
| generation capability, compact job, provider, quota and result-projection modules | **Retain** | Keep backend-authoritative model gating and fail closed before all mutation. |
| legacy node/document readers and result compatibility projection | **Retain** | Read old documents without exposing legacy creation or duplicated visible result bodies. |
| Leafer world/camera/coordinate/hit proxy | **Retain, narrow** | It may project world geometry and hit proxies but must not draw a second visible card, port, label, or status body. |
| `CanvasWorkspace.vue` visible template and `canvas-workspace.scss` layout | **Replace** | Route/data orchestration may remain while all production-visible shell ownership moves into `canvas-runtime/`. |
| `CanvasStage.vue` visible composition and `canvas-stage.scss` | **Replace** | Keep reusable camera/command logic only behind typed runtime adapters; do not preserve its visual hierarchy. |
| `CanvasNodeSurfaceLayer.vue`, `CanvasRuntimeCard.vue`, `CanvasCardWorkSurface.vue` and old card SCSS | **Replace** | New DOM node layer owns the complete body, label, selection, direct edit, lifecycle and attached surface. |
| `CanvasConnectionLayer.vue`, current visible Leafer ports and independent port offsets | **Replace** | New SVG projection consumes the same frame geometry as the visible port and hit target. |
| `CanvasSelectionToolbar.vue`, `CanvasToolDock.vue`, `CanvasViewControls.vue` visible wiring | **Replace** | New selected-node toolbar and bottom dock follow the video-derived screen-space anchors. |
| permanent desktop `CanvasContextPanel.vue` and selection-opened Inspector behavior | **Retire from production** | Focused popovers and attached composers own authoring controls; compatibility fixtures may keep the old panel until R8J7. |
| global/detached generation work surfaces and duplicated technical state shelves | **Retire from production** | One active card owns one composer; lifecycle appears once on the owning card. |
| generic creation of Director, Result or Group authoring cards | **Retire** | Director is absent, Result is materialized only, and grouping is not a T6-011 authoring taxonomy entry. |

### 8.2 Staged replacement isolation

- R8J1-R8J6 use an explicit `canvas_runtime=replacement` workbench query so incomplete replacement slices never render beside the current Canvas in one view.
- The workbench reads the same route stores and document authority and must be mutation-free until an interaction-specific GREEN explicitly authorizes a command.
- R8J7 removes the temporary query gate, makes the replacement the only production Canvas body, and removes the old visible route wiring.
- A fresh build is mandatory before every workbench or cutover browser proof; stale preview artifacts are invalid evidence.

## 9. Verification and release

- Every replacement slice starts with behavior-focused RED tests against the video-derived contract.
- Browser proof uses fresh build artifacts and real rendered geometry.
- The cutover matrix must cover 1440x900, 1366x768, 920x900, 50/100/200% zoom, overview fit, keyboard, reduced motion, persistence, history, autosave, and Canvas switching.
- Port/edge proof uses `getPointAtLength()` and `getScreenCTM()`.
- The 200-node/300-edge performance thresholds remain unchanged.
- Automated evidence cannot replace Human review of the complete Canvas workflow.
- T6-011 remains `DOING / PENDING` until the replacement frontend is complete and the Human Owner explicitly accepts it.
