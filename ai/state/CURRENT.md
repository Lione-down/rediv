# Revid Current Project State

Last updated: 2026-07-23

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-004 and T6-006 through T6-010: `DONE / PASS`.
- T6-005: `BLOCKED / FAIL` after explicit Human visual/interaction rejection on 2026-07-23.
- T6-010: canonical card view model, geometry authority, and rename-command delivery is complete.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: none; T6-010 is closed and the post-push T6-011 activation must occur in a new goal-mode task.
- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-010](../tasks/todo/TASK-T6-010.md).
- Plan: [TASK-T6-010-PLAN](../tasks/doing/TASK-T6-010-PLAN.md).
- Progress: [TASK-T6-010-PROGRESS](../tasks/doing/TASK-T6-010-PROGRESS.md).
- Report: [REPORT-T6-010](../reports/REPORT-T6-010.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Live Gates

- T6-005 remains rejected audit/reference evidence and creates no reuse presumption.
- The approved Phase 6 direction remains the contract-first modular-monolith strangler with the existing stack, database,
  Canvas engine, and provider authority boundaries.
- T6-007 froze the replacement contracts; T6-008 delivered compact v2 APIs and durable MySQL execution.
- T6-010 delivered one typed card presentation model, one visible geometry authority, and one undoable/autosaved rename command.
- Stable node IDs, graph/job/asset/reference bindings, legacy result persistence, and current compact v2 job sync remain intact.
- T6-011 through T6-016 behavior, new same-card result application, and legacy compatibility removal are out of scope.
- Tests may use disposable MySQL and fake providers only; user/runtime migrations and real/paid provider calls remain prohibited.
- Automated browser evidence remains separate from explicit Human visual/interaction acceptance.

## Exact Next Action

After T6-010 is committed and pushed, create a new `/goal` Codex task that activates only T6-011 and restores the
single-active invariant before business-code edits.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/`.
- Preserve the rejected T6-005 snapshot as committed audit/reference evidence; do not reuse it implicitly.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Human approval of the T6-006 architecture and T6-007 characterization was obtained on 2026-07-23.
- Revid retains the approved technology stack, MySQL-only runtime, multi-canvas scope, graph/history/persistence/provider contracts, accessibility, and review-only mobile unless a new ADR explicitly changes them.
- Real/paid provider calls, secrets, destructive operations, irreversible migrations, external accounts, framework/runtime replacements, and incompatible contracts remain Human gates.
