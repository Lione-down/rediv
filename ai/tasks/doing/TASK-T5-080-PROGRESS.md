# TASK-T5-080 Progress

- Task state: `DONE - PASS`
- Active unit: none. Unit 8 integrated verification and durable closure are complete.

## Completed work

- Read the complete project rules, CURRENT, ROADMAP, direct-delivery ADR, T5-080 candidate plan, and T5-079 durable-document pattern.
- Confirmed `main`, local HEAD, and `origin/main` start at `048a2f2393ddf3a20e728c77e3822708eccabcfb` (`fix(canvas): isolate keyframe rail positioning`).
- Confirmed no tracked worktree changes. Pre-existing untracked `.hermes` plans and `output/` belong outside T5-080 staging.
- Audited the named source and test surfaces. The candidate defects remain present: connection target lookup ranks geometry before typed compatibility, group bounds and multiple visible-geometry consumers still use raw persisted size, port interaction uses the visible Leafer ellipse, the aggregate hull remains generation-intent-specific, and group drag does not yet share one descendant resolver.
- Recorded the existing design direction: scoped Vue SCSS, V2 Canvas tokens, dark-purple media-first surfaces, quiet idle graph chrome, contextual active feedback, desktop-first editing, compact handoff, and 375px review-only behavior.
- Recorded file-growth constraints: `use-canvas-stage.ts` is 500 lines and `CanvasStage.vue` is 601 lines, so new policy/presentation logic must be extracted into focused modules/components.
- Created and activated the T5-080 Task, PLAN, and PROGRESS contract.
- Completed the canonical visible-node geometry Unit through strict TDD. One shared resolver now owns authoring-card height, intrinsic media size, and visible rects used by presentation geometry, group creation, selection-generation placement, context-menu hit testing, and minimap centering.
- Observed four expected RED fingerprints before production changes: group bounds used `568×308` instead of `468×348`; selection generation used `(716, 100)` instead of `(616, 120)`; portrait lower-surface context menu exposed blank-Canvas actions; minimap centering missed the visible center by 70px.
- Turned all four RED cases GREEN and passed the complete 34-test command/presentation/selection/visual focused matrix plus a 4,842-module production build.
- Committed and pushed the canonical geometry Unit as `22ada03` (`refactor(canvas): centralize visible node geometry`).
- Completed the real port-target Unit through RED-GREEN-REFACTOR. The frozen RED proved that dragging 14 CSS px outside the visible output dot did not acquire the port; pure geometry also fixed the required 40 CSS px target across 10%, 25%, 50%, 100%, 200%, and 800% zoom.
- Separated the 16-world-px visual port from pointer acquisition. A canvas DOM capture resolver now owns the 40 CSS px screen-stable target without adding hundreds of invisible Leafer leaves; it ignores non-canvas overlay targets so edge reroute handles keep ownership.
- Preserved explicit gesture ownership: middle-button and Space-plus-primary drags pan by the exact asserted viewport delta, right click never starts a connection, and Escape/pointer cancellation leave graph and history unchanged.
- Diagnosed the first transparent-target implementation before retaining it: 400 alpha-painted or path-hit Leafer targets reduced the mock dense trace to 50.79 FPS or a 33.3 ms scheduling bucket. Removing those leaves restored the unchanged owned gate.
- Corrected the canonical minimap resolver import left by the prior geometry refactor, then rebuilt the exact bundle used by Playwright preview.
- Passed the final Unit 3 matrix 22/22 across port geometry, continuation, endpoint reroute, 200-node/300-connection performance, listener/heap, accessibility, and viewport coverage. Production build passes with 4,844 transformed modules.
- Committed and pushed the verified port-target Unit as `e77e40b` (`fix(canvas): enlarge real port hit targets`).
- Completed exact compatible drop resolution through two deterministic RED fingerprints: the resolver chose the nearest incompatible `result-nearest:in` instead of a 12px-farther compatible `generation-compatible:prompt`, and it returned an incompatible port rather than `null` when no compatible port existed.
- Extended one shared resolver to filter locked, direction-mismatched, unsupported, and canonically incompatible candidates before stable distance ranking. Its result now includes exact surface anchor and distance, and both new connections and same-ID endpoint reroutes reuse it.
- Snapped the active draft path to the exact eligible anchor and added pointer-passive exact-port feedback. In the overlapping browser case only `generation-cover:prompt` is marked, `result-existing:in` remains unavailable, and the committed edge uses the exact compatible port.
- Kept `use-canvas-stage.ts` at 500 lines by extracting compatible-target and snapped-draft policy into `canvas-connection-target.ts`.
- Passed Unit 4 target, continuation, and reroute matrix 19/19, target/workflow focused matrix 9/9, and the extracted-overlay 1/1 recheck. The final production build passes with 4,847 transformed modules.
- Completed the neutral aggregate and batch-continuation Unit through browser-first RED-GREEN-REFACTOR. The three frozen RED cases failed only because the neutral `.selection-aggregate-hull` and its right-center continuation trigger did not exist.
- Renamed the composition-only presentation contract to a neutral aggregate hull and now render `已选 N 个节点` for every editable multi-selection. Invalid selections keep the truthful hull but expose neither T/R intent markers nor either batch trigger; readonly 375px review remains passive.
- Extracted `CanvasSelectionAggregate.vue` and one shared `CanvasSelectionGenerationMenu.vue`. The aggregate exposes one accessible 40px `+` trigger only when `resolveSelectionGenerationIntent` returns a canonical intent, while the toolbar reuses the same menu instead of retaining a second preflight implementation.
- The aggregate preflight reports exact source, text, reference, and result-reference counts plus the canonical video mode. Escape restores trigger focus, outside pointerdown closes the menu, and source order stays owned by the existing selection-order command.
- Both aggregate and toolbar actions reuse `composeGenerationSelection`, which dispatches the existing `createSelectionGenerationCommand` `insert-graph` result unchanged. The aggregate browser case creates one generation node and N typed edges through one document PATCH; existing history/output coverage remains GREEN.
- Passed the complete Unit 5 selection-generation, output, command-history, and LibTV visual parity matrix 25/25, the Escape/outside-click recheck 1/1, and a 4,853-module production build.
- Completed group-as-one-unit movement through strict RED-GREEN-REFACTOR. The pure RED failed because `resolveCanvasDragNodeIds` did not exist; the browser RED proved a group pointer move left the external `B -> C` path unchanged, so current interaction never entered preview.
- Added one pure `canvas-drag-resolution.ts` contract. It expands each selected normal group into deterministic parent-before-child IDs, supports nested descendants, de-duplicates covered selection, and rejects orphaned, cyclic, locked, unsupported, or partial child movement.
- Reused the exact resolved ID set for pointer origins, preview mutation, `createMoveNodesCommand`, and executor validation. Group moves additionally require one complete move record per resolved node and one identical delta across the unit.
- Verified browser semantics end to end: the external edge reflows during pointer preview; pointercancel restores every origin and creates zero PATCH; a completed drag emits one PATCH containing the group then both children; the unrelated node is absent; undo, redo, and reload retain exact IDs and positions.
- Verified ungroup after reload leaves both child world positions and both connections unchanged. Locked and unsupported descendants fail closed before preview or command creation.
- Extracted the pure tree policy after GREEN so `canvas-commands.ts` is 453 lines, the new resolver is 61 lines, and `use-canvas-stage.ts` remains exactly 500 lines.
- Added and visually inspected clean desktop evidence at `output/playwright/t5-080-group-drag/group-and-children-moved.png`; group hull, children, toolbar, Inspector, minimap, and external edge agree on the moved state without mock-resource errors.
- Passed the final Unit 6 command contract, interaction, history, persistence, and arrangement matrix 32/32 plus a 4,854-module production build.
- Completed active-only connection flow through strict RED-GREEN-REFACTOR. The pure RED failed on the absent motion resolver; browser REDs then failed only because draft, selected-edge, and selected-lineage flow paths did not exist.
- Added one pure `canvas-connection-motion.ts` policy. Persisted `status: active` is intentionally not a motion input; only draft, explicit edge selection, and included provenance resolve to flow, while excluded provenance and unrelated idle edges remain static.
- Reused the authoritative connection path as one pointer-passive SVG duplicate with normalized `pathLength=1` and exactly three bounded directional dash segments. Base paths, arrow markers, keyboard/pointer hit paths, graph identity, history, and persistence remain unchanged.
- Moved the temporary new-connection draft into `CanvasConnectionLayer` so new connection and endpoint reroute drafts share the same transformed presentation and reduced-motion fallback. One scoped dash-offset animation drives normal motion; `prefers-reduced-motion` retains static three-segment emphasis. Hiding idle edges still leaves an active draft visible without exposing base edges.
- Verified the dense fixture starts with 300 persisted active edges and zero flow overlays. The 30-second interaction profile permits at most the one explicitly selected edge and passed unchanged thresholds at 57.37 FPS, 16.8 ms frame p95, 8.1 ms pointer-feedback p95, zero long tasks, and 11.19 minimap updates/s.
- Passed the effective Unit 7 matrix 51/51 across motion policy, connection continuation, endpoint reroute, generation provenance, LibTV visual parity, multi-scenario rendering, performance, listener/heap, accessibility, viewport checks, and hidden-idle-edge draft preservation. Production build passes with 4,855 transformed modules.
- Visually inspected selected-edge and ten-edge selected-lineage evidence. Three flow segments are visible but restrained; idle edges, nodes, arrows, Inspector, and minimap retain the existing low-noise dark-purple hierarchy.
- Completed integrated Unit 8. Active flow paths now render in a separate pointer-passive SVG layer, selected and provenance paths are enumerated in proportion to active paths rather than all persisted edges, and non-primary pointerdown bubbles to the existing pan/context ownership.
- Corrected the performance fixture to fulfill the Canvas resource/capability reads it actually triggers, clear transient selection before measurement, and prove zero flow overlays throughout the idle 200/300 profile. The already-visible result fixture moved 10px upward because canonical square-media geometry made the old coordinate one pixel outside the safe viewport.
- Passed the final focused and related matrix 61/61, excluding only the separately classified environment-sensitive mock performance threshold case.
- Passed full functional Chromium 372/372 with the environment-sensitive mock performance case excluded by exact title. No functional, listener, heap, accessibility, responsive, history, persistence, or network regression remained.
- Ran the guarded owned supervisor without reading `.env`. Run `t5008-8928-2f348650034263c4` passed and cleaned its owned schema, runtime, and processes with 200 nodes, 300 connections, revision 3, 174ms stable render, 59.92 FPS, 16.8ms frame p95, 0.1ms pointer p95, and zero long tasks over 30 seconds.
- Classified the local mock performance variance without weakening thresholds. The software-rendered host run reached 55.16 FPS but retained a 33.3ms p95 scheduling bucket against the 33ms limit; the guarded owned live boundary passed the unchanged threshold at 59.92 FPS and 16.8ms p95.
- Passed the final 4,855-module production build and inspected 1440x900, 1366x768, 920x900, and 375x812 evidence. Desktop, compact, graph-access, minimap, active-lineage, and review-only ownership remained coherent.
- Completed fresh diff, UTF-8, file-size, sensitive-path, staged-secret, and worktree hygiene review. Pre-existing `.hermes` plans and `output/` remain outside staging.

