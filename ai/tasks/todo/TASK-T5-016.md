# TASK-T5-016 - Validate and refine multi-scenario Canvas workflows

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-015 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Continuously refine Canvas and node presentation against a deterministic scenario matrix that covers mixed image/video media, converging and branching graphs, lifecycle states, broken content, dense topology, localization, and supported viewports.

## Scope

- Build one reusable browser fixture with recognizable local image and video media and several graph topologies.
- Verify multiple upstream text/media nodes converging into one generation node and one generation node branching into multiple results.
- Verify landscape, square, portrait, playable video, loading, broken, unavailable, running, success, and failure states.
- Verify long Chinese, long English, empty content, selected, editing, locked, and read-only node presentation.
- Improve node hierarchy, port/edge legibility, overlap avoidance, result grouping, and contextual overlay placement where scenario evidence exposes defects.
- Capture supported viewport and dense-graph evidence, then retain performance and persistence regression.

## Non-goals and human gates

- No paid provider generation, real secret access, destructive data operation, database migration, Canvas engine replacement, timeline editor, or export pipeline.
- Generated or synthetic media is deterministic local test evidence only.
- No direct source copying from LibTV or AIGCCanvasFlow.

## Acceptance criteria

- The scenario fixture contains at least three image ratios, one playable video, one unavailable media node, one converging graph with at least four upstream nodes, and one branching graph with at least three results.
- Every persisted connection terminates at the correct typed port and remains visually traceable without overpowering media.
- Converging and branching graphs have no node overlap after fit, no label/media collision, and no contextual toolbar/composer collision at 1440x900, 1366x768, or 920x900.
- Running, success, failed, unavailable, locked, selected, and editing states are visually distinct without large state fills.
- Long Chinese and English content remains readable or intentionally clipped without ellipsis in metric/label footers.
- 375x812 remains review-only with no edit, delete, generation, or composer control.
- Focused scenario tests, existing Canvas regression, full Chromium, frontend build, four viewport screenshots, guarded live 200/300 performance, UTF-8, file-size, diff, and secret-hygiene gates pass.
- Task, PLAN, PROGRESS, REPORT, CURRENT, ROADMAP, code, tests, and evidence agree before `DONE - PASS`.

## Active unit

Complete. See `ai/reports/REPORT-T5-016.md`.
