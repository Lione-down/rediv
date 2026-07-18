# Agnes Provider Integration

## Contract source

The backend owns the Agnes transport contract. Frontend code consumes Revid capabilities and never constructs provider payloads.

Current contract facts were checked on 2026-07-18 against the official Agnes documentation and model catalog:

- text: `agnes-2.0-flash`, `POST /v1/chat/completions`;
- image: `agnes-image-2.1-flash`, `POST /v1/images/generations`;
- video submit: `agnes-video-v2.0`, `POST /v1/videos`;
- video poll: `GET /agnesapi?video_id=...`.

Sources:

- https://agnes-ai.com/doc/agnes-20-flash
- https://agnes-ai.com/doc/agnes-image-21-flash
- https://agnes-ai.com/doc/agnes-video-v20
- https://github.com/AgnesAI-Labs/AgnesAI-Models/blob/main/MODEL_CATALOG.md

`core/agnes_contract.py` is the single resolved source for base URL, model IDs, endpoint paths, request adapters, and safe provider error classification. Settings may override the catalog values, and both the provider and capability APIs consume the same resolved contract.

## Request adapters

Each media type has an allowlisted adapter:

- text accepts model, messages, temperature, and stream;
- image accepts prompt, `size`, aspect ratio, and optional reference images under `extra_body.image`;
- video accepts prompt, dimensions, frames, frame rate, mode, and the documented single-image or keyframe forms;
- video polling accepts only the documented `video_id` query parameter.

Arbitrary frontend/provider passthrough is not supported.

## Image references

Agnes accepts public URLs or Data URIs. Revid validates references before provider submission:

- absolute public HTTPS URLs without credentials are preserved;
- an owned canonical `/uploads/{user_id}/{uuid}.{ext}` reference is resolved under the configured local storage root and encoded as a bounded Data URI;
- cross-user, traversal, symlink, missing, unsupported, private-network, and oversized references fail before any provider call;
- Data URI payloads must never be logged or persisted in task error metadata.

The default local reference limit is 20 MiB and is controlled by `agnes_reference_image_max_bytes`.

## Safe provider errors

Provider failures are converted to `AgnesProviderError`. Only bounded, allowlisted metadata is retained:

- stable code;
- safe message;
- provider request/correlation ID when supplied;
- retryability;
- bounded retry delay when supplied.

Authorization headers, API keys, raw request bodies, prompts, and base64 payloads are redacted. Current stable codes are:

| Code | HTTP class | Retry |
| --- | --- | --- |
| `invalid_request` | 400/422 | no |
| `unsupported_parameter` | 400/422 | no |
| `provider_rejected` | 400/422 | no |
| `rate_limited` | 429 | yes |
| `provider_unavailable` | 503 | yes |
| `timeout` | 504 | yes |

Repeated submissions with the same effective fingerprint after a deterministic provider rejection are blocked for the configured guard window until the user changes effective input or parameters. Transient failures remain manually retryable.

## Task and quota behavior

- generation admission, idempotency, and quota reservation occur before provider work;
- a failure keeps a durable failed task with only safe error metadata;
- failed or stale work does not create an asset or consume quota;
- video polling uses the same typed error and task-state rules as submission;
- malformed success payloads fail closed as provider response errors.

## Verification boundary

Unit, mock-route, disposable-MySQL, and browser-fixture evidence do not prove the real Agnes account or provider is healthy. A real text/image/video smoke requires explicit Human authorization for the exact call class and must not expose credentials or paid payload content.
