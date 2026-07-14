# T5-013 Canvas Workflow Restoration Implementation Plan

- State: `DONE - PASS`
- Updated: 2026-07-15
- Product direction: preserve Revid's dark-purple visual identity while restoring libTv-style node workflow interaction.
- Implementation owner: Codex Project Lead Engineer

## Goal

Make the Canvas a usable end-to-end creative workspace where users edit content, configure and start generation, observe durable progress, inspect image/video results, and continue the workflow directly through connected nodes.

## Architecture

Keep Leafer UI as the persistent high-performance world renderer and retain the existing command, autosave, revision, and MySQL document contracts. Add a synchronized DOM interaction layer above Leafer for browser-native text editing and media rendering. Static and off-screen nodes remain lightweight Leafer visuals; the DOM layer owns only interactive node surfaces that need textarea, image, video, loading, error, or retry behavior.

Generation remains backend-authoritative. A client request timeout is never treated as proof of provider failure. The frontend reconciles ambiguous outcomes from durable generation tasks and project assets before presenting a terminal result.

## Tech stack and constraints

- Vue 3, TypeScript, Pinia, Naive UI, Leafer UI, SCSS.
- Existing Canvas command executor, autosave, revision, resource store, and API contracts.
- No Canvas engine replacement, database migration, provider-contract redesign, paid call, or secret access.
- Desktop editing at 1440x900, 1366x768, and 920x900; 375x812 remains review-only.
- Preserve the 200-node and 300-connection performance boundary.
- New or materially expanded source files must remain below 500 lines.

## User workflow target

1. Add or select a script/prompt node.
2. Edit text directly inside the selected node and see autosave state without opening a separate prompt dock.
3. Connect text or media output to compatible generation inputs with visible direction and compatibility feedback.
4. Configure and start image/video generation from the generation node.
5. Leave the node or switch Canvas without losing task identity.
6. See queued, running, succeeded, failed, or timed-out state on the node from durable task data.
7. On success, materialize exactly one connected result node that visibly renders the image or playable video.
8. Continue the result into another compatible generation node or inspect it at a larger size.

## Acceptance criteria

### Node editing

- Registry capability `canEditContent` is the only source of truth for node content editability.
- Script, prompt, note, and generation nodes expose node-local editing on desktop.
- Text composition, IME, focus, Backspace, Delete, undo/redo, Escape, and Canvas shortcuts do not conflict.
- Edits are debounced into the existing command/autosave path and survive reload.
- Mobile review mode exposes content but no editor or generation action.

### Generation lifecycle

- Image/video requests do not inherit the shared 15-second Axios timeout.
- A transport timeout or disconnect produces an `unknown/reconciling` client state, not an invented failed task.
- The resource store refreshes durable tasks/assets with bounded polling while work is queued/running or an outcome is ambiguous.
- Polling stops on terminal state, auth/project/canvas change, component teardown, or bounded reconciliation expiry.
- Backend task status and quota snapshots remain authoritative.
- Retry is manual and idempotent; the client never auto-submits a second paid generation request.

### Result media

- A successful image task creates exactly one result node and displays decoded image pixels.
- A successful video task creates exactly one result node with native playback controls or a poster plus explicit play action.
- Loading, unavailable URL, decode failure, and unsupported media are distinct visible states.
- A broken media URL never appears as an empty green success card.
- Result media uses browser-native `<img>` / `<video>` semantics, accessible labels, and object-fit behavior.
- Media remains visible after Canvas reload and backend restart when the asset URL remains valid.

### Connections

- Edges show source-to-target direction with a terminal arrow or equivalent endpoint treatment.
- Input/output ports have distinct shapes and text/media/result type semantics, not color alone.
- Starting a drag highlights compatible targets and mutes incompatible targets.
- Hover, draft, valid target, invalid target, selected, active/running, and reduced-motion states are visually distinct.
- Connections remain keyboard reachable and deletable.
- Duplicate and incompatible connections retain specific error messages.

### Visual direction

- Revid retains graphite-black surfaces and one violet accent family.
- Media is the strongest visual anchor; success borders do not overpower results.
- Node-local controls appear contextually and do not turn every node into a permanent dense form.
- The right panel becomes inspection/history/detail support, not the primary place to author prompts.
- No imitation of libTv branding, proprietary copy, icons, or exact visual assets.

