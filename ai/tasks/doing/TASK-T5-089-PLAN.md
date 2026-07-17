# TASK-T5-089 Plan

- State: `DONE`
- Objective: establish and deliver the smallest truthful Revid-owned audio generation and audio-driven video unit, with fail-closed production capability and mock/contract evidence before any Human-gated provider execution.

## Unit 0 - Audit and contract decision

- Status: `completed`

1. Read current T5-086 through T5-088 capability/task/asset evidence and inspect existing audio/media types, Canvas compatibility, provider adapters, generation request schemas, quota/task/result lifecycle, cancellation/recovery, and browser fixtures.
2. Determine whether audio generation or audio-driven video has an already truthful executable route without secrets, paid calls, migration, unknown storage, or semantic overload of the existing image/video provider task.
3. Lock the v1 boundary, ownership rules, Human gates, and minimum test matrix before adding business code.

Success gate: Task/PLAN/PROGRESS and CURRENT/ROADMAP identify T5-089 as the only active Task; real-provider uncertainty and fail-closed behavior are explicit.

### Locked v1 boundary

- Revid already accepts authenticated project-scoped audio uploads (`flac`, `m4a`, `mp3`, `ogg`, `wav` and bounded browser-supported containers), preserves user/project/origin-Canvas ownership, and exposes native `<audio>` playback in Project Resources. Canvas has an `asset/audio` subtype but node-local presentation is intentionally placeholder-only; this is not generated-audio or audio-driven-video evidence.
- Current generation capability v3, frontend parser/request context, `/api/image-generate`, `/api/video-generate`, `generation_tasks` schemas/APIs, quota balances/ledger, and generated-asset endpoint are exact image/video-only. The asset endpoint explicitly rejects audio as generated media. No audio provider adapter, audio quota type, audio task lifecycle, durable cancel/resume, output-audio lineage, or audio-driven-video reference contract exists.
- Existing video provider/task semantics must not be overloaded: they consume image references, reserve video quota, persist video tasks/assets, and cannot truthfully represent audio synthesis or audio-driven video. Adding a durable audio quota/task/output schema, worker/storage path, or provider route would require a separate Human Owner gate and likely migration.
- T5-089 v1 therefore extends the authenticated generation capability document backward-aware to declare a strict audio contract with `execution_mode: unavailable`, zero supported/provider modes, no audio quota, and no durable task. A pure frontend preflight will validate selected current-Canvas script/audio/video sources and demonstrate mock-only capability parsing, but production must reject before Canvas command/history/autosave, quota, task, asset, or provider mutation.
- A narrow existing-Slash-Palette preflight surface may expose the blocked contract only when the selected sources match an audio-generation or audio-driven-video intent. It must retain native resource playback, 375px review-only behavior, keyboard/accessibility, and no mutation. It cannot claim a generated audio file, synchronized rendered video, or real task progress.

## Unit 1 - Strict fail-closed contracts and mock evidence

- Status: `completed`

1. Implement only the audit-approved versioned request/capability/task/asset contracts and pure/mock behavior.
2. Prove source/project/canvas/user scope, media compatibility, ordered input semantics, quota/task/provider non-mutation on unavailable capability, and truthful mock-only lifecycle.
3. Add the narrowest existing-UI integration only if it preserves responsive, keyboard, accessibility, history/autosave, and result-lineage boundaries.

Success gate: unsupported production audio/audio-driven-video is rejected before quota/task/asset/provider mutation; mock evidence cannot be mistaken for real execution.

### Implemented v1 boundary

- Backend capability contract v4 adds one exact `audio` v1 section. Production declares `execution_mode: unavailable`, `model: null`, zero supported/provider modes, unavailable quota, and unavailable durable task/cancel/resume. No API route, quota column, task/media schema, asset creation, provider adapter, worker, or migration was added.
- Frontend v1/v2/v3 capability parsing remains backward-aware; v4 requires the strict audio section. The new pure preflight accepts only one bounded canonical script for `text-to-audio`, or exactly one project-owned active audio asset plus one project-owned active video asset for `audio-driven-video`. It validates Canvas/project/user/asset/URL scope and duplicate/count/type drift before considering capability.
- A synthetic `mock-only` capability is accepted only with the exact Revid mock model, zero provider modes, unavailable quota, and unavailable durable task. It proves source contracts without producing an audio/video, task, quota mutation, asset, provider request, or Canvas mutation. Production capability remains unavailable and returns `capability_unavailable` after valid source inspection.
- The existing Slash Palette exposes a narrow async desktop preflight only for a valid script or audio/video pair. The graphite/violet panel has deterministic close-button focus and Escape close, names its intent and blocked capability, is absent at 375px review-only, and creates no graph/history/autosave/provider/quota/task/asset mutation.

## Unit 2 - Regression and closure

- Status: `completed`

1. Run focused tests first, then adjacent backend/frontend regression, build, browser/visual/accessibility, hygiene, and classified guarded performance evidence.
2. Write REPORT and close Task/PLAN/PROGRESS/CURRENT/ROADMAP only after every non-deferred acceptance criterion has evidence.
3. Exact-stage, commit, and push only T5-089-owned files.

Closure evidence: focused backend passed `22`; focused Chromium passed `21/21`; adjacent Chromium passed `71/71`; repaired Storyboard suite passed `15/15`; final functional Chromium passed `466/466`; final build transformed `4,914` modules. The independent SwiftShader-only 200/300 title measured `52.001311281480724 FPS` and `33.399999999999636ms` p95 against unchanged `55 FPS` / `33ms` thresholds while all other metrics remained in bounds; it is classified in the REPORT rather than treated as a product pass.

## Stop rules

- Stop before `.env`/secret access, paid/provider calls, external accounts, installation, real user-media processing, destructive overwrite, migration, worker/storage deployment, second engine/store, cross-Canvas edge, mobile editing, or incompatible UX.
- Preserve `.codex/`, `.hermes/plans`, `output/`, and `TASK-T5-091.md`; never stage them.