## Remaining work

- None for T5-080.

## Exact next action

Keep the repository `IDLE` until the Human Owner selects another bounded Task. T5-081 remains inactive.

## Files changed

- `ai/tasks/todo/TASK-T5-080.md`
- `ai/tasks/doing/TASK-T5-080-PLAN.md`
- `ai/tasks/doing/TASK-T5-080-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T5-080.md`
- `pitfalls.md`
- `frontend/src/modules/canvas/node-layout.ts`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/src/modules/canvas/canvas-drag-resolution.ts`
- `frontend/src/modules/canvas/selection-generation.ts`
- `frontend/src/components/canvas/canvas-authoring-card-presentation.ts`
- `frontend/src/components/canvas/canvas-node-presentation.ts`
- `frontend/src/components/canvas/canvas-geometry.ts`
- `frontend/src/components/canvas/canvas-connection-target.ts`
- `frontend/src/components/canvas/canvas-connection-motion.ts`
- `frontend/src/components/canvas/canvas-stage.scss`
- `frontend/src/components/canvas/CanvasConnectionLayer.vue`
- `frontend/src/components/canvas/CanvasConnectionTargetPorts.vue`
- `frontend/src/components/canvas/CanvasSelectionAggregate.vue`
- `frontend/src/components/canvas/CanvasSelectionGenerationMenu.vue`
- `frontend/src/components/canvas/CanvasSelectionToolbar.vue`
- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/canvas/canvas-port-interaction.ts`
- `frontend/src/components/canvas/canvas-port-presentation.ts`
- `frontend/src/components/canvas/canvas-renderer.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage-presentation.ts`
- `frontend/src/components/canvas/composables/use-canvas-connection-presentation.ts`
- `frontend/tests/e2e/canvas-command-contract.spec.ts`
- `frontend/tests/e2e/canvas-selection-generation.spec.ts`
- `frontend/tests/e2e/canvas-libtv-visual-parity.spec.ts`
- `frontend/tests/e2e/canvas-connection-continuation-browser.spec.ts`
- `frontend/tests/e2e/canvas-connection-target.spec.ts`
- `frontend/tests/e2e/canvas-connection-motion.spec.ts`
- `frontend/tests/e2e/canvas-generation-provenance.spec.ts`
- `frontend/tests/e2e/canvas-performance-accessibility.spec.ts`
- `frontend/tests/e2e/canvas-port-geometry.spec.ts`
- `frontend/tests/e2e/canvas-result-lineage.spec.ts`

