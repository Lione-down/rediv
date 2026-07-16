# TASK-T5-080 Progress

- Task state: `DOING`
- Active unit: Unit 4, rank exact compatible connection targets before empty-space continuation.

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

## Remaining work

- Add and run focused RED evidence for compatible landing, neutral aggregate selection, batch continuation, group movement, and active-only edge motion.
- Implement Units 4-7 through strict RED-GREEN-REFACTOR cycles.
- Run focused, related, build, visual, full functional Chromium, hygiene, and applicable owned 200/300 verification.
- Perform fresh diff review, write REPORT, close durable state, then scoped commit and push.

## Exact next action

Commit and push the verified port-target Unit, then freeze a nearest-incompatible versus slightly-farther-compatible RED case before changing connection-target ranking.

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
- `frontend/src/components/canvas/canvas-port-interaction.ts`
- `frontend/src/components/canvas/canvas-port-presentation.ts`
- `frontend/src/components/canvas/canvas-renderer.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/tests/e2e/canvas-command-contract.spec.ts`
- `frontend/tests/e2e/canvas-selection-generation.spec.ts`
- `frontend/tests/e2e/canvas-libtv-visual-parity.spec.ts`
- `frontend/tests/e2e/canvas-connection-continuation-browser.spec.ts`
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

## Blockers and release conditions

- None for offline implementation.
- The owned live 200/300 supervisor is conditional on its guarded environment already being available; missing environment must be recorded as a verification gap, never bypassed through `.env` access.
- Paid/provider calls, real secret access, runtime migrations, destructive operations, and T5-081 activation remain out of scope.
