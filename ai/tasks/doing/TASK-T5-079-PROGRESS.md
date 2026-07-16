# TASK-T5-079 Progress

- Task state: `DONE - PASS`
- Active unit: complete; no implementation remains.

## Completed work

- Confirmed the repository started from committed and pushed T5-078 baseline `21c4cf9` with no tracked worktree changes.
- Reproduced the defect in the deterministic mixed image/video browser scenario and retained the visible evidence under `output/playwright/t5-017-connected-context/mixed-topology-1440x900.png`.
- Traced the root cause to the cross-component scoped selector in `CanvasVideoKeyframeRail.vue`: compiled CSS targets the shared `.canvas-node-media.is-keyframes-above` root and moves it upward by its own height plus 8px.
- Confirmed `CanvasNodeMedia.vue` applies that placement class to images as well as videos, explaining every reported media-outside-frame symptom.
- Added a rendered DOM containment assertion and observed the required RED failure with four escaped images at `-141px`/`-244px` vertical offsets.
- Removed the placement class from the shared media root and moved above/below ownership to a typed `CanvasVideoKeyframeRail` prop plus rail-local class.
- Diagnosed the first unchanged post-fix result as stale preview evidence: Playwright serves `dist`, whose old CSS still contained the leaking selector. Rebuilt the bundle, confirmed the compiled selector became rail-local, and then observed GREEN.
- Passed the focused 1/1 regression, related 23/23 Chromium matrix, 4,841-module production build, two retained visual inspections, selector blast check, and hygiene gates.

## Remaining work

- None for T5-079.

## Exact next action

Commit and push the verified T5-079 scope, then keep `CURRENT.md` at `IDLE` until the Human Owner selects another bounded Task.

## Files changed

- `ai/tasks/todo/TASK-T5-079.md`
- `ai/tasks/doing/TASK-T5-079-PLAN.md`
- `ai/tasks/doing/TASK-T5-079-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/reports/REPORT-T5-079.md`
- `frontend/src/components/canvas/CanvasNodeMedia.vue`
- `frontend/src/components/canvas/CanvasVideoKeyframeRail.vue`
- `frontend/tests/e2e/canvas-multi-scenario-visual.spec.ts`
- `pitfalls.md`

## Commands and evidence

- Preflight: `git status --short`, `git diff --stat`, `git diff --name-only`, and `git rev-parse HEAD` completed; only pre-existing untracked `.hermes` plans and `output/` were present.
- Baseline synchronization: local `HEAD` and `origin/main` both resolve to `21c4cf93c706a0ec8bd443a7a04d2e429221e593`.
- Prior focused browser reproduction: 1/1 test passed functionally while the retained screenshot and DOM geometry showed the visual containment defect, proving the existing assertions were insufficient.
- RED containment regression: 1/1 expected failure; four decoded image roots escaped their surfaces at vertical offsets `-141px`/`-244px`.
- GREEN containment regression after rebuilding the real preview bundle: 1/1 PASS.
- Related mixed-media/video Chromium regression: 23/23 PASS.
- Default production build: 4,841 modules transformed.
- Visual evidence: `output/playwright/t5-017-connected-context/mixed-topology-1440x900.png` and `output/playwright/t5-062-video-keyframes/selected-keyframe-rail-1440x900.png` inspected and accepted.
- Blast/hygiene: old leaking selector 0 matches; strict UTF-8, diff, file-size, sensitive-path, and worktree audits passed; dev server on port 5173 returned HTTP 200.

## Blockers and release conditions

- None.
