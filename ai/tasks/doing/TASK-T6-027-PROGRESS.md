# TASK-T6-027 PROGRESS - Compatibility retirement and final release proof

- State: `VERIFYING`
- Verification outcome: `PENDING`
- Last updated: `2026-07-29`
- Baseline: `0f9aa9a53af694f208a354b5fa2bd9628f0d4141`
- Task: [TASK-T6-027](../todo/TASK-T6-027.md)
- Plan: [TASK-T6-027-PLAN](TASK-T6-027-PLAN.md)
- Machine candidate:
  [T6-027 release candidate](../../reports/T6-027-RELEASE-CANDIDATE.md)

## Completed work

- Created the required session goal before repository work.
- Completely read the required tracked authority: AGENTS, CURRENT, ROADMAP, T6-026 Task/PLAN/PROGRESS/REPORT, frozen
  PRD and behavior matrix, Direct Delivery ADR/operating model, accepted refactor and Canvas architectures, and the
  T6-006 through T6-010 plus T6-017 through T6-025 release/compatibility reports.
- Confirmed old T6-016 was a provisional scope with no formal Task/PLAN/PROGRESS/REPORT; T6-027 closes its useful
  capability scope without fabricating historical state.
- Verified exact repo/saved-project identity, `main`, fetched baseline parity, tracked/index cleanliness, and protected
  user-owned untracked boundaries before edits.
- Created and activated the independent T6-027 Task/PLAN/PROGRESS before business-code changes.
- RED-proved missing compact Image/Video v2 admission and direct provider projection, reachable browser-local Workflow
  batch, write-capable hidden Result reconciliation, four backend Image default mismatches, seven frontend stale
  default/legacy-route assertions, and one current high PostCSS advisory.
- Added compact Image/Video v2 admission with strict scope/lineage/asset validation, normalized provider-valid request
  snapshots, deterministic idempotent replay, and direct durable dispatch.
- Moved ordinary Canvas Image/Video submission to compact receipts and exact stable-card binding. Structured Video
  references no longer duplicate legacy `image_ids/reference_mode`.
- Removed the production Workflow batch action/overlay/panel/local execution contract and its obsolete tests.
- Removed write-capable hidden Result reconciliation and kept historical Result data as read-only compatibility.
- Reconciled ordinary Image defaults to backend-authoritative `1:1` and `output_count: 1`.
- Preserved the Video cinematic v2/v7 `resolution` capability gate in both legacy and compact admission.
- Updated the lockfile from vulnerable `postcss@8.5.15` to `8.5.24` and `nanoid@3.3.12` to `3.3.16`; production audit
  is now zero.
- Completed the backend-minus-known-upload-process classification at `712/712` PASS and kept the separate full-suite
  upload worker boundary explicit.
- Repaired one stale Cinematic Script test gate that recognized only a compact `.n-drawer`; the replacement runtime's
  visible node-details close contract now proves the same durable Script action at desktop width.
- Completed fresh build and provider-free browser release proof. No real provider or Human acceptance is claimed.
- Reconciled T6-027 Task/PLAN/CURRENT/ROADMAP and wrote a non-final release-candidate record as
  `VERIFYING / PENDING`.

## Remaining work

- Human Owner performs the frozen visual, interaction, and complete-journey review and records `ACCEPT` or
  `ACCEPT_WITH_DECLARED_BOUNDARIES`.
- Do not create a successor Task and do not create `REPORT-T6-027.md` before that explicit acceptance.

The exact-path commit, push, and fetched parity are reported in the final delivery handoff because this tracked
record is itself carried by that one commit.

## Exact next action

Human Owner performs the frozen final review. If accepted, close T6-027 with a final REPORT and state-only
reconciliation; create no successor Task.

## Files changed

### Delivery and state

- `ai/tasks/todo/TASK-T6-027.md`
- `ai/tasks/doing/TASK-T6-027-PLAN.md`
- `ai/tasks/doing/TASK-T6-027-PROGRESS.md`
- `ai/reports/T6-027-RELEASE-CANDIDATE.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`

### Backend

- `backend/api/generation_jobs.py`
- `backend/api/video_generate.py`
- `backend/controllers/generation_starts.py`
- `backend/repositories/generation_tasks.py`
- `backend/schemas/generation_job.py`
- `backend/services/generation/job_service.py`
- `backend/services/generation/provider_dispatch.py`
- `backend/tests/test_canvas_generation_transactions.py`
- `backend/tests/test_generation_job_api_v2.py`
- `backend/tests/test_generation_job_provider_dispatch.py`
- `backend/tests/test_image_e2e.py`

### Frontend production and dependency lock

