# TASK-T6-024 PROGRESS - Provider-valid Video compiler and old T6-015 replacement

- State: `DONE`
- Verification outcome: `PASS`
- Last updated: `2026-07-29`
- Baseline: `c79bf1e8c0deac88f4fa1111ba8dd8a3b7327d7c`
- Task: [TASK-T6-024](../todo/TASK-T6-024.md)
- Plan: [TASK-T6-024-PLAN](TASK-T6-024-PLAN.md)
- Report: [REPORT-T6-024](../../reports/REPORT-T6-024.md)

## Completed work

- Created the required goal before other work; verified cwd/repo root exactly
  `D:\works\codexWorks\project_revid`; fetched `origin` and confirmed activation parity `0/0`.
- Preserved the partial dirty checkout and protected untracked `.codex/`, `.hermes/`, `ai/evidence/t6-012/`,
  `output/`, `storage/`, and `test-results/` without reset, stash, clean, overwrite, or staging.
- Read the frozen PRD, behavior matrix, formal redesign plan, Direct Delivery ADR, accepted modular architecture,
  and T6-017 through T6-023 authority before continuing implementation.
- Observed backend RED at the missing Video API compiler integration and frontend RED at missing template Video
  request lineage.
- Added one pure `WorkflowTemplateProviderProjection` compiler for exactly text, one top-level image, or two through
  eight ordered keyframes. It emits only the current Agnes Video V2.0 request contract and no provider call or state
  mutation.
- Routed the existing Video API through that compiler while retaining the existing generation transaction,
  capability normalization, Agnes adapter, opaque `video_id`, exact polling/result, owned ingestion, quota, and
  same-card authorities.
- Added strict exact template/version/instance/instance-step/step/Script/shot validation against the current Video
  card before generation start, and persisted only the sanitized lineage snapshot.
- Carried template shot lineage through selected-shot Video card authoring, stable-node parameters, request context,
  and the existing request transport without automatic generation or WorkflowRun creation.
- Replaced obsolete semantic-fusion test expectations with provider-truthful fail-closed contracts. Semantic
  role/instruction/exclusion/source-revision fields, semantic mode capabilities, mixed modes, and nine-reference
  inputs cannot be silently reinterpreted as keyframes or projected to Agnes.
- Preserved model `agnes-video-v2.0`, ratio/clarity/duration normalization, top-level `negative_prompt`,
  `num_frames <= 441` and `1 + 8n`, `480p`/`720p`/`1080p`, capability-authoritative width/height, version-gated
  resolution compatibility, and current status/result/idempotency behavior.
- Kept T6-017 through T6-023 frozen contracts unchanged and did not implement WorkflowRun, upgrade/clone/detach,
  compatibility retirement, a third provider/Canvas authority, or automatic generation.

## Remaining work

- None for T6-024.
- T6-025 is dependency-ready but remains inactive. Final program-level Human visual, interaction, and journey
  acceptance remains T6-027.

## Exact next action

Stop. Do not activate or implement T6-025 in this task.

## Files changed

- `ai/tasks/todo/TASK-T6-024.md`
- `ai/tasks/doing/TASK-T6-024-PLAN.md`
- `ai/tasks/doing/TASK-T6-024-PROGRESS.md`
- `ai/reports/REPORT-T6-024.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `backend/api/video_generate.py`
- `backend/schemas/generation.py`
- `backend/services/workflow_templates/provider_projection.py`
- `backend/tests/test_video_generate.py`
- `backend/tests/test_workflow_template_video_projection.py`
- `backend/tests/test_semantic_video_reference_contract.py`
- `frontend/src/modules/canvas/generation-parameters.ts`
- `frontend/tests/e2e/canvas-workflow-template-video.spec.ts`
- `frontend/tests/e2e/canvas-semantic-video-references.spec.ts`

## Commands run and summarized results

- Isolation/fetch/parity: repo root exact; activation `HEAD == origin/main`; ahead/behind `0/0`.
- Observed RED: backend Video API integration `1 error` at missing compiler symbol; frontend template Video
  `1 failed` at missing `templateLineage`.
- Focused GREEN: compiler/API `6/6`; backend semantic fail-closed `4/4`; frontend focused `3/3`.
- Related backend under project `.venv`: `67 passed, 53 subtests passed`.
- Related Chromium: `43/43`.
- Fresh production build: PASS, `5,048 modules transformed`; existing large-chunk advisory only.
- Fresh built-artifact/provider-free Chromium: `14/14`.
- Full Chromium attempt exceeded `1,200s` without a terminal summary and is not claimed as PASS.
- A parallel backend shard experiment was invalidated by shared MySQL/upload fixture interference and is not product
  evidence; no failing T6-024 assertion was observed in the valid focused/related runs.
- Changed Python compile, project-state validator, UTF-8 decode, `git diff --check`, protected-path review, and
  owned-path secret scan (`0` hits): PASS.

## Blockers and release conditions

- None for T6-024.
- Real/paid provider calls, secrets/env, external accounts, destructive operations, user/production data,
  irreversible migration, and major long-term contract changes remain Human gates.
- Machine build/browser evidence is not Human acceptance; final Human acceptance remains T6-027.
