# TASK-T6-024 - Deliver provider-valid Video compiler and replace old T6-015

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 reusable cinematic workflow templates`
- Objective: compile template-backed Revid Video intent into only the Agnes Video V2.0 request modes supported by
  the current versioned provider contract—text, one image, or ordered temporal keyframes—while preserving semantic
  reference lineage and failing closed on the superseded old T6-015 semantic multi-image fusion target.
- Dependency: `T6-023 - DONE / PASS`; activation baseline
  `c79bf1e8c0deac88f4fa1111ba8dd8a3b7327d7c`.
- Requirements: [Reusable cinematic template PRD](../../requirements/REVID-V3-REUSABLE-CINEMATIC-TEMPLATE-PRD.md).
- Behavior matrix:
  [Workflow Template V1 Behavior Matrix](../../requirements/REVID-V3-WORKFLOW-TEMPLATE-BEHAVIOR-MATRIX.md).
- Architecture:
  [Accepted full-stack modular refactor](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-024-PLAN](../doing/TASK-T6-024-PLAN.md).
- Progress: [TASK-T6-024-PROGRESS](../doing/TASK-T6-024-PROGRESS.md).

## Scope

1. Add one strict provider projection/compiler boundary that consumes current template/version/instance/step/node/
   shot lineage, sanitized Video intent, current capability, and validated target-project asset revisions without
   sending HTTP or mutating Canvas, quota, task, job, or WorkflowRun state.
2. Compile exactly three mutually exclusive Agnes Video V2.0 input shapes:
   - zero frame images to text-to-video;
   - one validated frame image to the official top-level `image`;
   - two through eight explicitly temporal ordered frames to `extra_body.image[]` plus
     `extra_body.mode = "keyframes"`.
3. Preserve semantic role, instruction, exclusion, source revision, stable node/asset identity, and order only in
   sanitized Revid lineage/prompt context. Never project per-image semantic metadata as Agnes typed fields and never
   silently reinterpret character/scene/prop references as temporal keyframes.
4. Reject semantic multi-image fusion before generation task, quota, compact job, provider dispatch, or Canvas
   mutation. A previously composed Revid-owned frame may enter the existing single-image path only after an
   independently explicit Image 2.0 action; T6-024 does not create or auto-run that action.
5. Preserve the T6-013 official Video V2.0 contract: `agnes-video-v2.0`, ratio/clarity/duration normalization,
   `negative_prompt` at top level, `num_frames <= 441` and `1 + 8n`, `480p`/`720p`/`1080p` product bands, and
   version-gated `resolution` compatibility. Product clarity must otherwise compile to capability-authoritative
   width/height.
6. Preserve opaque `video_id`, exact bound-job status/result retrieval, provider-owned actual dimensions/result
   metadata, owned media ingestion, same-card materialization, template lineage, and current typed Canvas
   command/history/autosave authority.
7. Add provider-free backend and browser evidence for legal modes, conflicting/malformed/semantic input rejection,
   stale asset/template lineage, unsupported status/result boundaries, persisted Video parameters, and zero
   unintended mutation.
8. Record that T6-024 formally replaces the useful provider-valid boundary of provisional old T6-015 without
   fabricating an old Task, status, or REPORT.

## Non-goals

- No Agnes semantic character/scene/prop multi-image fusion, per-image provider role/instruction/exclusion fields,
  nine-reference boundary, or silent semantic-to-keyframe conversion.
- No automatic or implicit Image 2.0 precomposition and no Image provider execution.
- No T6-025 WorkflowRun, dependency runner, batch orchestration, explicit run API, or third provider/job path.
- No T6-026 version diff, compatible upgrade, clone, or detach.
- No T6-027 compatibility retirement, legacy payload/result removal, release proof, or final Human journey acceptance.
- No rewrite of T6-017 through T6-023 frozen schema, persistence, lifecycle, preflight, instantiate, UI, Script/Image,
  Canvas patch, same-card, compact job, or provider authorities.
- No real/paid provider call, secret/env/provider-raw/prompt/source-content/user-owned evidence access, external
  account, migration, user/production database mutation, destructive operation, or automatic generation.

## Acceptance criteria

1. Focused backend/frontend tests first observe the missing provider-valid template Video compiler and fail for that
   reason before production implementation.
2. Exact compiler fixtures produce only text, top-level single-image, or ordered-keyframe Agnes Video requests; the
   three modes are mutually exclusive and all unknown/conflicting fields fail closed.
3. Semantic role/instruction/exclusion/order remains sanitized Revid lineage/prompt context and never appears as
   unsupported Agnes typed image fields.
4. Character/scene/prop multi-reference input is never reinterpreted as keyframes. It either references one already
   owned explicit precomposition result or fails before task/quota/job/provider/Canvas mutation.
5. Current capability and adapter contracts authoritatively validate model, ratio, clarity, duration,
   `negative_prompt`, frame count, width/height, and version-gated `resolution`; unsupported combinations do not
   downgrade to different semantics.
6. Template/version/instance/step/node/shot lineage and exact asset source revision are validated before dispatch;
   stale, foreign, malformed, or mismatched facts return bounded sanitized errors.
7. Unknown provider status, conflicting terminal URL/result identity, malformed result, and duplicate submit remain
   fail-closed while `video_id` stays opaque and successful media retains owned-ingestion/same-card authority.
8. Provider-free compiler/adapter/API tests, related regression, fresh production build, built-artifact browser
   proof, state validator, diff/security audit, exact-path staging, one conventional commit/push, and remote parity
   are recorded.
9. Machine browser/build evidence is not described as Human acceptance; final program-level Human visual,
   interaction, and journey acceptance remains T6-027.
