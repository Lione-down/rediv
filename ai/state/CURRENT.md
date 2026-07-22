# Revid Current Project State

Last updated: 2026-07-22

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-004: `DONE / PASS`.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: none.
- Latest completed Task: `T6-004 - Node workflow productionization`.
- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-004](../tasks/todo/TASK-T6-004.md).
- Plan: [TASK-T6-004-PLAN](../tasks/doing/TASK-T6-004-PLAN.md).
- Progress: [TASK-T6-004-PROGRESS](../tasks/doing/TASK-T6-004-PROGRESS.md).
- Report: [REPORT-T6-004](../reports/REPORT-T6-004.md).

## Live Gates

- Image batch slot 1 remains on the initiating card; later slots create sibling cards backed by independent existing single-result tasks and assets. Partial success is durable and retry is card-local.
- AI draft/refine directly replaces current text through normal Canvas history. Script-to-shot creates an existing storyboard/group of canonical image-generation cards with individual generation, bounded generate-all, project-resource ownership, and standard ungroup.
- Video reference roles share one universal nine-entry budget, preserve stable order, and allow one asset in distinct roles. New frontend and backend contracts must move together while legacy saved references remain readable.
- T6-003 geometry remains locked: the floating output control follows pointer X/Y inside its accepted acquisition/clamp surface while logical ports, drag origins, and persisted edges stay fixed.
- Human Owner accepted the four current-source visual captures and verified interaction workflow on 2026-07-22.
- Final proof passed: backend `583/583`, exact-current-source Chromium `610/610`, headed performance `2/2`, production build `4,976`, audit `0`, state, diff, and hygiene gates.
- No real/paid provider call, secret access, user/runtime migration, destructive operation, external-account change, new durable authority, or incompatible provider contract occurred.

## Exact Next Action

Await Human product direction. Before further implementation, create and activate one dependency-ready Task with its PLAN and PROGRESS.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, and `storage/`; they are excluded from T6-004 delivery.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Official reference work remains clean-room, read-only, public behavior observation; private source, proprietary assets, branding, prompts, and network contracts remain out of scope.
- Revid retains graph, history, persistence, provider/model selection, accessibility, review-only mobile, and Revid-only capabilities.
- T6-004 is closed. Further node-workflow changes require a newly activated Task and do not reopen it automatically.
