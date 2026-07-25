# REPORT-T6-011 - Complete Canvas frontend and card runtime replacement

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-25`
- Activation baseline: `11cdaaac7be485e219830ebf9a6c589996830a47`
- Reactivation baseline: rejected delivery `05679e04484857e86541aafc4601a4a7cd1f2e72`
- Human decision: `ACCEPT_WITH_DECLARED_BOUNDARIES`
- Task: [TASK-T6-011](../tasks/todo/TASK-T6-011.md).
- Plan: [TASK-T6-011-PLAN](../tasks/doing/TASK-T6-011-PLAN.md).
- Progress: [TASK-T6-011-PROGRESS](../tasks/doing/TASK-T6-011-PROGRESS.md).

## Delivered

- Replaced the production-visible Canvas shell, cards, ports, edges, attached composers, minimap, utilities, context menu,
  and authoring dock with one DOM-visible runtime while retaining Leafer as the world/camera engine.
- Preserved stable Canvas node IDs, graph/history/autosave/document authority, MySQL-backed durable compact jobs, quota and
  provider admission, and legacy document/result readability.
- Restored whole-card grab dragging, same-frame edge movement, Ctrl+wheel zoom, minimap, Canvas context actions, top-right
  utilities, chat action, playable same-card video results, complete image framing, and unobstructed video controls.
- Made each ordinary card expose one visible left and one visible right acquisition `+`, while typed logical ports remain
  fail-closed connection authorities and persisted edges attach to card boundaries.
- Added official Agnes 2.5 Flash text capability/admission/dispatch/selector support and real integer provider-progress
  projection without provider raw exposure or paid calls.
- Kept persisted and draft SVG edges below every card and removed the Canvas-delta list from normal persisted-card polling;
  exact bound-job status/result routes now own reload, live progress, terminal result fetch, and stop behavior.

## TDD And Verification Evidence

- Every Human rejection unit used observed focused RED before coherent GREEN, related regression, fresh build, and browser
  proof. Automation remained separate from Human acceptance.
- Final R8N related browser matrix: `62/62` PASS, including real path/card intersection, draft/persisted edge stacking,
  exact bound-job progress, Canvas switching/reload, terminal result fetch, and zero normal Canvas-delta list calls.
- Final backend compact API/job-runner regression: `18/18` PASS. Earlier T6-011 Agnes/provider/admission and Canvas
  regression remained green as recorded in PROGRESS.
- Production build: PASS; Vue type-check and Vite transformed `5,034` modules.
- Project-state validator, `git diff --check`, sensitive-path review, 60-line CURRENT budget, and local `5173/8000` health:
  PASS.
- Browser evidence includes `output/playwright/t6-011-r8n-edges-under-cards.png`; generated output remains local evidence
  and is not part of the committed delivery.

## Human Acceptance

On 2026-07-25 the Human Owner stated: `总体上通过，小问题以后再调试，现在在新的会话中执行下一计划任务`.
This is recorded as `ACCEPT_WITH_DECLARED_BOUNDARIES`: the delivered T6-011 workflow is accepted overall, while
unspecified minor issues are deferred to a future independently planned Task and are not silently folded into T6-012.

## Boundaries

- No real or paid provider call, secret access, environment-file access, user/runtime migration, destructive operation,
  external-account action, framework/database/Canvas-engine rewrite, or compatibility removal occurred.
- Remaining Figma component/state expansion is limited by the recorded Starter MCP quota and is not represented as a
  completed editable design-system deliverable.
- The existing PostCSS high advisory remains separately declared; no dependency mutation was made in this Task.
- User-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` remain excluded from delivery.
- T6-012 behavior was not implemented. A new Codex task must define and activate the next dependency-ready Task from the
  committed and pushed T6-011 state.

## Decision

T6-011 is `DONE / PASS` by explicit Human `ACCEPT_WITH_DECLARED_BOUNDARIES`. Exact staging, one scoped commit, and push are
authorized. The next Task must start in a new Codex session after remote parity is verified.
