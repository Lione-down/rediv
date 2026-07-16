# TASK-T5-081 Progress

- Task state: `BLOCKED`
- Active unit: Unit 5 frontend, visual, full-regression, live, and hygiene verification is complete; Canvas duplication metadata remapping is blocked by the plan's backend-behavior stop rule.

## Completed work

- Read the complete project rules, CURRENT, ROADMAP, direct-delivery ADR, T5-081 candidate plan, design skill references, and TDD contract.
- Verified T5-080 is `DONE - PASS` across Task, PLAN, PROGRESS, REPORT, CURRENT, and ROADMAP.
- Verified `main`, local HEAD, and `origin/main` agree at `408c5f2a6fe940fb4567c8b97b008ff7bd1d2c3b`.
- Confirmed no tracked worktree changes. Four pre-existing untracked `.hermes` plans and untracked `output/` remain outside T5-081 ownership and staging.
- Memory quick pass found no T5-081, Storyboard, or projection entry; repository documents and live code remain authoritative.
- Locked Storyboard as a frontend projection over the existing Canvas document plus validated ordinary group metadata, with no second graph, backend/schema change, or paid execution surface.
- Locked the existing near-black dark-purple media-first visual vocabulary, Storyboard-prefixed BEM SCSS, three review lanes, accessible 40px controls, compact handoff, and 375px review-only behavior.
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
- Completed strict 2-25 image-only storyboard group validation, exact metadata parsing, deterministic ratio-aware grid layout, typed create/settings/reorder/convert commands, and canonical `group/storyboard` registry support.
- Workflow exposes `创建分镜组` only for an exact valid selection. Existing selection toolbar ownership now provides ratio, 1-5 columns, numbering, conversion, and child order controls; Storyboard items expose accessible earlier/later controls while 375px remains mutation-free.
- Create, settings, order, conversion, and ungroup each use existing command history/autosave. Browser evidence proves one document PATCH per command, exact undo/redo and reload, numbering visibility, unchanged edge/provider-order metadata, child-position stability on convert/ungroup, and parent-first equal-delta whole-group movement.
- Refactored shared validation into `storyboard-group.ts`, typed command creation into `storyboard-commands.ts`, and Stage coordination into a focused composable to keep command ownership bounded.
- Passed focused Storyboard group/projection 9/9, related command/history/persistence/registry/presentation plus Storyboard matrix 50/50, and a 4,872-module production build.
- Audited Canvas duplication and found an acceptance-blocking contract gap: `backend/controllers/canvases.py::duplicate_canvas()` remaps node parent IDs and edge endpoints but only deep-copies node content. A storyboard group's `ordered_child_ids` therefore retains source-Canvas child IDs and becomes invalid after duplication.
- Added a durable six-scenario visual acceptance spec covering empty, mixed pending/failure/unavailable, two-image, 25-image, invalid-selection, compact drawer, and 375px review-only states across exact 1440x900, 1366x768, 920x900, and 375x812 viewports. Every viewport has zero page-level horizontal overflow and retained PNG plus geometry evidence under ignored `output/`.
- Visual inspection found a real Storyboard styling regression: the parent `scoped` stylesheet could style child component roots but not lane/item descendants, leaving browser-default controls. A computed-style RED proved the lane header was `display: block`; the minimal fix gives the dedicated Storyboard BEM stylesheet descendant ownership and removes now-invalid `:deep()` selectors.
- Rebuilt and visually re-inspected all six screenshots after the fix. Cards, lane headers, media containment, statuses, order controls, empty states, compact drawer, and mobile review-only layout are correctly styled.
- Storyboard-specific WCAG 2 A/AA axe analysis has zero serious or critical violations. The visual matrix remains reduced-motion and zero-execution guarded.
- Full functional Chromium passed 392/392. The final production build passed with 4,872 transformed modules and no Lightning CSS warnings.
- The guarded owned live supervisor passed pre/post-restart 200-node/300-connection persistence with checksum `d63025b9136424e2eb611a1c262275a2156fe7d5b1f1c13751b545b40d87aa45`, stable render 170 ms, 59.97 FPS, 16.7 ms frame p95, 0.1 ms pointer p95, and zero long tasks. Retained summary: `output/playwright/t5-008-live/t5008-32448-9fd13d416980ba39/summary.json`.
- Deep release-readiness review found no additional frontend correctness, security, performance, accessibility, or request-boundary defects. Diff/UTF-8/sensitive-path/staged-secret checks pass; no new source file exceeds 500 lines, and the touched oversized Vue coordinators were already over the guideline at the T5-080 baseline.

