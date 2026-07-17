# TASK-T5-088 Plan

- State: `DONE - PASS`
- Objective: determine and deliver the smallest safe video-editing unit that is truthful about preview versus durable export and preserves Revid's existing Canvas/task/asset contracts.

## Unit 0 - Audit and contract decision

- Status: `completed`

1. Read current state, prior video/result/task reports, active source boundaries, and existing test fixtures.
2. Inventory video ownership, source references, playback/preview, trim/frame capture, task lifecycle, capability discovery, asset persistence, export/download endpoints, and FFmpeg availability without reading `.env` or starting services.
3. Record whether a durable backend export can be represented truthfully without schema migration, worker deployment, user-media processing, or unknown provider/cost semantics.
4. Create RED contract tests only after the decision locks a minimal, versioned scope.

Success gate: Task/PLAN/PROGRESS and CURRENT/ROADMAP identify T5-088 as the only active Task; durable export uncertainty and all Human gates are explicit.

### Locked v1 boundary

- The local machine has FFmpeg/FFprobe 8.1.1 available, but Revid contains no FFmpeg invocation, export endpoint, edit job schema, worker/queue, cancel endpoint, or output-asset lineage contract. Discovery used only `-version`; no tool was installed or run over media.
- Existing `/api/video-generate` creates one provider-backed generation task, has provider polling/persistence semantics, and is not a truthful video-edit/export task. `generation_tasks` only exposes read/list APIs with statuses `queued/running/succeeded/failed/timed_out`; it has no authenticated cancel/resume/export lifecycle. Do not overload it.
- Existing assets correctly establish user/project/origin-Canvas ownership and video upload validation, while Canvas video UI supports native playback, CORS-readable keyframes, and explicit still-frame capture. Playback-only/CORS failure must stay local and cannot be treated as an editable/exportable source.
- T5-088 v1 therefore starts frontend-only: a versioned pure `video-edit-preflight` plan over selected canonical active-Canvas video asset/result nodes. It will make trim bounds, concat order, source ownership, native sequence preview eligibility, and export unavailability inspectable. It creates no edit asset, task, quota reservation, provider call, Canvas command/history/autosave write, or cross-Canvas relation.
- Native trim/concat preview can show and seek existing sources only; it must never claim a rendered composite. Export is explicitly unavailable until a Human Owner authorizes a bounded backend/FFmpeg task contract covering safe input paths, output staging/storage, resource limits, cancellation, idempotency, progress, original preservation, output lineage, and failure cleanup.

## Unit 1 - Bounded preview/edit contract

- Status: `completed`

1. Implement only the selected versioned trim/concat/preview intent and ownership validation.
2. Preserve original assets and existing Canvas/history/autosave/result lineage; prove failure is zero mutation.
3. Keep the UI narrow, accessible, reduced-motion-safe, and absent from 375px editing.

Success gate: an inspectable edit plan or preview can neither create a provider request nor claim durable export success.

## Unit 2 - Export/FFmpeg contract boundary

- Status: `completed`

1. Implement a durable export path only if the audit proves a current truthful backend task contract; otherwise deliver a fail-closed capability decision with mock/contract evidence.
2. Prove cancellation, idempotency, output ownership/lineage, progress, error, and resource limits before any real media execution.
3. Stop at the Human gate for installation, worker deployment, user-media processing, paid/provider work, schema migration, or unknown storage semantics.

Success gate: no production export behavior is claimed without an exact owner-authorized backend contract.

Decision: no existing truthful backend contract exists. T5-088 v1 exposes a strict `backend_export_unavailable` result and does not call FFmpeg, provider, task, asset, quota, or Canvas APIs. Real export remains a Human Owner gate recorded in `REPORT-T5-088.md`.

## Unit 3 - Regression and release handoff

- Status: `completed`

1. Run focused tests first, then relevant Canvas/video/backend regression, build, browser/visual/a11y, hygiene, and classified guarded performance evidence.
2. Write REPORT and close Task/PLAN/PROGRESS/CURRENT/ROADMAP only after every non-deferred acceptance criterion has evidence.
3. Exact-stage, commit, and push only T5-088 owned files.

Verification evidence before the fresh review: focused Chromium passed 11/11, relevant Canvas/video/action/generation regression passed 54/54, production build passed 4,907 modules, and final functional Chromium passed 471/471. The separately guarded SwiftShader mock performance title measured 50.88 FPS / 33.4ms p95 against unchanged limits and is transparently classified in `REPORT-T5-088.md`; no Canvas hot path changed and no threshold was weakened.

Fresh-review closure: complete. The video-edit panel now focuses its close control on mount and owns Escape close. Rebuilt production output passed 4,907 modules; focused Chromium passed 11/11; relevant Canvas/video/action/generation regression passed 54/54; final functional Chromium passed 471/471 in 8.7 minutes. The new guarded SwiftShader mock run measured 50.72477779708455 FPS and 33.400000000001455ms p95 against unchanged 55 FPS/33ms limits, with 419ms stable render, 12.3ms pointer p95, 9.73 minimap updates/s, and the other two tests passing. The output reports no hardware acceleration; this is retained as an environment-sensitive exception, not threshold weakening or a Canvas hot-path regression.

Release closure evidence: implementation, focused/browser/build/regression/performance classification, hygiene, and exact staged review are complete. Commit and push only the reviewed T5-088-owned set; T5-089 may activate only after the pushed baseline is verified.

## Stop rules

- Stop before secrets, paid/provider calls, external accounts, FFmpeg installation, real user-media processing, destructive media overwrite, migration, second engine/store, cross-Canvas edge, mobile editing, or incompatible UX.
- Preserve `.codex/`, `.hermes/plans`, `output/`, and `TASK-T5-091.md`; never stage them.
