# TASK-T5-080 Progress

- Task state: `DOING`
- Active unit: Unit 6, move normal groups and supported descendants as one graph unit.

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

## Remaining work

- Add and run focused RED evidence for group movement and active-only edge motion.
- Implement Units 6-7 through strict RED-GREEN-REFACTOR cycles.
- Run focused, related, build, visual, full functional Chromium, hygiene, and applicable owned 200/300 verification.
- Perform fresh diff review, write REPORT, close durable state, then scoped commit and push.

## Exact next action

Commit and push the verified neutral aggregate Unit, then freeze the normal-group pointer preview/commit delta mismatch before changing drag resolution.

## Files changed

- `ai/tasks/todo/TASK-T5-080.md`
- `ai/tasks/doing/TASK-T5-080-PLAN.md`
- `ai/tasks/doing/TASK-T5-080-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `frontend/src/modules/canvas/node-layout.ts`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/src/modules/canvas/selection-generation.ts`
- `frontend/src/components/canvas/canvas-authoring-card-presentation.ts`
- `frontend/src/components/canvas/canvas-node-presentation.ts`
- `frontend/src/components/canvas/canvas-geometry.ts`
- `frontend/src/components/canvas/canvas-connection-target.ts`
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
- `frontend/tests/e2e/canvas-port-geometry.spec.ts`

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

## Blockers and release conditions

- None for offline implementation.
- The owned live 200/300 supervisor is conditional on its guarded environment already being available; missing environment must be recorded as a verification gap, never bypassed through `.env` access.
- Paid/provider calls, real secret access, runtime migrations, destructive operations, and T5-081 activation remain out of scope.
