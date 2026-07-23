# Revid Current Project State

Last updated: 2026-07-23

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-004 and T6-006 through T6-007: `DONE / PASS`.
- T6-005: `BLOCKED / FAIL` after explicit Human visual/interaction rejection on 2026-07-23.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: none; T6-008 activation is reserved for a new goal-mode Task after T6-007 push.
- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-007](../tasks/todo/TASK-T6-007.md).
- Plan: [TASK-T6-007-PLAN](../tasks/doing/TASK-T6-007-PLAN.md).
- Progress: [TASK-T6-007-PROGRESS](../tasks/doing/TASK-T6-007-PROGRESS.md).
- Report: [REPORT-T6-007](../reports/REPORT-T6-007.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Live Gates

- T6-005 machine proof remains historical implementation evidence only: build `4,988`, frontend `622/622`, backend `583/583`, performance `2/2`, and audit `0`; Human acceptance failed.
- T6-005's visual design, interaction logic, business flow, and information architecture are all rejected. Its implementation is committed only as audit/reference evidence and creates no reuse presumption.
- Primary concentration: `backend/controllers/store.py` `2,255` lines, `CanvasStage.vue` `1,133`, and `CanvasWorkspace.vue` `1,102`.
- Confirmed direction is the Human-approved workflow redesign followed by a contract-first modular-monolith strangler refactor; framework replacement, microservices, second database, and second Canvas engine remain rejected.
- The Human Owner supplied and confirmed the replacement LibTV-style card workflow, built-in director Skill ownership, semantic multi-image video, durable generation, and compact-response requirements.
- Public MIT Skill `Emily2040/seedance-2.0` commit `57d01dc6` is a pinned T6-012 research baseline for directing/reference/continuity/eval patterns only; it is not installed, user-selectable, or authoritative for provider capabilities.
- Read-only audit confirmed current keyframe coercion, plain-text-only script authoring, hard-coded text model, request-bound provider work, project-wide full-task polling with `request_parameters`, duplicated completion payloads, hidden result-node projection, and missing node rename UI.
- T6-007 completed characterization with `10` backend and `11` browser expected RED assertions, all carrying named absent-contract fingerprints.
- Legacy compatibility proof passes backend `26/26`, browser `6/6`, and build `4,988`; no runtime source, snapshot, schema, provider, or production API changed.
- T6-008 owns durable compact generation jobs and is dependency-ready only after the scoped T6-007 commit is pushed.

## Exact Next Action

Commit and push the exact T6-007-owned files, then create a new goal-mode Codex Task that re-reads the fact chain and activates T6-008 only.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/`.
- Preserve the rejected T6-005 snapshot as committed audit/reference evidence; do not reuse it implicitly.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Human approval of the T6-006 architecture and T6-007 characterization was obtained on 2026-07-23.
- Revid retains the approved technology stack, MySQL-only runtime, multi-canvas scope, graph/history/persistence/provider contracts, accessibility, and review-only mobile unless a new ADR explicitly changes them.
- Real/paid provider calls, secrets, destructive operations, irreversible migrations, external accounts, framework/runtime replacements, and incompatible contracts remain Human gates.
