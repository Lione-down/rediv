# TASK-T5-089 - Audio generation and audio-driven video capability contracts

- State: `DONE`
- Completion: implementation and all non-deferred acceptance evidence are recorded in `ai/reports/REPORT-T5-089.md`. The guarded SwiftShader-only 200/300 metric title remains transparently classified without threshold weakening.
- Objective: add Revid-owned audio generation and audio-driven video capability contracts that are explicit about provider, quota, task, asset, and playback truth; implement mock/contract behavior first and fail closed unless an approved executable capability exists.
- Dependency: `T5-088 - DONE - PASS` at committed and pushed baseline `da927e3dd3cd0d59fa5581483c758bd580ea118a`.

## Product direction

- Reproduce only public professional audio-generation and audio-driven-video capability patterns. Do not copy LibTV private source, prompts, schemas, brand, iconography, copy, or visual assets.
- Preserve Revid's graphite-black/violet Canvas, Leafer engine, typed ports, Canvas-local result branching, Storyboard projection, history/autosave, native auth/project/canvas/generation contracts, and 375px review-only boundary.
- Audio source, generated result, audio-to-video intent, capability, quota estimate/reservation, provider task, error, cancel/recovery, output asset ownership, and playback semantics must be exact, versioned, authenticated/scoped, inspectable, and fail closed.
- A UI preview, mock lifecycle, uploaded audio, or existing video playback must never claim real audio generation or audio-driven video execution.

## Scope

- Audit existing audio asset/upload/playback support, media type validation, Canvas node/port compatibility, generation capability/versioning, quota/task/result lifecycle, provider interfaces, cancellation/recovery, and test fixtures without reading `.env`, starting services, or invoking providers.
- Define the smallest Revid-owned versioned contracts for audio generation and audio-driven video. Reuse current auth/project/canvas/generation/quota/task authority only when semantic truth is preserved; reject malformed, stale, foreign, unsupported, or capability-drift input before task/quota/asset/provider mutation.
- Add local/mock contract and presentation evidence only after the audit locks source/target ownership, result lineage, task status, quota behavior, audio/video intent, preview limits, and real-provider gate. Preserve originals and create only Canvas-local downstream results if a mutation is already truthful and authorized.
- Add backend execution only if current contracts already prove safe provider routing, quota reservation/refund, idempotency, cancellation, output lineage, storage, and failure cleanup without a migration, secret, paid call, or incompatible UX. Otherwise expose zero executable capabilities and fail closed.

## Acceptance criteria

1. Audio-generation and audio-driven-video contracts are versioned, exact, authenticated/scoped, backward-aware, and fail closed for malformed, foreign, stale, unsupported, or provider-overclaiming requests.
2. Audio source/result ownership, media type, project/canvas identity, input ordering, audio-to-video semantics, preview/playback meaning, output lineage, and original preservation are explicit.
3. Capability discovery, quota estimate/reservation/refund behavior, task status/progress/cancel/recovery, provider eligibility, errors, and output assets are truthful. No UI can silently create a paid/provider job or fabricate an executable task.
4. Mock/contract proof completes before Human-gated real-provider work. A missing provider, quota, task, storage, cancellation, or output contract must be visibly unavailable rather than simulated as production success.
5. Existing Canvas history/autosave/reload, typed ports, result branching, Storyboard projection, video playback, responsive layout, keyboard ownership, reduced motion, accessibility, and 375px review-only behavior remain non-regressive.
6. Focused tests, relevant backend/frontend regression, build, browser/visual/accessibility checks, and guarded 200/300 evidence are classified without threshold weakening.
7. No real provider/paid call, secret access, external account, installation, migration, destructive media operation, UI redesign, or cross-Canvas graph edge is introduced without explicit Human Owner authorization.

## Non-goals

- No real music, speech, sound-effect, lip-sync, dubbing, audio-to-video provider call, paid generation, new provider account, codec/transcoding installation, background worker deployment, storage redesign, automatic media overwrite, mobile graph editing, timeline redesign, or Agent/Skill work.
- No irreversible schema migration, cross-project/cross-Canvas audio batch, fake quota deduction, fabricated terminal task, or output asset before a truthful approved contract exists.

## Human gates

- Real audio/video providers, paid calls, external accounts, real secrets, storage/worker deployment, user-media processing, destructive operations, irreversible migrations, and incompatible UX require explicit Human Owner authorization.
