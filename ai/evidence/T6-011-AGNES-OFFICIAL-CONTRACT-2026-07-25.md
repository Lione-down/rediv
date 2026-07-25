# T6-011 Agnes AI official contract - verified 2026-07-25

- Status: `FROZEN FOR T6-011 IMPLEMENTATION`
- Sole technical fact source: [Agnes AI official documentation](https://agnes-ai.com/zh-Hans/docs/overview)
- Verification date: `2026-07-25`
- Boundary: documentation-only verification; no API key access and no real or paid provider call.

## Shared API

- Base URL: `https://apihub.agnes-ai.com/v1`
- Authentication: `Authorization: Bearer <API_KEY>`
- Content type: `application/json`
- Provider responses are input to the backend adapter only. Revid compact v2 responses must not expose provider raw objects.

Official source: [Overview](https://agnes-ai.com/zh-Hans/docs/overview), [Quickstart](https://agnes-ai.com/zh-Hans/docs/quickstart).

## Text

All currently documented text models use:

`POST https://apihub.agnes-ai.com/v1/chat/completions`

| Model ID | Availability | Documented input/output capability |
|---|---|---|
| `agnes-2.0-flash` | stable | text and public image URL input; text output; chat, multi-turn, tools, agent workflows, coding, streaming |
| `agnes-2.5-flash` | gray release; not available to every account/key | API-compatible with 2.0 Flash; text and public image URL input; text output; enhanced coding/agent/tool/multimodal behavior |
| `agnes-2.5-pro-alpha` | paid reasoning model; released 2026-07-24 | text and public image URL input; text output; advanced reasoning, coding, long context, tools, streaming |

Revid rules:

- Backend model availability remains authoritative. Documentation presence alone never makes a model allowed for the current deployment or API key.
- The official availability of `agnes-2.5-flash` remains gray/key-dependent. For this T6-011 deployment, the Human Owner explicitly requires the backend authority to include it in the allowed text-model list; this product decision does not claim that every Agnes key has provider-side access.
- `agnes-2.5-flash` is therefore returned as `allowed` by Revid capability DTOs and is admitted at the compact v2 job boundary. Any provider-side availability failure remains a normalized bounded failure and never authorizes a fallback model.
- `agnes-2.5-pro-alpha` may be represented as a known paid model capability, but T6-011 must not call it; real/paid execution remains Human-gated.
- Unknown or unavailable text model IDs fail before job/quota/provider/document/history/autosave mutation.

Official sources: [Agnes 2.0 Flash](https://agnes-ai.com/zh-Hans/docs/agnes-20-flash), [Agnes 2.5 Flash](https://agnes-ai.com/zh-Hans/docs/agnes-25-flash), [Agnes 2.5 Pro Alpha](https://agnes-ai.com/zh-Hans/docs/agnes-25-pro-alpha).

## Image

Both currently documented image models use:

`POST https://apihub.agnes-ai.com/v1/images/generations`

### Agnes Image 2.0 Flash

- Model ID: `agnes-image-2.0-flash`
- Workflows: text-to-image, image-to-image/edit, multiple-image composition.
- Required text-to-image fields: `model`, `prompt`, `size`.
- Image edit/composition inputs: `extra_body.image: string[]`.
- Output selection: `extra_body.response_format: "url" | "b64_json"`.
- URL result: `data[0].url`.
- Base64 result: `data[0].b64_json`.

### Agnes Image 2.1 Flash

- Model ID: `agnes-image-2.1-flash`
- Workflows: text-to-image and image-to-image/edit with high-density/complex composition optimization.
- Required fields: `model`, `prompt`, `size`.
- Recommended size tiers: `1K`, `2K`, `3K`, `4K`.
- Supported ratios: `1:1`, `3:4`, `4:3`, `16:9`, `9:16`, `2:3`, `3:2`, `21:9`.
- Image edit inputs: `extra_body.image: string[]`.
- Output selection remains `extra_body.response_format`.

Revid rules:

- `response_format` is never sent at the request root.
- Image input arrays are projected into `extra_body.image`.
- Unknown size tier, ratio, output format, or model capability fails closed or remains backend-disabled; the frontend does not invent provider normalization.
- Base64 provider media remains outside compact polling responses.

Official sources: [Agnes Image 2.0 Flash](https://agnes-ai.com/zh-Hans/docs/agnes-image-20-flash), [Agnes Image 2.1 Flash](https://agnes-ai.com/zh-Hans/docs/agnes-image-21-flash).

## Video

- Model ID: `agnes-video-v2.0`
- Create: `POST https://apihub.agnes-ai.com/v1/videos`
- Preferred query: `GET https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>`
- Preferred query with explicit non-default model: append `&model_name=agnes-video-v2.0`.
- Legacy-compatible query: `GET https://apihub.agnes-ai.com/v1/videos/<TASK_ID>`.
- Workflows: text-to-video, image-to-video, keyframe animation.
- Image-to-video input: root `image: string`.
- Keyframe inputs: `extra_body.image: string[]` with `extra_body.mode: "keyframes"`.
- Documented mode examples: `ti2vid`, `keyframes`.
- Resolution tiers: `480p`, `720p`, `1080p`; response `size`, `seconds`, and `metadata.size_mapping` are authoritative for normalized output.
- `num_frames <= 441` and must follow `8n + 1`; `frame_rate` supports `1..60`.

### Create response

The adapter accepts only the documented fields it needs:

```json
{
  "id": "task_YOUR_TASK_ID",
  "task_id": "task_YOUR_TASK_ID",
  "video_id": "video_YOUR_VIDEO_ID",
  "object": "video",
  "model": "agnes-video-v2.0",
  "status": "queued",
  "progress": 0,
  "created_at": 1780457477,
  "seconds": "10.0",
  "size": "1280x768"
}
```

Mapping:

- Persist provider request identity using `video_id` for the preferred query path.
- Retain `task_id`/`id` only as bounded compatibility/recovery identity.
- Map `status` and integer `progress` into Revid's durable job stage/percent authority.
- Do not expose the provider response object.

### Query response

Exact documented statuses:

- `queued`
- `in_progress`
- `completed`
- `failed`

Exact progress contract:

- `progress` is an integer percentage.
- `queued` may report `0`.
- `completed` reports `100`.
- Unknown status, non-integer progress, progress below `0`, progress above `100`, or a terminal/state contradiction fails closed.

Completed media:

- The final playable URL exists at `metadata.url` only when `status == "completed"`.
- `metadata.url` is extracted into the durable compact result projection.
- `metadata.size_mapping` may inform normalized output dimensions but provider metadata is not returned raw.
- `error` is provider failure input only and must be normalized into Revid's bounded error contract.

Official source: [Agnes Video V2.0](https://agnes-ai.com/zh-Hans/docs/agnes-video-v20).

## Required Revid implementation boundary

1. Backend capability lists are the only frontend model authority.
2. Provider adapter validates finite model IDs, finite status vocabulary, integer percent range, terminal consistency, and completed `metadata.url`.
3. Durable compact v2 job DTOs expose normalized stage/percent and bounded media result identity/URL only.
4. Frontend polls only current-Canvas/bound Revid job endpoints and maps normalized progress monotonically.
5. Provider raw, `metadata` raw, request snapshots, fingerprints, full history, duplicated results, and Base64 media remain excluded.
6. Audio Generation remains visible but has no executable model unless backend authority explicitly returns an allowed audio-capable model; preflight fails before every mutation otherwise.
