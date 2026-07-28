# TASK-T6-027 - Retire compatibility paths and prove final release candidate

- State: `VERIFYING`
- Verification outcome: `PENDING`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: retire only the legacy template/mock execution compatibility paths that the frozen replacement
  contracts have made obsolete, reconcile the four broad Image default-ratio assertions, prove the complete
  provider-free T6-017 through T6-026 release journey and old T6-016 closeout, and hand the resulting release
  candidate to the Human Owner without representing machine evidence as Human acceptance.
- Dependency: `T6-026 - DONE / PASS`; activation baseline
  `0f9aa9a53af694f208a354b5fa2bd9628f0d4141`.
- Requirements:
  [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Refactor architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Canvas authority:
  [V2 Canvas architecture](../../architecture/REVID-V2-CANVAS-ARCHITECTURE.md).
- Decision:
  [Codex Direct Delivery](../../decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md).
- Plan: [TASK-T6-027-PLAN](../doing/TASK-T6-027-PLAN.md).
- Progress: [TASK-T6-027-PROGRESS](../doing/TASK-T6-027-PROGRESS.md).
- Machine release candidate:
  [T6-027 release candidate](../../reports/T6-027-RELEASE-CANDIDATE.md).

## Scope

1. Build a tracked, machine-enforced compatibility-retirement inventory for the three frozen old T6-016 targets:
   legacy full-task payload consumption, normal-Canvas project-wide generation polling, and hidden Result-card
   coupling. Preserve only explicit history/admin or read-only legacy boundaries still required by the frozen PRD.
2. Remove or close every production/runtime path that still lets an ordinary V3 template/Canvas journey depend on
   `canvas-generation-batch`, browser-local mock `execution_mode`, legacy full generation-task responses,
   project-wide polling, or hidden Result entities. Do not remove the separately frozen readable legacy Graph
   Template boundary.
3. Resolve the four broad backend Image assertions recorded by T6-026. Align obsolete expectations to the
   backend-authoritative current `1:1` ordinary Image default and current `output_count` contract when repository
   authority proves the tests stale; otherwise record the exact unresolved mismatch as a release blocker.
4. Prove the provider-free end-to-end V3 journey from owner-scoped immutable template selection through preflight,
   atomic instantiate, typed Script/Image/Video card authoring, explicit durable WorkflowRun, compatible lifecycle,
   reload/restart recovery, same-card result projection, and stable Canvas history/autosave authority.
5. Prove strict owner/project/Canvas/version/instance/run/job scope, deterministic idempotency, concurrency/lease
   safety, migration heads/comments, transaction rollback, reload/restart durability, bounded responses, and zero
   unintended provider/quota/run/job/Canvas mutation on failure paths.
6. Reconcile old T6-016 as a superseded provisional scope completed by T6-027 without fabricating a historical
   Task, state, or REPORT. Reconcile T6-017 through T6-027 release state and provide an auditable release-candidate
   verification record.
7. Run focused RED/GREEN, relevant backend/browser regression, fresh production build, provider-free built-artifact
   browser proof, project-state/diff/security/release audits, exact-path staging, one conventional commit/push, and
   fetched remote-parity verification.
8. Keep final visual, interaction, and complete journey acceptance as an explicit Human Owner gate. Machine tests,
   screenshots, runtime probes, and browser automation cannot satisfy or waive that gate.

## Non-goals

- No new T6 task, follow-up roadmap item, or post-T6-027 feature.
- No removal of readable legacy Graph Templates, exact historical lineage, history/admin audit views, supported old
  provider result parsing, or frozen additive V3 persistence solely for cosmetic cleanup.
- No second Canvas/store/history/autosave/provider/job authority and no promotion of `sessionStorage`,
  `localStorage`, `execution_mode`, or local-only state.
- No automatic generation, implicit WorkflowRun, silent model routing, silent compatible upgrade, or hidden
  provider/quota mutation.
- No real/paid provider call, secret/env/provider-raw/prompt/source-content/user-owned evidence access, external
  account action, user/production database mutation, destructive cleanup/reset/stash/overwrite, or irreversible
  migration.
- No fabrication of Human `ACCEPT`, `ACCEPT_WITH_DECLARED_BOUNDARIES`, program `PASS`, or old T6-016 historical
  completion evidence.

## Dependencies and risks

- T6-008 through T6-011 replaced ordinary generation transport, sync, stable-card, and visible-runtime authority;
  some legacy reads were intentionally retained until the old T6-016/T6-027 retirement gate.
- T6-017 freezes legacy Graph Template readability, additive V3 objects, and provider-valid request shapes. A broad
  deletion that breaks read-only legacy templates or supported result parsing is incompatible.
- T6-023 through T6-026 own Script/Image, Video, WorkflowRun, and instance lifecycle. Retirement must prove those
  authorities are sufficient before deleting a fallback.
- The current frontend includes historical mock-only workflow-template UX from T5-087. Its local simulation may be
  test/demo compatibility, but it cannot remain reachable as production execution authority for V3 templates.
- Full browser/backend evidence may be operationally long. Timeouts or infrastructure failures must be classified
  honestly and cannot be converted to PASS.
- The frozen PRD acceptance criterion 29 requires a Human visual/interaction gate. Unless the Human Owner records an
  explicit acceptance decision, T6-027 remains `VERIFYING / PENDING` after all machine work is committed and pushed.

## Acceptance criteria

1. A focused retirement contract first fails on each currently reachable obsolete ordinary-runtime dependency, or
   records a code-backed proof that the dependency is already absent; every claimed RED has the expected
   missing-retirement fingerprint before production edits.
2. Ordinary V3 Canvas/template runtime makes zero legacy full-task polling/list calls and consumes only compact,
   owner/Canvas-scoped status/result/delta or exact bound-job routes. History/admin compatibility remains explicit
   and cannot be reached as normal card polling.
3. Production V3 execution exposes no browser-local mock `execution_mode` authority and does not depend on
   `canvas-generation-batch`; explicit durable WorkflowRun and compact generation jobs remain the only executable
   template path.
4. A successful Image/Video result materializes on its owning stable card or explicit ordinary batch sibling.
   Hidden Result nodes are neither created nor required by normal V3 authoring/execution/reload; historical result
   data stays readable only through a declared compatibility projection.
5. The four Image default-ratio/output-count broad assertions are GREEN under the frozen backend-authoritative
   contract, or T6-027 is accurately blocked with the exact contract conflict and release condition.
6. Focused and related regression proves T6-017 through T6-026 contract parsing, MySQL lifecycle/lineage, preflight,
   instantiate, Script/Image/Video compilation, WorkflowRun orchestration, compatibility lifecycle, Canvas
   revision/idempotency/history/autosave, concurrency/lease fencing, restart/reload recovery, and migration heads.
7. A fresh frontend build precedes provider-free built-artifact browser proof of the complete user journey,
   responsive/accessibility boundaries, stable Workflow/Storyboard identity, explicit run, card-bound lifecycle,
   reload recovery, compatible upgrade/clone/detach, and zero implicit provider execution.
8. Release audits prove exact tracked scope, no env/secret/provider-raw/prompt/source-content/user-evidence access,
   no browser-local authority, no tracked database/runtime artifact, non-empty comments for any changed schema,
   valid UTF-8, `git diff --check`, and passing project-state validation.
9. Task/PLAN/PROGRESS/CURRENT/ROADMAP and a non-final release-candidate verification record agree on delivered
   machine evidence, old T6-016 closeout, remaining Human gate, and the absence of a successor Task.
10. One exact-path conventional commit is pushed to `main`; a final fetch proves the full SHA,
    `HEAD == origin/main`, and ahead/behind `0/0`.
11. Without explicit Human acceptance, final repository state is truthfully `VERIFYING / PENDING` with the sole
    release condition being Human visual, interaction, and complete journey acceptance. A final
    `REPORT-T6-027.md` and `DONE / PASS` are prohibited until that condition is actually satisfied.
