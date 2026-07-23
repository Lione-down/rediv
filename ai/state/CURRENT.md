# Revid Current Project State

Last updated: 2026-07-23

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-004 and T6-006: `DONE / PASS`.
- T6-005: `BLOCKED / FAIL` after explicit Human visual/interaction rejection on 2026-07-23.
- T6-007: `DOING / PENDING`.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: `T6-007 - Characterize and freeze replacement contracts`.
- State: `DOING`
- Verification outcome: `PENDING`
- Task: [TASK-T6-007](../tasks/todo/TASK-T6-007.md).
- Plan: [TASK-T6-007-PLAN](../tasks/doing/TASK-T6-007-PLAN.md).
- Progress: [TASK-T6-007-PROGRESS](../tasks/doing/TASK-T6-007-PROGRESS.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Live Gates

- T6-005 machine proof remains historical implementation evidence only: build `4,988`, frontend `622/622`, backend `583/583`, performance `2/2`, and audit `0`; Human acceptance failed.
- T6-005's visual design, interaction logic, business flow, and information architecture are all rejected. Its implementation is committed only as audit/reference evidence and creates no reuse presumption.
- Live inventory: frontend source `270 files / 47,908 lines`, frontend tests `140 / 27,928`, backend source/tests `247 / 41,584`.
- Primary concentration: `backend/controllers/store.py` `2,255` lines, `CanvasStage.vue` `1,133`, and `CanvasWorkspace.vue` `1,102`.
- Confirmed direction is the Human-approved workflow redesign followed by a contract-first modular-monolith strangler refactor; framework replacement, microservices, second database, and second Canvas engine remain rejected.
- The Human Owner supplied and confirmed the replacement LibTV-style card workflow, built-in director Skill ownership, semantic multi-image video, durable generation, and compact-response requirements.
- Public MIT Skill `Emily2040/seedance-2.0` commit `57d01dc6` is a pinned T6-012 research baseline for directing/reference/continuity/eval patterns only; it is not installed, user-selectable, or authoritative for provider capabilities.
- Read-only audit confirmed current keyframe coercion, plain-text-only script authoring, hard-coded text model, request-bound provider work, project-wide full-task polling with `request_parameters`, duplicated completion payloads, hidden result-node projection, and missing node rename UI.
- T6-006 planning is Human-approved and complete. T6-007 is authorized only to add replacement RED contract tests and record precise absent-contract failure fingerprints; it must not change runtime behavior or update snapshots to hide mismatches.

## Exact Next Action

Continue T6-007 in the newly created goal-mode task. Re-read its Task/PLAN/PROGRESS and add focused RED backend/frontend contracts before any runtime implementation.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/`.
- Preserve the rejected T6-005 snapshot as committed audit/reference evidence; do not reuse it implicitly.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Human approval of the T6-006 architecture and T6-007 activation was obtained on 2026-07-23.
- Revid retains the approved technology stack, MySQL-only runtime, multi-canvas scope, graph/history/persistence/provider contracts, accessibility, and review-only mobile unless a new ADR explicitly changes them.
- Real/paid provider calls, secrets, destructive operations, irreversible migrations, external accounts, framework/runtime replacements, and incompatible contracts remain Human gates.
