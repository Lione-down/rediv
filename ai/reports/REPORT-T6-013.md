# REPORT-T6-013 - Usable Script, storyboard, and Canvas interaction remediation

- State: `DONE`
- Verification outcome: `DEFERRED`
- Date: `2026-07-28`
- Activation baseline: `214b7c202ecb00b6504cdda849421ada3f04c38e`
- Human decision: program-level execution authorization; final visual/interaction/journey acceptance deferred to T6-027
- Task: [TASK-T6-013](../tasks/todo/TASK-T6-013.md).
- Plan: [TASK-T6-013-PLAN](../tasks/doing/TASK-T6-013-PLAN.md).
- Progress: [TASK-T6-013-PROGRESS](../tasks/doing/TASK-T6-013-PROGRESS.md).

## Delivered

- Restored the visible Script card and full-screen structured Story Production workspace, including stable shot and
  asset editing, confirmation, requested shot count, scrolling, safe provider-shape normalization, and provider-free
  selected-shot Image/Video graph authoring.
- Restored replacement Canvas marquee and additive selection, persistent selection hull, group/ungroup and group-unit
  movement, spatial group membership, whole-card connection acquisition, typed deletion, explicit rename, context-menu
  lifecycle, and shared command/history/autosave authority.
- Aligned Image generation count, ratio, size, same-card/batch projection, result-applying presentation, and resolved
  reference thumbnails with backend-authoritative capability and exact stable-card identity.
- Aligned Video text, single-image, and ordered-keyframe inputs; negative prompt; ratio, duration, and clarity targets;
  opaque `video_id`; compact polling; exact terminal result retrieval; same-card projection; and fail-closed unsupported
  semantic-reference behavior.
- Preserved stable Canvas IDs, MySQL/Canvas document authority, graph/history/autosave, quota/provider admission, legacy
  readability, automatic non-selectable Story Director, Video Composition, and capability-gated Audio boundaries.

## Fresh Unit 0 verification

- Project-state validator passed before closure reconciliation.
- Backend Agnes/Video/dispatch/parameter suite: `51 passed, 43 subtests passed`.
- Backend Story Director/Text/Script/Image suite: `32 passed, 9 subtests passed`.
- Backend official-contract/provider-validation supplement: `20 passed, 5 subtests passed`.
- Fresh frontend production build passed with `5,041` modules transformed.
- Preview-backed provider-free frontend contract/browser suite: `63/63` passed.
- The previously recorded broad run remains `59/60`, with one legacy structured-reference edge Delete cleanup boundary.
  A fresh isolated rerun of that exact case passed `1/1`; the complete broad suite was not rerun, so `60/60` is not
  claimed.
- `git diff --check` passed. No real or paid provider call, migration, runtime-data mutation, or secret access occurred.

## Human decision and evidence boundary

On 2026-07-28 the Human Owner stated:

> 从 T6-017 开始，每个计划任务使用目标模式，在独立的新会话完成；每完成一个 Task 就做一次 scoped Git commit 并 push；完成后再创建下一个新会话；连续推进到 T6-027，期间不再为计划内正常实现、测试、additive migration、commit 或 push 请求授权，Human Owner 最后统一检查。

This is program-level execution authorization and a deferral of intermediate visual/interaction review, not a
retroactive `ACCEPT`, `ACCEPT_WITH_DECLARED_BOUNDARIES`, or `PASS` for T6-013. Machine and browser evidence remain
machine evidence. The final Human journey gate is aggregated into T6-027.

## Boundaries

- T6-013 made no database migration, destructive data operation, real/paid provider call, external-account action,
  framework/Canvas-engine rewrite, or compatibility retirement.
- Historical Script/Image/Video provider failures were not automatically replayed and do not prove current external
  provider health or fidelity.
- User-owned `.codex/`, `.hermes/`, `output/`, `storage/`, `test-results/`, T6-012 raw evidence, and all environment or
  secret-bearing paths remain excluded from delivery.
- T6-012 remains terminal `BLOCKED / FAIL`; its strict contract code is retained only where T6-013 selectively validated
  and reused it.

## Decision

T6-013 is `DONE / DEFERRED`. Its implementation baseline and classified machine evidence are complete enough to support
the dependency-ready T6-017 contract Task, while final visual, interaction, and journey acceptance remains explicitly
owned by T6-027.
