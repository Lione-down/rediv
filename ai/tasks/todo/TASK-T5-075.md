# TASK-T5-075 - Provider-backed generation parameters and reference intent

- State: `DONE - PASS`
- Objective: let creators explicitly choose image aspect ratio, video duration, and video reference intent while preserving exact preflight, backend validation, immutable run diagnostics, and legacy compatibility.

## Scope

- Add one authenticated backend-owned generation capability contract for supported image ratios, video modes, duration presets, frame mappings, dimensions, and reference limits.
- Add strict request normalization for ordinary image ratio and video duration/reference mode before task, quota, or provider mutation.
- Persist editable generation preferences under node `contentData.generation_parameters` through the existing typed command, autosave, and undo/redo boundary.
- Add nullable MySQL JSON `generation_tasks.request_parameters` with a non-empty comment and snapshot every new image/video run before the provider call.
- Keep ordinary image generation at internal `size = 1K`; default legacy ordinary image nodes to Revid-compatible `4:3`.
- Keep visual asset recipes fixed at recipe-owned `1024x768` (`4:3`), one canonical image reference, and no editable ratio override.
- Support explicit video `text-to-video`, `image-to-video`, and ordered `keyframes` semantics with server-owned `3/5/10/18` second mappings to `81/121/241/441` frames at 24 FPS.
- Show exact parameter and reference intent in Inspector preflight, readonly summaries, run history, and result diagnostics.

## Non-goals

- No progress percentage, pending result projection, Canvas engine replacement, in-place generation-to-media mutation, new worker/runtime, provider cancellation, model/size/seed/negative-prompt/audio controls, paid provider call, real secret access, or user/runtime migration.
- No invented semantic multi-image reference mode and no AIGCCanvasFlow source, style, icon, store, or component copying.

## Acceptance criteria

- `GET /api/generation-capabilities` is authenticated and returns one versioned backend-owned capability document.
- Unknown or stale ratios, durations, modes, disconnected primary references, and invalid keyframe counts fail honestly before task, quota, or provider mutation.
- Ordinary image requests send exact `size = 1K` and selected ratio; recipe requests reject overrides and preserve fixed recipe behavior.
- Video requests send zero images for text-to-video, one top-level image for image-to-video, or two-to-eight ordered keyframes in `extra_body.image` with `mode = keyframes`.
- Every new durable task exposes a sanitized immutable `request_parameters` snapshot; legacy rows remain nullable and no hidden prompt, provider URL, token, or secret is stored.
- Preference changes persist, reload, and support exact one-step undo/redo with one PATCH per deliberate command; T5-061 in-flight locking covers all new controls.
- Focused backend, migration, provider, transaction, and browser suites pass, followed by relevant regression, build, responsive/keyboard/ARIA review, diff, UTF-8, file-size, and sensitive-path audits.

## Provider evidence and boundaries

- Official Image 2.1 Flash documentation verified 2026-07-16: `https://agnes-ai.com/zh-Hans/docs/agnes-image-21-flash.md` lists size tiers `1K/2K/3K/4K` and ratios `1:1`, `3:4`, `4:3`, `16:9`, `9:16`, `2:3`, `3:2`, `21:9`.
- Official Video V2.0 documentation verified 2026-07-16: `https://agnes-ai.com/zh-Hans/docs/agnes-video-v20.md` defines top-level `image`, keyframe `extra_body.image`, `extra_body.mode = keyframes`, `num_frames <= 441`, and the `8n + 1` rule.
- Real provider execution remains an explicit Human Owner gate. Mock/provider-boundary tests verify request shape only.
- Migration verification is limited to owned disposable `revid_test_*` schemas; applying or downgrading user/runtime data requires separate authorization.

## Risks and guards

- Frontend and backend defaults can drift: capability parsing and request resolution must derive from the backend contract and fail closed on unknown values.
- Legacy multi-image video requests may retain API-boundary compatibility, but the new UI must not silently infer keyframes.
- Parameter changes must use the serialized action boundary and must not mutate running requests.
- Request snapshots are diagnostics, not replay commands; retry uses the node's current visible preferences.
