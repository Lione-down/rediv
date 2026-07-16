# REPORT-T5-075 - Provider-backed generation parameters and reference intent

## Result

`DONE - PASS`

Creators can now control ordinary image ratio, video duration, and truthful video reference intent from the Canvas Inspector. The backend remains the single source of capability values, validates the final combination before any task/quota/provider mutation, and stores an immutable sanitized parameter snapshot on every new image/video task.

## Backend delivery

- `GET /api/generation-capabilities` is authenticated and versioned.
- Ordinary images use backend-owned `size = 1K` plus one of the eight documented Agnes ratios; legacy nodes resolve to `4:3`.
- Visual asset recipes remain fixed to one canonical input and exact `1024x768` (`4:3`) output with no user ratio leak.
- Video supports only documented `text-to-video`, one-image `image-to-video`, and two-to-eight ordered `keyframes` modes.
- Video presets map exactly to `81/121/241/441` frames at 24 FPS for approximate `3/5/10/18` seconds.
- Revision `d0e1f2a3b4c5` adds nullable JSON `generation_tasks.request_parameters` with a non-empty comment; legacy rows remain valid.
- New image/video tasks snapshot contract version, media type, model, size/ratio or mode/duration/frame/FPS/dimensions, ordered image IDs, and recipe identity where applicable. Prompts, provider URLs, tokens, and secrets are excluded.

## Frontend delivery

- Node preferences persist under `contentData.generation_parameters` version 1 through one typed command/history/autosave boundary.
- Parameter changes support exact one-step undo/redo and survive reload; running/queued nodes and the active request disable or reject edits.
- Inspector controls, readonly summaries, preflight, POST payload, included/excluded reference rows, run history, and result details share one resolver.
- Legacy video nodes with zero/one valid reference resolve honestly; two-plus-reference legacy nodes block until a mode is explicitly chosen.
- Image-to-video selects exactly one valid connected primary and marks all others excluded; keyframes retain existing R order.
- Result branches persist explicit one-image video intent. Selection composition shows the resulting mode before insertion and persists explicit keyframe intent when confirmed.
- Capability load failure, stale saved values, disconnected primary references, and invalid keyframe counts disable generation without provider or quota mutation.

## Verification

| Gate | Result |
|---|---|
| Backend focused contract/migration/provider/transaction | PASS, 27 tests + 14 subtests |
| Backend broader image/video/provider regression | PASS, 40 tests + 14 subtests |
| Frontend parameter contract and browser behavior | PASS, 6/6 |
| Related preflight/order/selection/result-branch regression | PASS, 31/31 |
| Production frontend build | PASS, 4,830 modules |
| Backend compileall and Alembic graph | PASS, `d0e1f2a3b4c5` single head |
| Undo/redo/reload and one PATCH per parameter command | PASS |
| 1440/920/375 responsive, readonly, keyboard, ARIA review | PASS |
| UTF-8, whitespace, file-size, sensitive-path, owned-scope review | PASS |

## Visual evidence

- `output/playwright/t5-075-generation-parameters/image-ratio-preflight-1440x900.png`
- `output/playwright/t5-075-generation-parameters/video-keyframes-preflight-920x900.png`
- `output/playwright/t5-075-generation-parameters/readonly-image-parameters-375x812.png`

## Explicit boundaries

- No real Agnes call was made. Provider fidelity is proven at the offline payload boundary only.
- No migration was applied to user/runtime data and no user schema was downgraded.
- Progress visibility, durable percentage/stage, and pending output reservation remain exclusively owned by T5-076, T5-077, and T5-078.
