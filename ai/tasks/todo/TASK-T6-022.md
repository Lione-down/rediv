# TASK-T6-022 - Deliver workflow-template library and configuration UI

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: deliver the accessible Template Library, exact-version configuration drawer, provider-free preflight
  review and explicit cost confirmation, then instantiate through the existing T6-021 route and canonical Canvas
  mutation adoption path.
- Dependency: `T6-021 - DONE / PASS`; activation baseline
  `01db59d05c48cfab1d553c8dd0ea8d9b378616f4`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-022-PLAN](../doing/TASK-T6-022-PLAN.md).
- Progress: [TASK-T6-022-PROGRESS](../doing/TASK-T6-022-PROGRESS.md).
- Report: [REPORT-T6-022](../../reports/REPORT-T6-022.md).

## Scope

1. Extend the existing `modules/template` domain with strict lifecycle-list, provider-free preflight, and T6-021
   instantiate clients and presentation types. Keep legacy Graph Template APIs readable and separate.
2. Add a Template Library with `Built-in`, `My Templates`, `Recent`, and `Deprecated` views derived only from the
   owner-scoped backend lifecycle response and its timestamps.
3. Display exact version, lifecycle, owner class, category, required slots, graph/step counts, editable viewport,
   capability requirements, cost-gate presence, update/publish time, and deprecation state without inventing
   provider readiness.
4. Add a configuration drawer for declared typed variables, target-project asset slots, locked/allowed fields,
   topology preview, preflight errors/warnings, backend-authoritative quota units, cost class, and explicit cost
   confirmation.
5. Compute the T6-020 asset source revision only from the same bounded asset identity/status/update fields already
   returned by the owned project-resource API. Do not persist copied source content or create a new asset authority.
6. Keep preflight read-only. It must create zero Canvas revision, template instance, quota/ledger, generation
   task/job/run, or provider request.
7. After an executable current preflight, use
   `POST /api/projects/{project_id}/canvases/{canvas_id}/workflow-template-instances` with exact version,
   bindings, cost confirmation, current Canvas base revision, stable retry mutation ID, and preflight fingerprint.
8. Adopt the returned T6-021 Canvas document mutation through the existing serialized Canvas mutation controller.
   The created nodes/connections remain ordinary canonical entities and both Workflow/Storyboard views project the
   same stable node IDs.
9. Support keyboard selection/configuration/preflight/instantiate, associated labels/descriptions/errors, visible
   focus, Escape/close focus return, reduced motion, 1440/1366/920 editing, and 375 review-only.

## Visual direction

- Visual thesis: retain the dense premium graphite-black creative workspace with quiet violet selection and focus.
- Content hierarchy: library classification -> exact-version template facts -> declared configuration -> graph and
  provider-free preflight -> one terminal `添加到画布` action.
- Interaction: one right-side work drawer, deterministic selection state, no decorative motion, and existing
  background-color-step depth.
- CSS strategy: existing SCSS tokens and scoped styles only.

## Non-goals

- No T6-023 Script/Image behavior, T6-024 Video compiler, T6-025 WorkflowRun, T6-026 version diff/upgrade/clone/
  detach, or T6-027 compatibility retirement/release proof.
- No template authoring/publish/retire UI, team/public marketplace, import/export, Pro Alpha selector, automatic
  Image 2.0 precomposition, auto generation, provider call, quota mutation, job/run creation, or user database
  operation.
- No rewrite or widening of the frozen V1 manifest, T6-020 preflight, T6-021 exact-version instantiate/lineage,
  Canvas patch, typed command/history/autosave, project-resource, or provider authority.
- No promotion of `sessionStorage`, legacy mock `execution_mode`, local-only state, or copied Canvas data into
  production authority.
- No environment/secret/provider-raw/prompt/source-content/user-owned evidence access.

## Acceptance criteria

1. Focused browser/contract tests first fail only because the T6-022 library, drawer, API client, and orchestrator
   behavior are absent.
2. The three V1 built-ins appear under `Built-in`; owned private versions, recent timestamp-derived entries, and
   retired entries remain correctly classified without exposing another owner.
3. Template selection and exact version facts are keyboard and screen-reader operable at 1440, 1366, and 920.
4. Declared text, multiline, integer, boolean, enum, and bounded-list fields apply server-compatible defaults and
   bounds; missing/invalid fields have associated actionable Chinese errors.
5. Asset slots accept only owned active target-project assets of the declared media type and respect cardinality.
6. Preflight request/response matches the T6-020 contract, renders safe error/warning/quota/cost/graph/capability
   facts, and produces zero graph/execution side effect.
7. `requires_confirmation` displays backend-authoritative cost class and requires explicit confirmation plus a fresh
   successful preflight before instantiate is enabled.
8. `添加到画布` is the only instantiate action; no `生成全部` or implicit execution action exists.
9. Instantiate uses the existing T6-021 route once, adopts exactly one returned Canvas mutation, closes the drawer,
   restores focus, and makes the same stable node observable in Workflow and Storyboard.
10. 375px is review-only: template facts/topology/preflight history remain readable while configuration, preflight
    mutation request, and instantiate are unavailable.
11. Escape, focus return, visible focus, reduced motion, and scoped axe serious/critical zero are browser-proved.
12. Focused browser/contract regression, related Canvas/resource/Storyboard regression, fresh build, state/diff/
    security audit, one exact-path conventional commit/push, and remote parity are recorded. Machine evidence is not
    described as Human visual/interaction acceptance; final Human gate remains T6-027.