- `frontend/package-lock.json`
- `frontend/src/components/canvas/CanvasProfessionalActionPalette.vue`
- `frontend/src/components/canvas/CanvasWorkflowBatchOverlay.vue` (retired)
- `frontend/src/components/canvas/CanvasWorkflowBatchPanel.vue` (retired)
- `frontend/src/components/canvas/composables/use-canvas-generation-actions.ts`
- `frontend/src/components/canvas/composables/use-canvas-professional-actions.ts`
- `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- `frontend/src/components/canvas/composables/use-canvas-workflow-orchestration.ts` (retired)
- `frontend/src/modules/canvas/context-surface-state.ts`
- `frontend/src/modules/canvas/professional-action-registry.ts`
- `frontend/src/modules/canvas/resource-commands.ts`
- `frontend/src/modules/canvas/workflow-orchestration.ts` (retired)
- `frontend/src/views/app/CanvasWorkspace.vue`

### Frontend tests

- `frontend/tests/e2e/canvas-compatibility-retirement.spec.ts`
- `frontend/tests/e2e/canvas-cinematic-script.spec.ts`
- `frontend/tests/e2e/canvas-generation-parameters-fixture.ts`
- `frontend/tests/e2e/canvas-generation-parameters-v6.spec.ts`
- `frontend/tests/e2e/canvas-generation-parameters.spec.ts`
- `frontend/tests/e2e/canvas-generation-runtime-feedback.spec.ts`
- `frontend/tests/e2e/canvas-graph-commit.spec.ts`
- `frontend/tests/e2e/canvas-professional-action-registry.spec.ts`
- `frontend/tests/e2e/canvas-resource-generation-api-fixture.ts`
- `frontend/tests/e2e/canvas-resource-generation-state-fixture.ts`
- `frontend/tests/e2e/canvas-resource-generation.spec.ts`
- `frontend/tests/e2e/canvas-result-placement.spec.ts`
- `frontend/tests/e2e/canvas-workflow-orchestration-ui.spec.ts` (retired)
- `frontend/tests/e2e/canvas-workflow-orchestration.spec.ts` (retired)

## Commands run and summarized results

- Startup repo/fetch/parity: root `D:/works/codexWorks/project_revid`; `main`;
  `HEAD == origin/main == 0f9aa9a53af694f208a354b5fa2bd9628f0d4141`; ahead/behind `0/0`; tracked/index
  clean; no Git operation.
- Activation project-state validator: PASS.
- Focused backend Image/transaction/compact job/provider/text group: PASS.
- Cinematic v2/v7 gate, Video, semantic-reference, parameter, compact API, and provider-dispatch group: `76/76` PASS.
- Full backend discovery: accurately classified `747` tests as `31 errors + 2 failures`, not PASS. Thirty errors plus
  two failures are the unchanged upload modules' Windows `anyio.to_process` worker-initialization failure; the one
  related cinematic resolution-gate error was fixed.
- Isolated upload classification: same `BrokenWorkerProcess` fingerprint in the three unchanged upload modules.
- Backend-minus-upload classification: `712/712` PASS in `811.673s`.
- `alembic heads`: single `g2b3c4d5e6f7`; backend compileall: PASS.
- Frontend generation compatibility/parameter Chromium: initial seven stale assertions; final `26/26` PASS.
- Fresh production build after source and dependency remediation: PASS; Vue type-check included; `5,049` modules.
- Fresh built-artifact T6-017 through T6-026 release journey Chromium: `66/66` PASS.
- Focused compatibility retirement Chromium: `2/2` PASS.
- Cinematic Script and Script authoring authority Chromium: initial `1/9` stale gate failure; isolated fix `1/1`
  PASS; final group `9/9` PASS.
- `npm audit --omit=dev --audit-level=high`: initial one high PostCSS advisory; final zero vulnerabilities.
- Final fresh production build: PASS; Vue type-check included; `5,049` modules.
- Project-state validator, `git diff --check`, and explicit 44-path UTF-8/BOM/protected-path/sensitive-pattern audit:
  PASS before exact staging.

## Blockers and release conditions

- No T6-027 implementation blocker remains.
- The full-suite upload classification is an unchanged Windows spawned-process harness boundary. It affects only a
  claim that the entire backend suite passed; it does not change the GREEN T6-related groups or touch upload code.
  A host where AnyIO worker initialization succeeds is required before claiming a fresh full-backend PASS.
- The frozen PRD requires final Human visual, interaction, and complete-journey acceptance. Provider-free automation,
  fresh build, runtime probes, screenshots, and machine interaction cannot satisfy this gate.
- Sole product release condition after exact commit/push/parity: explicit Human Owner `ACCEPT` or
  `ACCEPT_WITH_DECLARED_BOUNDARIES`; until then T6-027 remains `VERIFYING / PENDING`.
