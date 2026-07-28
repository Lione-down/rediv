# REPORT-T6-024 - Provider-valid Video compiler and old T6-015 replacement

- Task: [TASK-T6-024](../tasks/todo/TASK-T6-024.md)
- Plan: [TASK-T6-024-PLAN](../tasks/doing/TASK-T6-024-PLAN.md)
- Progress: [TASK-T6-024-PROGRESS](../tasks/doing/TASK-T6-024-PROGRESS.md)
- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-29`
- Activation baseline: `c79bf1e8c0deac88f4fa1111ba8dd8a3b7327d7c`

## Delivered

T6-024 adds one pure provider-projection boundary for the current Agnes Video V2.0 contract. It accepts current
capability-normalized Video intent plus already scope-validated owned image URLs and emits exactly one of:

- text-to-video with no image field;
- image-to-video with one top-level `image`;
- two through eight explicitly temporal keyframes in `extra_body.image[]` with `mode = "keyframes"`.

The existing Video API now dispatches only through this validated projection while retaining the current generation
transaction, quota admission, idempotency, Agnes adapter, opaque `video_id`, status/result parser, owned media
ingestion, and same-card result authority. The compiler itself sends no HTTP and owns no Canvas, quota, task, job,
WorkflowRun, or transaction state.

Template-backed Video cards carry the exact template ID/version, instance ID, deterministic instance-step ID, step
ID, stable Script node ID, and shot ID through selected-shot authoring, current Canvas validation, request context,
transport, and sanitized generation-task snapshot. Stale, foreign, mismatched, malformed, or drifted card lineage
returns a bounded 409 before generation start.

## Provider truthfulness and replacement boundary

Current capability normalization remains authoritative for `agnes-video-v2.0`, ratio, clarity, duration,
`negative_prompt`, frame count, width/height, and version-gated resolution compatibility. `num_frames` remains
bounded to `441` and `1 + 8n`; product clarity remains `480p`, `720p`, or `1080p`; ordinary provider requests use
capability-authoritative width/height and do not invent an unsupported resolution field.

Semantic character/scene/prop role, instruction, exclusion, and source-revision fields remain Revid metadata and are
not legal Agnes typed image fields. Semantic multi-reference capability claims, semantic bindings, mixed modes, and
nine-reference payloads fail closed instead of becoming keyframes. A separately and explicitly produced owned Image
2.0 precomposition may use the existing single-image path, but T6-024 neither creates nor runs that action.

This formally replaces the provider-valid remainder of provisional old T6-015 without fabricating an old Task,
status, or REPORT.

## TDD and verification

| Gate | Result |
|---|---|
| Observed backend RED | `1 error`, missing compiler integration symbol |
| Observed frontend RED | `1 failed`, missing template Video request lineage |
| Focused compiler/API GREEN | `6/6` |
| Focused semantic fail-closed | backend `4/4`; Chromium focused group included in `3/3` |
| Related backend Video/Agnes/parameters/status/result | `67 passed, 53 subtests passed` |
| Related Chromium Video/parameters/service/template Script/Image | `43/43` |
| Fresh production build | PASS, `5,048 modules transformed` |
| Fresh built-artifact/provider-free Chromium | `14/14` |
| Python compile, project-state validator, UTF-8, diff/security checks | PASS |

The attempted full Chromium run exceeded its `1,200s` operational budget without a terminal summary and is not
claimed as PASS. A parallel backend shard experiment was discarded because concurrent shards interfered through
shared MySQL/upload fixtures; it is not classified as product evidence. The valid focused and related suites contain
the T6-024 changed behavior and passed without a T6-024 failure.

## Security and scope audit

- No real or paid provider call, secret/env access, external account action, migration, destructive operation, or
  user/production data mutation occurred.
- No provider raw response, prompt/source content, user-owned evidence, environment file, database artifact, or
  protected untracked path was read, staged, or committed.
- No T6-025 WorkflowRun, T6-026 upgrade/clone/detach, T6-027 compatibility retirement, third provider/Canvas
  authority, or automatic generation path was introduced.
- Exact-path staging and the final index exclude `.codex/`, `.hermes/`, `ai/evidence/t6-012/`, `output/`,
  `storage/`, and `test-results/`.

## Acceptance assessment

Every non-deferred T6-024 acceptance criterion is satisfied. Provider-free machine build/browser evidence is not
Human visual, interaction, or journey acceptance. Final program-level Human acceptance remains T6-027. T6-025 is
dependency-ready but remains inactive.
