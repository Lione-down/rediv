# REPORT-T6-010 - Canonical card model, geometry, and rename

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-23`
- Activation baseline: `dc9696fa7a568a38f0ab8980f3b20ea78c72800a`
- Task: [TASK-T6-010](../tasks/todo/TASK-T6-010.md).
- Architecture:
  [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Delivered

- Added one canonical card view model for stable identity, title/body editability, lifecycle, media, ports, attached work
  surface, and legacy result/asset compatibility state.
- Added one card geometry authority for visible/title/selection/composer rectangles, intrinsic media aspect, port anchors,
  hit targets, edge endpoints, minimap projection, and stage-space attached-surface placement.
- Added `rename-node` through the typed command executor and history/autosave boundary. Empty, unchanged, unsupported, and
  locked targets fail closed; duplicate display titles remain legal and stable-ID bindings are unchanged.
- Added an external upper-left title editor with commit/cancel/focus behavior and pointer/double-click arbitration. All
  supported visible card families share the same command path.
- Replaced window-relative workbench clamping with actual stage size and viewport insets, including correct screen/local
  conversion for zoomed composer containers.
- Preserved legacy result projection/readability and stopped before T6-011 or any same-card result/compatibility-removal
  behavior owned by later Tasks.

## TDD Evidence

- Frozen rename contracts first failed with `node-rename-command-absent` and `node-rename-executor-absent`.
- Canonical view-model and geometry tests first failed with `canonical-card-view-model-absent`,
  `canonical-card-geometry-absent`, and `stage-bounded-attached-surface-absent`.
- Preview proof first failed because no external title editor existed; stage proof then measured a real `34px` right-edge
  overflow against the narrowed stage.
- Edge-case RED covered persisted/legacy result mapping, duplicate-title reference disambiguation, locked rename, and
  authoring/media label placement before GREEN.
- Related regression exposed and corrected subtype/type-label drift plus zoomed composer screen/local placement without
  weakening historical assertions.

## Verification

- Final focused view-model/rename/geometry/browser proof: `12/12` PASS.
- Related presentation, history, autosave, persistence, work-surface, port/edge, materialized-compatibility, and visual
  convergence regression: `73/73` PASS.
- Broad Chromium suite excluding seven frozen T6-011 through T6-016 RED titles and the independently verified performance
  title: `641/641` PASS in `11.4m`.
- Existing 200-node/300-connection performance assertion varied below threshold under headless SwiftShader with hardware
  acceleration unavailable; the exact unchanged headed test passed `1/1` in `34.5s`. No threshold was changed.
- Production build: PASS; Vue type-check and Vite transformed `4,996` modules.
- Frontend production dependency audit: PASS; `0` vulnerabilities.
- Activation and pre-close project-state validation, `git diff --check`, and protected-path review: PASS.
- Automated browser geometry and interaction evidence passed. Human visual/interaction acceptance was not performed and is
  not claimed as automated evidence.

## Boundaries

- No T6-011 text workflow, T6-012/T6-013 director/script workflow, T6-014 image lifecycle, T6-015 semantic video, or
  T6-016 compatibility removal was implemented.
- No backend API/schema, provider contract, real or paid provider call, secret access, user/runtime migration, destructive
  operation, or external-account action occurred.
- User-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` remain excluded from delivery.
- Legacy result nodes and projection remain readable compatibility state; they are not represented as removed.

## Decision

T6-010 is `DONE / PASS`. T6-011 is dependency-ready and may activate only after this delivery is committed and pushed,
in a new goal-mode Codex task with no overlapping active implementation Task.