## Implementation sequence

### Unit 0: Freeze regression fixtures and observable contracts

**Objective:** Create deterministic failing coverage for every user-visible defect before changing production code.

**Files**

- Modify: `frontend/tests/e2e/canvas-resource-generation-fixture.ts`
- Modify: `frontend/tests/e2e/canvas-resource-generation.spec.ts`
- Create: `frontend/tests/e2e/canvas-node-workflow.spec.ts`
- Create: `frontend/tests/e2e/fixtures/generated-result.svg`
- Create: `frontend/tests/e2e/fixtures/generated-result.mp4`

**Steps**

1. Replace the non-resolving `media.revid.test` success fixture with an intercepted same-origin image response containing decodable SVG or PNG bytes.
2. Add a deterministic broken-media route returning 404 and a delayed generation route exceeding 15 seconds without making a paid call.
3. Add a failing browser assertion that a successful result node contains visible native media with non-zero dimensions.
4. Add a failing assertion that broken media shows a labeled unavailable state rather than an empty card.
5. Add failing script/prompt node editing assertions covering IME-safe focus ownership and reload persistence.
6. Add failing edge assertions for direction marker, compatible target feedback, and selected connection state.
7. Run:
   `cd frontend; npx playwright test tests/e2e/canvas-resource-generation.spec.ts tests/e2e/canvas-node-workflow.spec.ts --project=chromium`
8. Expected: new assertions fail for missing native media, missing node-local editor, fixed 15-second timeout behavior, and missing connection semantics.

**Success gate:** each reported defect has a deterministic failing regression; existing unrelated assertions still pass.

### Unit 1: Introduce typed node interaction presentation

**Objective:** Centralize the data required by Leafer visuals and DOM interactive surfaces without duplicating registry logic.

**Files**

- Modify: `frontend/src/components/canvas/canvas-node-presentation.ts`
- Create: `frontend/src/components/canvas/canvas-node-interaction.ts`
- Modify: `frontend/src/modules/canvas/node-registry.ts`
- Test: `frontend/tests/e2e/canvas-node-workflow.spec.ts`

**Steps**

1. Extend node presentation with `canEditContent`, media subtype, media URL, task ID, and explicit media state inputs.
2. Add a pure interaction-state builder that maps node definition, read-only mode, selection, generation state, and asset data into one discriminated union.
3. Keep URL parsing structural through `URL`, never regex-based string assembly.
4. Add unit-level/browser-import assertions for script, prompt, image result, video result, unsupported, and mobile review states.
5. Run the focused spec and confirm the presentation assertions pass while UI assertions remain red.

**Success gate:** Leafer and DOM layers consume the same typed presentation contract.

### Unit 2: Add synchronized DOM node surface layer

**Objective:** Provide browser-native editors and media inside world-positioned nodes while preserving Leafer performance.

**Files**

- Create: `frontend/src/components/canvas/CanvasNodeSurfaceLayer.vue`
- Create: `frontend/src/components/canvas/CanvasNodeEditor.vue`
- Create: `frontend/src/components/canvas/CanvasNodeMedia.vue`
- Create: `frontend/src/components/canvas/canvas-node-surfaces.scss`
- Modify: `frontend/src/components/canvas/CanvasStage.vue`
- Modify: `frontend/src/components/canvas/composables/use-canvas-stage-presentation.ts`

**Steps**

1. Render a world-transformed DOM layer that uses the exact Canvas viewport transform and node rectangles.
2. Limit interactive DOM surfaces to selected/editing nodes and media nodes inside a viewport overscan boundary.
3. Set non-interactive wrappers to `pointer-events: none`; enable pointer events only for actual editor/media controls.
4. Implement node-local textarea with composition-event handling, focus ownership, Escape-to-close, and explicit save state.
5. Implement native image loading with `load`/`error` state and non-zero decoded dimension checks.
6. Implement native video with `controls`, `preload="metadata"`, poster support, metadata error state, and no autoplay.
7. Ensure the Leafer media placeholder is suppressed only when the DOM media surface is active, avoiding duplicate content.
8. Run focused editing/media specs at 1440x900 and 920x900.

