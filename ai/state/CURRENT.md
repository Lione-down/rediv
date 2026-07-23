# Revid Current Project State

Last updated: 2026-07-23

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-004: `DONE / PASS`.
- T6-005: `BLOCKED / FAIL` after explicit Human visual/interaction rejection on 2026-07-23.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: `T6-006 - Full-stack modular refactor architecture and execution baseline`.
- State: `DOING`
- Verification outcome: `PENDING`
- Task: [TASK-T6-006](../tasks/todo/TASK-T6-006.md).
- Plan: [TASK-T6-006-PLAN](../tasks/doing/TASK-T6-006-PLAN.md).
- Progress: [TASK-T6-006-PROGRESS](../tasks/doing/TASK-T6-006-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Live Gates

- T6-005 machine proof remains historical implementation evidence only: build `4,988`, frontend `622/622`, backend `583/583`, performance `2/2`, and audit `0`; Human acceptance failed.
- T6-005's visual design, interaction logic, business flow, and information architecture are all rejected. Its implementation is committed only as audit/reference evidence and creates no reuse presumption.
- Live inventory: frontend source `270 files / 47,908 lines`, frontend tests `140 / 27,928`, backend source/tests `247 / 41,584`.
- Primary concentration: `backend/controllers/store.py` `2,255` lines, `CanvasStage.vue` `1,133`, and `CanvasWorkspace.vue` `1,102`.
- Recommended direction is Human-authored workflow redesign followed by a contract-first modular-monolith strangler refactor; framework replacement, microservices, second database, and second Canvas engine remain rejected.
- T6-006 is planning-only and paused for the Human Owner's replacement workflow logic. No business-code change, migration, provider call, or destructive operation is authorized.

## Exact Next Action

Commit and push the rejected T6-005 reference snapshot plus T6-006 planning state, then stop. Resume only when the Human Owner supplies the replacement workflow logic.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/`.
- Preserve the rejected T6-005 snapshot as committed audit/reference evidence; do not reuse it implicitly.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Human input and approval are required for the replacement workflow and final T6-006 architecture.
- Revid retains the approved technology stack, MySQL-only runtime, multi-canvas scope, graph/history/persistence/provider contracts, accessibility, and review-only mobile unless a new ADR explicitly changes them.
- Real/paid provider calls, secrets, destructive operations, irreversible migrations, external accounts, framework/runtime replacements, and incompatible contracts remain Human gates.
