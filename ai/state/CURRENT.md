# Revid Current Project State

Last updated: 2026-07-22

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`.
- Engineering owner: Codex Project Lead Engineer.
- Human Owner gates: product direction, real or paid provider calls, real secrets, destructive data/filesystem operations, irreversible migrations, and external-account changes.
- Decision: [ADR-2026-07-10-CODEX-DIRECT-DELIVERY](../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).

## Product State

- Phase 4 initial version and Product V2 / Phase 5: `DONE / PASS`.
- Product V3 / Phase 6 Tasks T6-001 through T6-003: `DONE / PASS`.
- Database authority: MySQL-only.

## Active Delivery

- Active implementation Task: none.
- Latest completed Task: `T6-003 - Canvas card UI and interaction high-fidelity optimization`.
- State: `DONE`
- Verification outcome: `PASS`
- Task: [TASK-T6-003](../tasks/todo/TASK-T6-003.md).
- Plan: [TASK-T6-003-PLAN](../tasks/doing/TASK-T6-003-PLAN.md).
- Progress: [TASK-T6-003-PROGRESS](../tasks/doing/TASK-T6-003-PROGRESS.md).
- Report: [REPORT-T6-003](../reports/REPORT-T6-003.md).

## Live Gates

- Materialized image/video work reads as one stable media card with card-local source selection, typed references, prompt, lifecycle, and result projection; canonical lineage remains available through Graph Access.
- Logical ports of one direction retain typed IDs and converge on one fixed boundary midpoint. The separate outside output control has an `80 CSS px` circular acquisition region, follows pointer X/Y within a `30 CSS px` radial clamp, and keeps its `+` centered within `1 CSS px`; persisted paths and new drag origins remain fixed at the logical midpoint.
- The selected lower composer is a centered fixed `660 CSS px` screen-space surface with a `16 world px` media gap. The top professional toolbar is approximately `900 x 50 CSS px`, viewport-clamped, and collision-safe without changing media geometry.
- Human Owner accepted the current implementation boundary on 2026-07-22 and requested direct closure; future Human-drawn UI sketches are intentionally outside T6-003 and require a separately activated Task.
- Final focused protected-snapshot verification passed `1/1`; final unexcluded functional/accessibility Chromium passed `599/599` in `11.5m`; unchanged headed performance passed `2/2`; production build, audit, state, diff, and hygiene gates pass.
- No real/paid provider request, secret access, user/runtime migration, destructive operation, backend/schema change, or incompatible contract change occurred.

## Exact Next Action

Await Human UI sketches. Before any new implementation, create and activate one dependency-ready Task with its PLAN and PROGRESS.

## Worktree Ownership

- Preserve user-owned untracked `.codex/`, `.hermes/plans/`, `output/`, and `storage/`; they are excluded from T6-003 delivery.
- Preserve unrelated concurrent work and stop if a future owned path overlaps unknown changes.

## Boundaries And Human Gates

- Official reference work remains clean-room, read-only, public behavior observation; private source, proprietary assets, branding, prompts, and network contracts remain out of scope.
- Revid retains graph, history, persistence, provider/model selection, accessibility, review-only mobile, and Revid-only capabilities.
- Future UI sketches do not reopen T6-003 automatically; implementation begins only after a new Task plan is activated.
