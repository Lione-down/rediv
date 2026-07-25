# Revid Current Project State

Last updated: 2026-07-25

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-004 and T6-006 through T6-011: `DONE / PASS`.
- T6-005: `BLOCKED / FAIL` after explicit Human visual/interaction rejection on 2026-07-23.
- T6-011: `DONE / PASS` by Human `ACCEPT_WITH_DECLARED_BOUNDARIES` on 2026-07-25.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: none; T6-011 is closed and the next dependency-ready Task must activate in the requested new Codex session.
- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-011](../tasks/todo/TASK-T6-011.md).
- Plan: [TASK-T6-011-PLAN](../tasks/doing/TASK-T6-011-PLAN.md).
- Progress: [TASK-T6-011-PROGRESS](../tasks/doing/TASK-T6-011-PROGRESS.md).
- Report: [REPORT-T6-011](../reports/REPORT-T6-011.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Live Gates

- T6-005 and the earlier rejected T6-011 delivery remain audit/reference evidence and create no reuse presumption.
- T6-011 replaced the visible Canvas shell/card runtime while retaining Leafer world/camera authority, MySQL, stable IDs, graph/history/autosave, durable jobs, provider/quota admission, and legacy readability.
- Human accepted the overall result; unspecified minor issues are deferred to a future independently planned Task and are not silently included in T6-012.
- Final R8N evidence is browser `62/62`, backend compact/job-runner `18/18`, build `5,034`, state/diff/sensitive-path audit PASS, and local `5173/8000` HTTP `200`.
- Normal persisted-card polling uses exact compact bound-job status/result routes and makes zero current-Canvas delta-list calls.
- Director is absent; Video Composition and capability-gated Audio Generation remain retained product boundaries.
- Tests used mock/local fixtures and disposable data only; no real/paid provider call or secret/environment-file access occurred.
- Automated evidence remains distinct from the Human acceptance decision.

## Exact Next Action

Commit and push the exact accepted T6-011 delivery, verify `HEAD == origin/main`, then create a new Codex session that defines and activates only the next dependency-ready Task before business-code edits.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/`.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Revid retains the approved technology stack, MySQL-only runtime, multi-canvas scope, graph/history/persistence/provider contracts, accessibility, and review-only mobile unless a new ADR explicitly changes them.
- Real/paid provider calls, secrets, destructive operations, irreversible migrations, external accounts, framework/runtime replacements, and incompatible contracts remain Human gates.