**Success gate:** editable nodes can be authored in place; valid media is visibly rendered; broken media has a concrete state.

### Unit 3: Route content edits through the command/autosave boundary

**Objective:** Make node-local editing durable without producing one revision per keystroke.

**Files**

- Modify: `frontend/src/store/canvas.ts`
- Modify: `frontend/src/modules/canvas/canvas-commands.ts`
- Modify: `frontend/src/modules/canvas/canvas-command-executor.ts`
- Modify: `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- Modify: `frontend/src/components/canvas/CanvasContextPanel.vue`
- Test: `frontend/tests/e2e/canvas-node-workflow.spec.ts`

**Steps**

1. Define one content-edit command with before/after values so undo and redo remain deterministic.
2. Keep a local draft during focus and commit on debounce, blur, explicit generation start, Canvas switch, or teardown flush.
3. Prevent Canvas Delete/Backspace/letter shortcuts while textarea or composition owns focus.
4. Drive editability from registry capabilities rather than `mediaType`.
5. Change the context panel to a supporting inspector that mirrors content and task detail without being required for editing.
6. Verify reload persistence, undo/redo, Canvas switch flush, and mobile read-only behavior.

**Success gate:** text edits persist exactly once per committed edit unit and survive navigation/reload.

### Unit 4: Make generation transport outcome-safe

**Objective:** Stop classifying slow or disconnected generation requests as definite failures.

**Files**

- Modify: `frontend/src/modules/canvas/generation-service.ts`
- Modify: `frontend/src/modules/canvas/project-resource-api.ts`
- Modify: `frontend/src/modules/canvas/project-resource-store.ts`
- Modify: `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- Modify: `frontend/src/modules/canvas/generation-node-state.ts`
- Test: `frontend/tests/e2e/canvas-generation-service.spec.ts`
- Test: `frontend/tests/e2e/canvas-resource-generation.spec.ts`

**Steps**

1. Pass an explicit generation transport config that disables the shared 15-second timeout or uses a documented generation-specific ceiling.
2. Classify errors into server terminal failure, auth failure, client cancellation, ambiguous transport loss, and response-contract failure.
3. On ambiguous transport loss, refresh task history/assets and reconcile by source node and request context before changing node status.
4. Add bounded polling with exponential or capped intervals and cancellation through `AbortController` or Vue teardown cleanup.
5. Never set a source node to `failed` unless a durable task is failed/timed_out or the server returned a terminal no-task response.
6. Keep quota updates limited to validated backend snapshots.
7. Verify delayed success, Canvas switch, reload, auth change, durable failure, and no duplicate submission.

**Success gate:** a request lasting longer than 15 seconds can still reconcile to success; ambiguous network loss never invents failure.

### Unit 5: Make result materialization visibly complete

**Objective:** Guarantee that successful durable tasks become exactly one useful result node.

**Files**

