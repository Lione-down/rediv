# TASK-T6-009 - Replace project-wide polling with incremental Canvas job sync

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 contract-first reset`
- Objective: replace frontend project-wide generation-task polling with compact current-Canvas v2 job delta synchronization and refresh-safe runtime restoration.
- Dependency: `T6-008 - DONE / PASS` at activation baseline `HEAD == origin/main == 1159d120f077d152da01ee6952e9dc2968a6fe8f`.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-009-PLAN](../doing/TASK-T6-009-PLAN.md).
- Progress: [TASK-T6-009-PROGRESS](../doing/TASK-T6-009-PROGRESS.md).

## Scope

- Add strict frontend parsing and typed API access for compact v2 job submit receipts, status, result, and project/Canvas cursor deltas.
- Add current-Canvas job state keyed by stable job ID and monotonic version, with cursor ownership isolated per project/Canvas.
- Replace persisted v2 job polling with bounded current-Canvas delta synchronization.
- Restore active jobs from persisted node job IDs after reload, fetch canonical results only after successful terminal status, and stop polling when the current Canvas has no non-terminal jobs.
- Preserve the project resource history/admin task list and unbound legacy request fallback until T6-016.
- Prove request count, response shape/bytes, refresh, Canvas-switch, and cursor catch-up behavior in preview-backed Playwright.

## Non-goals and locked boundaries

- No T6-010 canonical card view model, geometry authority, or rename command.
- No T6-011 text workflow, T6-012/T6-013 director/script workflow, T6-014 same-card image lifecycle, T6-015 semantic video, or T6-016 compatibility removal.
- Do not remove the legacy history/admin task API or hidden result compatibility projection.
- No backend schema/API/migration changes unless a frozen T6-009 frontend contract proves a versioned compatibility defect and scope is first reconciled in PLAN/PROGRESS.
- No real or paid provider call, secret access, user/runtime-data migration, destructive operation, or external-account change.
- Do not mutate user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, or `test-results/`.

## Acceptance criteria

1. Persisted v2 jobs synchronize only through compact `/api/v2` routes and do not trigger repeated full-task reads.
2. Delta reads are scoped by current project and Canvas, advance a cursor monotonically, and ignore stale/out-of-order job versions.
3. The runtime polls only while the current Canvas has a non-terminal job; terminal-only and empty Canvas state do not maintain a timer.
4. Reload restores persisted active job IDs, resumes the same durable job, and fetches the result once after terminal success.
5. Switching Canvas stops the old Canvas polling context without cancelling its server-owned job; returning catches up through the correct Canvas cursor.
6. Poll failures retain last known compact state, use bounded retry/backoff, and do not mutate Canvas graph/history/selection/camera.
7. Legacy project history/admin and unbound request fallback remain available, but cannot override or repeatedly poll a
   persisted v2 job presentation.
8. Focused TDD evidence passes before related and broad frontend regression; frontend is rebuilt before preview/browser proof.
9. Project-state, diff, UTF-8, protected-path, sensitive-path, exact-staging, commit, and push checks pass.

## Completion

- Added strict compact v2 submit/status/result/delta parsing and scope validation.
- Added project/Canvas-isolated cursor state with monotonic per-job versions and one terminal-result fetch.
- Restored persisted node job IDs after reload and stopped timers for terminal or removed-card state.
- Proved Canvas switch invalidation, return catch-up, zero server cancellation, bounded payloads, and zero Canvas document
  mutation in preview-backed Playwright.
- Preserved one initial history/admin snapshot and unbound legacy request polling until T6-016; persisted v2 jobs take
  presentation and polling priority.
- Report: [REPORT-T6-009](../../reports/REPORT-T6-009.md).