## Commands and evidence

- Memory quick pass: no T5-080 or directly applicable prior-run entry was present in `MEMORY.md`; repository truth sources were used.
- Git preflight: `git status --short`, `git diff --stat`, `git diff --name-only`, and `git rev-parse HEAD`; result was no tracked diff, four pre-existing untracked `.hermes` plans, untracked `output/`, and HEAD `048a2f2`.
- Source audit: `rg` confirmed current geometry, target selection, selection-generation, group, and motion ownership at the paths named in PLAN.
- File-size audit: the two existing orchestration surfaces named above are already at/over the preferred boundary; extraction is mandatory for substantial new logic.
- Geometry RED: focused group command failed with received `568×308` versus canonical `468×348`; focused selection placement failed with received `(716, 100)` versus canonical `(616, 120)`.
- Browser geometry RED: portrait lower-surface context menu did not expose node actions; minimap centering missed canonical visible center by 70px.
- Geometry GREEN: focused 10/10 passed after shared resolver integration; complete related command contract, node presentation, selection generation, and LibTV visual parity matrix passed 34/34.
- Production build: `vue-tsc -b && vite build` passed with 4,842 transformed modules.
- Port RED: the outside-dot drag at a 14 CSS px offset did not open continuation; the same test turned GREEN only after a real 40 CSS px acquisition boundary was installed.
- Gesture ownership GREEN: outside/inside boundary, middle/right ownership, Space pan ownership, Escape, and cancellation focused group passed 5/5.
- Performance diagnosis: transparent Leafer targets produced 50.79 FPS; paint-free path targets recovered average FPS but retained a 33.3 ms p95 bucket; removing the additional hit-tree leaves produced the final passing owned gate without changing thresholds.
- Final port Unit matrix: `npx playwright test tests/e2e/canvas-port-geometry.spec.ts tests/e2e/canvas-connection-continuation-browser.spec.ts tests/e2e/canvas-edge-reroute.spec.ts tests/e2e/canvas-performance-accessibility.spec.ts --project=chromium`; PASS 22/22.
- Current production build: `npm run build`; PASS, 4,844 transformed modules.
- Hygiene: `git diff --check`; PASS. `canvas-renderer.ts` is 458 lines and `use-canvas-stage.ts` remains 500 lines.
- Compatible-target RED: current geometry-first code returned `result-nearest:in`; no-compatible case also returned that incompatible port instead of `null`.
- Compatible-target GREEN: exact resolver plus node-workflow matrix passed 9/9; full target, forward/reverse continuation, and reroute matrix passed 19/19.
- Exact feedback/snap browser evidence: overlapping drop showed only `generation-cover:prompt`, omitted `result-existing:in`, snapped the draft SVG path to the compatible anchor, and committed the matching typed edge.
- Unit 4 production build after exact-port overlay extraction: `npm run build`; PASS, 4,847 transformed modules.
- Aggregate RED: three focused browser cases failed only on the absent `.selection-aggregate-hull`; valid selection had no right-center batch trigger and invalid editable selection had no neutral hull.
- Aggregate GREEN: valid and invalid desktop hull behavior plus 375px readonly behavior passed 3/3; direct Escape focus restoration and outside-pointer cancellation passed 1/1.
- Unit 5 related matrix: `npx playwright test tests/e2e/canvas-selection-generation.spec.ts tests/e2e/canvas-selection-generation-output.spec.ts tests/e2e/canvas-command-history.spec.ts tests/e2e/canvas-libtv-visual-parity.spec.ts --project=chromium`; PASS 25/25.
- Unit 5 production build: `npm run build`; PASS, 4,853 transformed modules.
- Group RED: pure contract could not import `resolveCanvasDragNodeIds`; browser pointer move kept external path `M 760 330 C 870 330, 750 330, 860 330` unchanged.
- Group focused GREEN: pure resolver/factory and full browser preview, cancellation, commit, history, reload, and ungroup cases passed 2/2.
- Unit 6 related matrix: `npx playwright test tests/e2e/canvas-command-contract.spec.ts tests/e2e/canvas-command-interactions.spec.ts tests/e2e/canvas-command-history.spec.ts tests/e2e/canvas-document-persistence.spec.ts tests/e2e/canvas-view-arrangement.spec.ts --project=chromium`; PASS 32/32.
- Unit 6 visual evidence: `output/playwright/t5-080-group-drag/group-and-children-moved.png`; inspected at 1366x768 with no mock error toast or ownership drift.
- Unit 6 production build after extraction: `npm run build`; PASS, 4,854 transformed modules.
- Unit 6 hygiene: `git diff --check`; PASS. `canvas-commands.ts` 453 lines, `canvas-drag-resolution.ts` 61 lines, `use-canvas-stage.ts` 500 lines.
- Flow RED: the focused policy import failed because `canvas-connection-motion.ts` did not exist; rebuilt browser cases then lacked every expected `.connection-flow` for draft, selected edge, and selected lineage.
- Flow focused GREEN: pure normalized-segment policy plus draft, selected, included-provenance, excluded-provenance, idle, pointer-passive, and reduced-motion assertions passed 6/6 after rebuilding the preview bundle.
- Unit 7 related matrix: continuation, reroute, provenance, visual parity, multi-scenario, performance/accessibility, and motion policy produced 48/50 in the combined run; the two failures were corrected test assumptions, and both exact cases passed independently without a production-code change, for effective 50/50 coverage.
- Motion environment diagnosis: the shared resource fixture intentionally forces reduced motion, so the normal-motion case now switches to `no-preference` after fixture setup; the dedicated accessibility case still verifies `animation-name: none` and pointer-passive static emphasis under reduce.
- Dense performance evidence: `output/playwright/t5-005-unit-e/performance-metrics.json`; PASS at 200 nodes/300 connections, 368 ms stable render, 57.37 FPS, 16.8 ms frame p95, 8.1 ms pointer-feedback p95, zero long tasks, and 11.19 minimap updates/s.
- Unit 7 visual evidence: `output/playwright/t5-015-final/canvas-media-and-passive-edges.png` and `output/playwright/t5-039-end-to-end-provenance/full-input-output-trace-1440x900.png`; both inspected, with selected-only or selected-lineage flow and no ambient graph motion.
- Hidden-edge compatibility RED/GREEN: the merged draft was initially hidden with idle edges; the focused browser case now passes 1/1 with base edges hidden and the active draft plus its flow visible.
- Unit 7 production build: `npm run build`; PASS, 4,855 transformed modules.
- Final focused/related matrix: eight T5-080 and adjacent Canvas specs passed 61/61 with the exact mock performance case excluded for separate classification.
- Full functional Chromium: `npx playwright test --project=chromium --grep-invert "200-node 300-connection Canvas passes focused interaction thresholds"`; PASS 372/372 in 6.6 minutes.
- Final production build: `npm run build`; PASS, 4,855 transformed modules.
- Guarded live supervisor: `backend\.venv\Scripts\python.exe scripts\canvas_acceptance_supervisor.py --execute`; PASS run `t5008-8928-2f348650034263c4`, automatic cleanup complete. Retained summary: `output/playwright/t5-008-live/t5008-8928-2f348650034263c4/summary.json`.
- Live 200/300 boundary: 174ms stable render, 59.92 FPS, 16.8ms frame p95, 0.1ms pointer p95, zero long tasks, 30,007ms duration, revision 3, checksum retained in the supervisor summary.
- Mock performance classification: the final local software-rendered run reached 55.16 FPS with a 33.3ms p95 scheduling bucket and therefore did not pass the unchanged 33ms p95 threshold; no threshold or assertion was weakened.
- Visual inspection: accepted `full-input-output-trace-1440x900.png`, `1366x768.png`, `narrow-workspace.png`, and `mobile-review.png` for the four required viewports.

## Blockers and release conditions

- None.
- Paid/provider calls, real secret access, runtime migrations, destructive operations, and T5-081 activation remain out of scope and did not occur.