## Remaining work

- Obtain Human Owner authorization for one minimal existing-backend duplication remap so storyboard `ordered_child_ids` can follow `node_id_map`; add a focused RED and preserve all unrelated content keys.
- After that remap, run focused backend duplication tests plus the duplication browser case, then write REPORT, close durable state, commit, and push.

## Exact next action

After Human Owner authorization, write a focused backend duplication RED proving exact storyboard child-ID remapping while ordinary group content and project asset references remain unchanged; then implement the smallest controller-local remap and finish duplication-specific closure.

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
- `frontend/src/components/canvas/CanvasSelectionToolbar.vue`
- `frontend/src/components/canvas/CanvasStoryboardNumberLayer.vue`
- `frontend/src/components/canvas/composables/use-canvas-storyboard-groups.ts`
- `frontend/src/modules/canvas/canvas-command-executor.ts`
- `frontend/src/modules/canvas/canvas-commands.ts`
- `frontend/src/modules/canvas/mutations.ts`
- `frontend/src/modules/canvas/node-registry.ts`
- `frontend/src/modules/canvas/storyboard-commands.ts`
- `frontend/src/modules/canvas/storyboard-group.ts`
- `frontend/tests/e2e/canvas-storyboard-group-workflow.spec.ts`
- `frontend/tests/e2e/canvas-storyboard-group.spec.ts`
- `frontend/tests/e2e/canvas-storyboard-visual.spec.ts`

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
- Storyboard group RED 1: focused runner failed on the absent `storyboard-group` module, proving validation/layout/commands were missing.
- Storyboard group RED 2: browser workflow failed on the absent `创建分镜组` action; numbering RED separately failed on zero `.storyboard-frame-number` elements.
- Storyboard group final: pure group, browser workflow, and projection; PASS 9/9.
- Units 3-4 related matrix: command contract/history/interactions, document persistence, registry, presentation, projection, view boundary, and group workflow; PASS 50/50.
- Units 3-4 production build: `npm run build`; PASS, 4,872 transformed modules.
- Duplication audit: `backend/controllers/canvases.py::duplicate_canvas()` builds `node_id_map`, remaps `parent_node_id` and connection endpoints, but assigns `content=deepcopy(source_node.content)` without remapping `ordered_child_ids`.
- Visual styling RED: `npx playwright test tests/e2e/canvas-storyboard-visual.spec.ts --project=chromium --grep "mixed pending"`; FAIL because `.storyboard-lane__header` computed to `display: block` instead of `flex`.
- Visual styling GREEN: rebuilt the production bundle after moving Storyboard BEM descendant ownership out of the parent Vue scope; the same computed-style gate passed.
- Final visual/accessibility matrix: `npx playwright test tests/e2e/canvas-storyboard-visual.spec.ts --project=chromium`; PASS 6/6 with exact viewport screenshots, geometry JSON, zero page-level overflow, and zero serious/critical axe violations.
- Full functional regression: `npx playwright test --project=chromium`; PASS 392/392 in 7.3 minutes.
- Final production build: `npm run build`; PASS, 4,872 transformed modules, no CSS minifier warning.
- Guarded live preflight: `backend/.venv/Scripts/python.exe scripts/canvas_acceptance_supervisor.py`; PASS with owned `revid_test_*` schema and free 8765/9765 ports.
- Guarded live lifecycle: the same supervisor with `--execute`; PASS in 57.3 seconds with 200/300 restart persistence and retained summary `output/playwright/t5-008-live/t5008-32448-9fd13d416980ba39/summary.json`.
- Deep review and hygiene: scoped/task-range `git diff --check`, UTF-8 replacement-character scan, file growth, Storyboard selector ownership, request guards, reduced motion, sensitive tracking, staged secret, owned ports, and exact worktree scope all passed.

## Blockers and release conditions

- Acceptance criterion 7 is blocked. Exact Canvas duplication requires remapping storyboard `ordered_child_ids` through the backend's private `node_id_map`; frontend repair cannot know the mapping and inferred repair is explicitly forbidden.
- Release condition: Human Owner authorizes a minimal existing duplicate-controller behavior change, limited to validated `group/storyboard` version-1 content and covered by focused backend tests. No endpoint, schema, migration, secret, provider, or destructive operation is required.
- Guarded live verification passed using environment already supplied to the process; no `.env` was opened or recovered.
- Paid/provider calls, real secret access, runtime migrations, destructive operations, and incompatible product/UX changes remain Human Owner gates.
