# Revid Current Project State

Last updated: 2026-07-23

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-004 and T6-006 through T6-009: `DONE / PASS`.
- T6-005: `BLOCKED / FAIL` after explicit Human visual/interaction rejection on 2026-07-23.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: none during the post-verification delivery transition.
- State: `DONE`
- Verification outcome: `PASS`
- Completed Task: [TASK-T6-009](../tasks/todo/TASK-T6-009.md).
- Plan: [TASK-T6-009-PLAN](../tasks/doing/TASK-T6-009-PLAN.md).
- Progress: [TASK-T6-009-PROGRESS](../tasks/doing/TASK-T6-009-PROGRESS.md).
- Report: [REPORT-T6-009](../reports/REPORT-T6-009.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Live Gates

- T6-005 remains rejected audit/reference evidence and creates no reuse presumption.
- The approved Phase 6 direction remains the contract-first modular-monolith strangler with the existing stack, database,
  Canvas engine, and provider authority boundaries.
- T6-007 froze the replacement contracts; T6-008 delivered compact v2 APIs and durable MySQL execution.
- T6-009 delivers strict compact v2 parsing, scoped job/version/cursor state, refresh restoration, terminal result fetch,
  Canvas-switch catch-up, and bounded active polling.
- Persisted v2 jobs do not repeat project-wide task reads. One initial history/admin snapshot and unbound legacy request
  fallback remain until T6-016.
- T6-009 focused `13/13`, related `40/40`, broad `631/631`, headed performance `1/1`, and build `4,991` pass.
- T6-010 card identity/rename is dependency-ready but must activate only in a new post-push goal-mode task.
- Tests may use disposable MySQL and fake providers only; user/runtime migrations and real/paid provider calls remain prohibited.
- Closed-state validation has one expected no-active transition error until post-push T6-010 activation.

## Exact Next Action

Precisely stage, commit, and push T6-009, then create a new goal-mode Codex task that activates T6-010 only.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/`.
- Preserve the rejected T6-005 snapshot as committed audit/reference evidence; do not reuse it implicitly.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Human approval of the T6-006 architecture and T6-007 characterization was obtained on 2026-07-23.
- Revid retains the approved technology stack, MySQL-only runtime, multi-canvas scope, graph/history/persistence/provider contracts, accessibility, and review-only mobile unless a new ADR explicitly changes them.
- Real/paid provider calls, secrets, destructive operations, irreversible migrations, external accounts, framework/runtime replacements, and incompatible contracts remain Human gates.
