# TASK-T5-088 - Video edit, preview, export, and FFmpeg/backend contract decision

- State: `DONE - PASS`
- Report: `ai/reports/REPORT-T5-088.md`
- Release checkpoint: all implementation and verification evidence is retained locally; exact staging, commit, and push have not run.
- Objective: add Revid-owned, safe video trim, concat, preview, and export capability only after an explicit FFmpeg/backend task-contract decision; preserve existing Canvas/generation/project truth and never assume a destructive, provider, or paid execution model.
- Dependency: `T5-087 - DONE - PASS` at committed and pushed baseline `63924de6b6b24f557b952b57514190e1eba0614d`.

## Product direction

- Reproduce only publicly observable professional video-editing capability patterns. Do not copy LibTV private source, task schema, brand, iconography, copy, or visual assets.
- Preserve Revid's graphite-black/violet Canvas, typed ports, existing video generation/result behavior, Canvas-local result branches, Storyboard projection, history/autosave, and 375px review-only boundary.
- Preview and edit configuration must be explicit, project/canvas scoped, versioned, inspectable, and fail closed. No UI action may silently submit a provider, paid task, destructive overwrite, or cross-Canvas relation.
- Existing asset ownership, generation quota, task/result semantics, and backend authority remain source of truth. A preview is not proof of a durable export.

## Scope

- Audit current video result/asset playback, upload/frame capture, generation task, API, storage, browser codec, capability, cancellation, and export boundaries before choosing a contract.
- Decide, document, and implement the smallest truthful trim, concat, preview, and export contract. Prefer a mock/local configuration surface if the durable FFmpeg/backend task, storage, cancellation, progress, quota, or output-asset semantics are not already supported.
- Evaluate installed FFmpeg/runtime capability without installation, credentials, external calls, or destructive media processing. Add a backend worker/task contract only if it can preserve ownership, idempotency, cancellation, output lineage, and truthful failure behavior.
- Reuse existing Canvas command/history/autosave, result lineage, project asset ownership, task/result reconciliation, responsive/reduced-motion/accessibility patterns, and typed video edges. Do not add a second video engine, cross-Canvas edge, or unbounded browser processing path.

## Acceptance criteria

1. Video edit, preview, export, and any backend task contracts are versioned, exact, authenticated/scoped, backward-aware, and fail closed for malformed, foreign, stale, unsupported, or provider-overclaiming input.
2. Trim/concat input order, source asset ownership, temporal ranges, output type, preview semantics, and export intent are explicit; originals are never overwritten.
3. Any FFmpeg/backend decision records executable discovery, command/input/output safety, resource limits, cancellation, idempotency, progress, output lineage, storage, and error behavior. Unsupported durable execution fails closed.
4. Preview/configuration is zero provider/paid mutation. A real export cannot silently reserve quota, create an asset, or run a destructive/paid task.
5. Existing Canvas undo/redo/autosave/reload, video preview/playback, typed ports, result branches, Storyboard projection, responsive layout, keyboard ownership, reduced motion, and 375px review-only behavior remain non-regressive.
6. Focused tests, relevant backend/frontend regression, build, browser/visual/accessibility checks, and guarded 200/300 evidence are classified without threshold weakening.
7. No real provider/paid call, secret access, external account, installation, migration, destructive processing, UI redesign, or cross-Canvas graph edge is introduced without explicit Human Owner authorization.

## Non-goals

- No automatic video rendering, provider video generation, paid export, background worker deployment, transcoding installation, codec download, cloud storage redesign, timeline redesign, audio work, or Agent/Skill work.
- No irreversible schema migration, overwrite of original media, real FFmpeg execution over user media, cross-project/cross-Canvas edit batch, or fabricated task progress before a truthful contract and Human gate exist.

## Human gates

- Installing or operating FFmpeg over user media, durable backend workers/queues, real export tasks, paid/provider calls, external accounts, real secrets, destructive operations, irreversible migrations, and incompatible UX require explicit Human Owner authorization.
