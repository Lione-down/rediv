# REPORT-T6-009 - Incremental Canvas job synchronization

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-23`
- Activation baseline: `1159d120f077d152da01ee6952e9dc2968a6fe8f`
- Task: [TASK-T6-009](../tasks/todo/TASK-T6-009.md).
- Architecture:
  [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Delivered

- Added exact compact v2 submit receipt, status, result, and Canvas delta parsing with scope and payload limits.
- Added project/Canvas-isolated cursors, monotonic per-job versions, persisted node/job restoration, and one successful
  terminal result fetch.
- Integrated compact current-Canvas synchronization into the Canvas runtime with bounded retry, stale-context invalidation,
  terminal/card-removal stop rules, and no server cancellation on Canvas switch.
- Added compact runtime presentations for queued, running, persisting, success, failure, timeout, cancellation requested,
  and cancelled states.
- Preserved one initial history/admin task snapshot and unbound legacy request recovery. A persisted v2 job takes
  presentation priority and suppresses repeated legacy polling for that card.

## TDD Evidence

- Compact submit and reload contracts first failed with the named absent-client and absent-restore fingerprints.
- Focused delta, strict parser, version store, reload sync, and polling-stop tests first failed on absent functions.
- Preview-backed proof first failed because the legacy task presentation overrode the persisted v2 job, then passed after
  compact presentation priority and isolated polling were added.
- A first broad run exposed premature removal of legacy compatibility; the fallback was restored without weakening the v2
  boundary or deferring failures.

## Verification

- Final focused compact/runtime proof: `13/13` PASS.
- Related durable generation and project resource regression: `40/40` PASS.
- Broad Chromium suite excluding nine frozen later-Task RED titles and the independently verified performance title:
  `631/631` PASS in `12.4m`.
- Existing 200-node/300-connection performance assertion varied below threshold under headless SwiftShader, while the exact
  unchanged headed test passed `1/1` in `36.5s`. No threshold or assertion was changed.
- Production build: PASS; Vue type-check and Vite transformed `4,991` modules.
- Frontend production dependency audit: PASS; `0` vulnerabilities.
- Activation project-state validation, `git diff --check`, strict UTF-8/no-BOM, protected-path review, exact staging, and
  staged sensitive-content checks: PASS.
- Closed-state validation reports only the expected no-active transition error until the required post-push T6-010
  activation restores the single-active invariant.

## Boundaries

- No T6-010 card view model, rename command, same-card result command, or later workflow implementation was added.
- No real or paid provider call, secret access, user/runtime migration, destructive operation, external-account action, or
  backend schema/API change occurred.
- User-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` remain excluded from delivery.
- Legacy history/admin loading and unbound request fallback remain intentionally available until T6-016; they are not
  represented as removed.

## Decision

T6-009 is `DONE / PASS`. T6-010 is dependency-ready and may activate only after this delivery is committed and pushed,
in a new goal-mode Codex task with no overlapping active implementation Task.
