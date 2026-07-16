# TASK-T5-081 Progress

- Task state: `DOING`
- Active unit: Unit 3, freeze validated image storyboard group membership, layout, and command contracts through browser RED.

## Completed work

- Read the complete project rules, CURRENT, ROADMAP, direct-delivery ADR, T5-081 candidate plan, design skill references, and TDD contract.
- Verified T5-080 is `DONE - PASS` across Task, PLAN, PROGRESS, REPORT, CURRENT, and ROADMAP.
- Verified `main`, local HEAD, and `origin/main` agree at `408c5f2a6fe940fb4567c8b97b008ff7bd1d2c3b`.
- Confirmed no tracked worktree changes. Four pre-existing untracked `.hermes` plans and untracked `output/` remain outside T5-081 ownership and staging.
- Memory quick pass found no T5-081, Storyboard, or projection entry; repository documents and live code remain authoritative.
- Locked Storyboard as a frontend projection over the existing Canvas document plus validated ordinary group metadata, with no second graph, backend/schema change, or paid execution surface.
- Locked the existing near-black dark-purple media-first visual vocabulary, scoped Vue SCSS, three review lanes, accessible 40px controls, compact handoff, and 375px review-only behavior.
- Reviewed official Milanote, Boords, and Miro Storyboard information architecture for single-board context, ordered/numbered ratio-aware frames, and rearrangeable visual sequence principles.
- Created and activated the T5-081 Task, PLAN, and PROGRESS contract.
- Completed the pure Storyboard projection through strict RED-GREEN-REFACTOR. The first RED failed because `storyboard-projection.ts` did not exist; the second RED proved persisted `queued` was incorrectly folded into `running` when using the node-badge mapping.
- Added focused `storyboard-types.ts` and `storyboard-projection.ts`. The projection classifies canonical and compatibility text/image/video nodes, image/video generation work, canonical results, runtime/persisted phases, available/broken/unavailable media, and excludes audio/unsupported/group entities.
- Valid storyboard metadata owns exact child order and group identity. Membership, version, ratio, columns, numbering, uniqueness, 2-25 count, unlocked canonical image children, and exact current children are all validated; malformed metadata falls back to normal geometry order without repair.
- Projection order is deterministic by storyboard group anchor/order or node y/x/document order, resets order within each lane, deduplicates by iterating graph nodes once, and leaves node/connection inputs unchanged.
- Passed projection 4/4, related registry/presentation/runtime matrix 22/22, and a 4,855-module production build.
- Completed the route-scoped Workflow/Storyboard presentation boundary through strict browser RED-GREEN. The first RED matrix failed only on the absent accessible view tabs, proving the feature was not already reachable.
- Added an accessible 40px Workflow/Storyboard tab switch with ArrowLeft/ArrowRight/Home/End ownership. CanvasStage remains mounted behind `v-show`, switching retains route, document, selection, Context Panel, viewport, history, and revision identity, and closes only resource/comparison/revision/transient Canvas overlays.
- Added text, image, and video review lanes driven only by the pure projection and canonical node presentation/media helpers. Each lane has truthful counts and empty states; items expose stable T/I/V numbering, runtime/media status, focus rings, and wrapping previous/next keyboard navigation.
- Added the explicit `allow-generation-execution` Context Panel boundary. Storyboard retains safe prompt/parameter editing and read-only lineage/comparison inspection, while generation, retry, recipe, branch, continuation, trace arrangement, and provider-input reorder controls are absent.
- Verified zero document/viewport PATCH and zero generation POST for switching and review. The same selected node remains in the desktop Context Panel; 920px uses the existing context drawer; 375px remains review-only.
- Passed Storyboard workflow 4/4, Context Panel/generation related regression 19/19, and a 4,866-module production build.

## Remaining work

- Complete Units 3-4 storyboard group validation, commands, layout, order, history, persistence, conversion, and ungroup.
- Complete Unit 5 focused/related/full regression, build, visual, accessibility, hygiene, guarded live 200/300, REPORT, durable closure, commit, and push.

## Exact next action

Audit group registry resolution, T5-080 group movement, command executor/history, ordinary group/ungroup behavior, selection toolbar controls, node layout, serializer, and duplication fixtures; then write and run the first failing 2-25 image storyboard group browser contract before production edits.

## Files changed

- `ai/tasks/todo/TASK-T5-081.md`
- `ai/tasks/doing/TASK-T5-081-PLAN.md`
- `ai/tasks/doing/TASK-T5-081-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `frontend/src/modules/canvas/storyboard-types.ts`
- `frontend/src/modules/canvas/storyboard-projection.ts`
- `frontend/tests/e2e/canvas-storyboard-projection.spec.ts`
- `frontend/src/components/canvas/CanvasContextPanel.vue`
- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/canvas/CanvasStoryboardItem.vue`
- `frontend/src/components/canvas/CanvasStoryboardLane.vue`
- `frontend/src/components/canvas/CanvasStoryboardView.vue`
- `frontend/src/components/canvas/CanvasViewModeSwitch.vue`
- `frontend/src/components/canvas/canvas-storyboard.scss`
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/src/views/app/CanvasWorkspace.vue`
- `frontend/src/views/app/canvas-workspace.scss`
- `frontend/tests/e2e/canvas-storyboard-workflow.spec.ts`

## Commands and evidence

- Required preflight: `git status --short`, `git diff --stat`, `git diff --name-only`, `git rev-parse HEAD`, branch, and `origin/main`; result was zero tracked diff, baseline `408c5f2`, and only the preserved untracked plans/output.
- Memory search: no relevant `T5-081`, `storyboard`, or `projection` entry.
- Dependency audit: T5-080 durable state and pushed Git baseline agree on `DONE - PASS`.
- Candidate-plan audit: all 373 lines read; no multi-agent delegation, second graph, backend/schema/provider, paid, secret, destructive, or mobile-editing scope is permitted.
- Projection RED 1: focused runner failed on the missing `storyboard-projection` module, proving production behavior was absent.
- Projection GREEN 1: classification, valid group order, malformed fallback, stable sorting, and purity reached 3/3; legacy media needed explicit media-state treatment rather than generation-capability inference.
- Projection RED 2: persisted `queued` produced `running`; Storyboard now maps exact persisted/runtime phases while leaving the global node badge contract unchanged.
- Projection final: `npx playwright test tests/e2e/canvas-storyboard-projection.spec.ts --project=chromium`; PASS 4/4.
- Unit 1 related matrix: projection, registry, node presentation, and generation runtime feedback; PASS 22/22.
- Unit 1 production build: `npm run build`; PASS, 4,855 transformed modules.
- View boundary RED: `canvas-storyboard-workflow.spec.ts`; FAIL 3/3 on the absent `工作流`/`故事板` tabs, with the existing Workspace otherwise healthy.
- Storyboard workflow final: `npx playwright test tests/e2e/canvas-storyboard-workflow.spec.ts --project=chromium`; PASS 4/4 across 1440, 920, and 375.
- Unit 2 related matrix: Storyboard workflow, generation preflight/input order, visual asset recipes, and composer zoom; PASS 19/19.
- Unit 2 production build: `npm run build`; PASS, 4,866 transformed modules.

## Blockers and release conditions

- None for activation or offline implementation.
- Guarded live verification remains conditional on environment already supplied to the process; it must never be recovered by reading `.env`.
- Paid/provider calls, real secret access, runtime migrations, destructive operations, and incompatible product/UX changes remain Human Owner gates.
