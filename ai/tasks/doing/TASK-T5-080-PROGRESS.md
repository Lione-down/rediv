# TASK-T5-080 Progress

- Task state: `DOING`
- Active unit: Unit 3, separate port visuals from real screen-stable hit targets.

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

## Remaining work

- Add and run the focused RED interaction evidence for port acquisition, button ownership, compatible landing, neutral aggregate selection, batch continuation, group movement, and active-only edge motion.
- Implement Units 3-7 through strict RED-GREEN-REFACTOR cycles.
- Run focused, related, build, visual, full functional Chromium, hygiene, and applicable owned 200/300 verification.
- Perform fresh diff review, write REPORT, close durable state, then scoped commit and push.

## Exact next action

Commit and push the verified canonical geometry Unit, then add the six-zoom pure hit-size and outside-dot browser RED cases for Unit 3 before changing renderer port behavior.

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
- `frontend/src/components/canvas/composables/use-canvas-stage.ts`
- `frontend/tests/e2e/canvas-command-contract.spec.ts`
- `frontend/tests/e2e/canvas-selection-generation.spec.ts`
- `frontend/tests/e2e/canvas-libtv-visual-parity.spec.ts`

## Commands and evidence

- Memory quick pass: no T5-080 or directly applicable prior-run entry was present in `MEMORY.md`; repository truth sources were used.
- Git preflight: `git status --short`, `git diff --stat`, `git diff --name-only`, and `git rev-parse HEAD`; result was no tracked diff, four pre-existing untracked `.hermes` plans, untracked `output/`, and HEAD `048a2f2`.
- Source audit: `rg` confirmed current geometry, target selection, selection-generation, group, and motion ownership at the paths named in PLAN.
- File-size audit: the two existing orchestration surfaces named above are already at/over the preferred boundary; extraction is mandatory for substantial new logic.
- Geometry RED: focused group command failed with received `568×308` versus canonical `468×348`; focused selection placement failed with received `(716, 100)` versus canonical `(616, 120)`.
- Browser geometry RED: portrait lower-surface context menu did not expose node actions; minimap centering missed canonical visible center by 70px.
- Geometry GREEN: focused 10/10 passed after shared resolver integration; complete related command contract, node presentation, selection generation, and LibTV visual parity matrix passed 34/34.
- Production build: `vue-tsc -b && vite build` passed with 4,842 transformed modules.

## Blockers and release conditions

- None for offline implementation.
- The owned live 200/300 supervisor is conditional on its guarded environment already being available; missing environment must be recorded as a verification gap, never bypassed through `.env` access.
- Paid/provider calls, real secret access, runtime migrations, destructive operations, and T5-081 activation remain out of scope.