- Modify: `frontend/src/modules/canvas/resource-commands.ts`
- Modify: `frontend/src/components/canvas/canvas-node-presentation.ts`
- Modify: `frontend/src/components/canvas/CanvasNodeMedia.vue`
- Modify: `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- Test: `frontend/tests/e2e/canvas-graph-commit.spec.ts`
- Test: `frontend/tests/e2e/canvas-resource-generation.spec.ts`

**Steps**

1. Preserve asset ID, URL, media subtype, source task, source model, origin Canvas, and optional preview/poster metadata in result-node content.
2. Validate strict source/task/asset scope before materialization.
3. Keep `result_materialized_task_id` and `hasResultForTask` as duplicate guards across reload and reconciliation.
4. Separate task success from media availability: task remains succeeded while media load may be unavailable/retryable.
5. Add an inspect/open action for large image viewing or video playback without moving primary workflow controls back to the side panel.
6. Verify valid image, valid video, 404, decode failure, reload, backend-restart fixture, and exactly-once materialization.

**Success gate:** no successful result is represented by an unexplained blank node.

### Unit 6: Restore directional typed connection interaction

**Objective:** Make the graph readable and make connection creation predictable.

**Files**

- Modify: `frontend/src/components/canvas/composables/use-canvas-connection-presentation.ts`
- Modify: `frontend/src/components/canvas/composables/use-canvas-command-interactions.ts`
- Modify: `frontend/src/components/canvas/canvas-renderer.ts`
- Modify: `frontend/src/components/canvas/CanvasStage.vue`
- Modify: `frontend/src/components/canvas/canvas-stage.scss`
- Modify: `frontend/src/components/canvas/canvas-geometry.ts`
- Test: `frontend/tests/e2e/canvas-node-workflow.spec.ts`
- Test: `frontend/tests/e2e/canvas-command-contract.spec.ts`

**Steps**

1. Extend connection presentation with source/target type, endpoint positions, direction marker, and interaction state.
2. Add SVG marker definitions or endpoint arrow treatment that remains legible under 10%-800% zoom.
3. Give input and output ports distinct geometry and accessible labels; add compact type indicators for text, media, and result.
4. During drag, compute compatible target ports from the registry and expose valid/invalid visual states.
5. Snap the draft edge to a compatible target within the existing geometry boundary; reject invalid drops without mutation.
6. Preserve the existing keyboard selection/delete path and reduced-motion behavior.
7. Verify crossing edges, multiple inputs, reverse drag attempts, duplicate edges, locked nodes, and dense graphs.

**Success gate:** users can predict edge direction and valid destinations before releasing the pointer.

### Unit 7: Rebalance node and inspector UX

**Objective:** Make nodes the primary working surface while keeping Revid's visual identity and contextual density.

**Files**

- Modify: `frontend/src/components/canvas/CanvasContextPanel.vue`
- Modify: `frontend/src/views/app/CanvasWorkspace.vue`
- Modify: `frontend/src/views/app/canvas-workspace.scss`
- Modify: `frontend/src/components/canvas/canvas-node-surfaces.scss`
- Modify: `frontend/src/assets/styles/v2-canvas-tokens.scss`
- Test: `frontend/tests/e2e/canvas-node-workflow.spec.ts`

**Steps**

1. Keep the inspector for metadata, history, errors, and expanded review; remove its role as the only prompt editor.
2. Define compact, selected, editing, generating, success, failed, and media-focused node states with one typography scale per action slot.
3. Reduce success glow so media dominates; reserve red/amber/green for semantic state icons and restrained borders.
4. Keep selected-node controls contextual and prevent toolbars from covering nodes at supported viewports.
5. Verify localized Chinese labels, long prompts, long task IDs, 200% browser zoom, keyboard focus, and 920px drawer behavior.

**Success gate:** the workflow is usable by working on nodes directly, and the side panel is optional support.

### Unit 8: Performance, accessibility, and regression closure

**Objective:** Prove the richer node surfaces do not regress the accepted Canvas boundary.

**Files**

- Modify: `frontend/tests/live/canvas-live-acceptance.spec.ts`
- Modify: `frontend/tests/e2e/canvas-resource-generation.spec.ts`
- Modify: `frontend/tests/e2e/canvas-node-workflow.spec.ts`
- Update after evidence: `ai/tasks/doing/TASK-T5-013-PROGRESS.md`
- Create after full pass: `ai/reports/REPORT-T5-013.md`
- Update after full pass: `ai/state/CURRENT.md`
- Update after full pass: `ai/state/ROADMAP.md`
- Update after full pass: `ai/tasks/todo/TASK-T5-013.md`

**Steps**

1. Run focused Chromium specs for editing, generation, result media, and connections.
2. Run full frontend Chromium regression.
3. Run `cd frontend; npm run build`; expected: TypeScript and Vite build pass.
4. Run the relevant backend generation/resource regression without real provider calls.
5. Run the owned live MySQL/browser boundary only through the existing guarded harness.
6. Re-run the 200-node/300-connection profile and record stable render, FPS, frame p95, pointer p95, long tasks, and DOM surface count.
7. Capture screenshots at 1440x900, 1366x768, 920x900, and 375x812, including one visible image result and one broken-media state.
8. Run keyboard-only, IME, reduced-motion, 200% zoom, and mobile review-only checklists.
9. Run `git diff --check`, secret-path hygiene, staged-file review, and a fresh diff review against every acceptance criterion.
10. Update durable state documents and write REPORT only after all non-deferred evidence passes.

**Success gate:** focused, full, build, browser, performance, accessibility, and documentation evidence agree.

## Likely production files changed

- `frontend/src/components/canvas/CanvasContextPanel.vue`
- `frontend/src/components/canvas/CanvasNodeEditor.vue`
- `frontend/src/components/canvas/CanvasNodeMedia.vue`
- `frontend/src/components/canvas/CanvasNodeSurfaceLayer.vue`
- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/canvas/canvas-node-interaction.ts`
- `frontend/src/components/canvas/canvas-node-presentation.ts`
- `frontend/src/components/canvas/canvas-node-surfaces.scss`
- `frontend/src/components/canvas/canvas-renderer.ts`
- `frontend/src/components/canvas/canvas-stage.scss`
- `frontend/src/components/canvas/canvas-geometry.ts`
- `frontend/src/components/canvas/composables/use-canvas-command-interactions.ts`
- `frontend/src/components/canvas/composables/use-canvas-connection-presentation.ts`
- `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage-presentation.ts`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/src/modules/canvas/canvas-commands.ts`
- `frontend/src/modules/canvas/generation-node-state.ts`
- `frontend/src/modules/canvas/generation-service.ts`
- `frontend/src/modules/canvas/node-registry.ts`
- `frontend/src/modules/canvas/project-resource-api.ts`
- `frontend/src/modules/canvas/project-resource-store.ts`
- `frontend/src/modules/canvas/resource-commands.ts`
- `frontend/src/store/canvas.ts`
- `frontend/src/views/app/CanvasWorkspace.vue`
- `frontend/src/views/app/canvas-workspace.scss`

## Verification commands

Focused frontend:

```powershell
Set-Location frontend
npx playwright test tests/e2e/canvas-node-workflow.spec.ts tests/e2e/canvas-resource-generation.spec.ts tests/e2e/canvas-generation-service.spec.ts tests/e2e/canvas-graph-commit.spec.ts --project=chromium
npm run build
```

Full frontend:

```powershell
Set-Location frontend
npx playwright test --project=chromium
```

Focused backend, exact test selection to be confirmed from existing generation suites before execution:

```powershell
python -m pytest backend/tests/test_image_generate.py backend/tests/test_video_generate.py backend/tests/test_canvas_generation_transactions.py -q
```

Repository hygiene:

```powershell
git diff --check
git status --short
git diff --stat
git diff --name-only
```

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| DOM overlays drift from Leafer during pan/zoom | Editors/media detach visually from cards | Use one shared viewport transform and geometry source; add repeated zoom/pan alignment tests |
| Too many DOM media nodes reduce performance | 200/300 acceptance regression | Viewport overscan virtualization; native DOM only for visible media and active editors; measure DOM count and frame p95 |
| IME or textarea shortcuts trigger Canvas commands | Lost text or accidental delete | Composition-aware focus ownership and dedicated keyboard regression |
| Disabling timeout leaves abandoned requests | Resource leakage | Cancellation on auth/project/teardown plus bounded durable polling; no duplicate paid submission |
| Provider URLs expire or block embedding | Blank results after success | Explicit media load state, manual retry/refresh, asset metadata separation, no false task failure |
| Visual changes overpower media | Workflow remains noisy | Reduce glow, keep media dominant, retain one violet interaction accent |
| Scope grows into full automation engine | Delays and contract churn | No execution scheduler, cross-canvas edges, audio generation, collaboration, or provider redesign in T5-013 |

## Deferred work

- Automatic downstream graph execution.
- Real-time collaboration and presence.
- Cross-canvas edges.
- Audio generation.
- Timeline/compositor/export pipeline.
- Provider WebSocket/SSE redesign.
- Canvas engine replacement.
- Exact libTv visual imitation or branding.

## Completion rule

T5-013 may move to `DONE - PASS` only when editable content, outcome-safe generation, visible image/video results, directional typed connections, 200/300 performance, supported viewport screenshots, accessibility checks, full regression, and durable state documents all agree. Passing JSON assertions without visible decoded media is explicitly insufficient.
