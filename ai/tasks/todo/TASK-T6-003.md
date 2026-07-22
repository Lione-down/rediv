# TASK-T6-003 - Canvas card UI and interaction high-fidelity optimization

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6`
- Objective: make Revid Canvas cards and card-to-card interactions visually coherent, precise, and production-grade against a fresh lawful official LibTV observation, while preserving Revid identity, graph behavior, persistence, accessibility, and provider ownership.
- Dependency: `T6-002 - DONE / PASS` at activation baseline `HEAD == origin/main == b4e7e4fad26f346648946bc0cad8919a1d8944e2`.
- Plan: [TASK-T6-003-PLAN](../doing/TASK-T6-003-PLAN.md).
- Progress: [TASK-T6-003-PROGRESS](../doing/TASK-T6-003-PROGRESS.md).
- Report: [REPORT-T6-003](../../reports/REPORT-T6-003.md).
- Planning source: preserved user-owned `.hermes/plans/2026-07-21_005018-t6-003-canvas-card-ui-interaction-high-fidelity.md` with SHA-256 `AE095A68935ECFCFF2BF020434290F0E5A66360803FAE5A95A125715A9A24D57`; it remains untracked and excluded from delivery.

## Scope

1. Record fresh official LibTV baselines for card states, card-local work surfaces, typed modes, media upload/asset acquisition, ports, connection geometry, contextual surfaces, focus, and reduced motion before the corresponding Revid implementation.
2. Produce and obtain Human approval for one 1440x900 static Revid UI design preview before business-code edits.
3. Establish shared semantic card-state and geometry contracts consumed by DOM and Leafer presentation without changing serialized graph dimensions.
4. Deliver shared logical input/output boundary anchors plus a separate 20-world-px output control with a CSS-stable outside circular acquisition surface, detached X/Y pointer-follow/reset behavior, and unchanged typed logical connection behavior.
5. Deliver one connection path authority, quiet idle edges, localized active motion, deterministic reduced-motion output, and preserved reroute/insertion/selection behavior.
6. Align contextual card surfaces and compound graph workflows through the existing discriminated contextual-surface authority.
7. Deliver card-local image/video/text work models: explicit empty-card modes, direct local/project-asset acquisition, source-attached prompting and parameters, same-card mock generation lifecycle/result projection, and typed canvas-reference acquisition.
8. Complete deterministic visual, functional, accessibility, build, performance, persistence, hygiene, Human review, REPORT, commit, and push closure.

## Locked boundaries and non-goals

- Preserve Vue 3, TypeScript, Leafer UI, Pinia, Naive UI, SCSS tokens, existing Canvas serialization, public APIs, MySQL schema, provider contracts, quota, tasks, assets, and graph history authority.
- Preserve Revid graphite/violet identity, copy, lawful icons, typed ports, reverse continuation, reroute/insertion, Graph Access, Storyboard, revisions, cinematic Skills, and supported Revid-only features.
- Do not add Director/`导演台`, a second renderer/state authority, backend changes, database migrations, new product dependencies, copied LibTV source/assets/branding, or unrelated refactors.
- No `.env` or real-secret access, paid/real provider call, user/runtime database mutation, destructive operation, external-account change, or private implementation inspection.
- The static generated preview is design intent only. It is not parity or completion evidence.
- Separate canonical persistence records may remain behind the UI, but the primary creator-facing image/video workflow must read and behave as one source-attached card. Do not expose implementation separation as a detached-card requirement.
- The 15-second external motion preview requires separate action-time authorization and a maximum spend after the still is accepted; otherwise use deterministic local browser recording later.

## Acceptance criteria

1. Official observation and approved static baseline precede product-code edits; reference measurements and provenance are recorded under `ai/evidence/t6-003/`.
2. Canonical card families pass idle, hover/focus, selected, compatible-drag, locked/readonly, lifecycle, and reduced-motion states without geometry or graph mutation.
3. At 100% zoom, declared card/port/edge/toolbar/composer anchors are within 2 CSS px of the accepted measured contract; delayed metadata remains within 2 CSS px at 17/36/100/200%.
4. Idle cards have no shadow; selected cards use the accepted semantic outline/shadow without translation, scale, or endpoint drift.
5. Visible ports are 20 world px; logical ports of one direction share one fixed boundary midpoint anchor. The output control is a separate card-external follower with an approximately `80 CSS px` circular acquisition surface, X/Y pointer following, approximately `30 CSS px` radial clamp, and deterministic reset on exit/cancel/lifecycle changes. Existing paths and new-connection origins stay on the fixed logical midpoint, while compatible landing remains exact across supported zoom.
6. Idle visible edges are 2 CSS px, hit paths are 20 CSS px, persistent arrows are absent, and all edge variants consume one pure path resolver.
7. Active flow is local, lasts 3000ms, clears deterministically, never animates idle edges, and becomes static under reduced motion.
8. Disclosure-only actions cause zero graph/history/autosave/revision/quota/task/asset/provider mutation; valid graph edits preserve one existing atomic command/history outcome.
9. Empty image, video, and text cards expose explicit type-appropriate modes. A materialized image/video family reads as one stable media card in idle and selected states; selection does not reveal a generation shell or move/resize the media body. Its separately bounded lower composer is a centered approximately `660 CSS px` screen-space surface on editable desktop Canvas, retains an approximately `16 world px` media gap as zoom changes, and exposes only provider-supported parameters. At the measured 100% `320px` card this is approximately `2.06 x`, but that ratio is not reused at other zooms. The selected top media toolbar is viewport-stable at approximately `900 x 50 CSS px`, centered on the media when space permits, clamped to the Canvas safe bounds without changing media geometry, and keeps professional icons plus visible labels on one horizontal row without compact-desktop overflow. A top-clearance collision may tighten the above-media offset only to `24 CSS px`, preserving the external title/metadata header plus at least `2px` separation; only a genuine no-fit condition may move the toolbar after the entire lower composer. Header, media, and composer remain pairwise non-overlapping whenever the safe vertical field permits; an oversized zoom state that spans that complete field keeps the toolbar available at the safe-bottom edge instead of hiding it.
10. Clicking an eligible media card offers local upload and project-asset selection; cancel is zero-mutation, asset ownership fails closed, and a committed choice uses the existing project asset and command/history authorities.
11. A mock image/video generation submitted from the attached card keeps user-selected provider/model ownership, projects pending/success/failure into that card, and does not require the user to create or chase a detached result card. The canonical result and internal lineage edge stay concealed in the primary Canvas projection unless explicitly requested through Graph Access; downstream edges remain visibly attached to the projected media card. Persisted lineage remains explicit and inspectable.
12. Text cards expose multiple visible modes including direct writing and supported downstream generation intents; unsupported provider capabilities remain disabled with an honest reason.
13. Canvas-reference acquisition exposes only compatible candidates, preserves ordered input roles, and closes deterministically through return, Escape, outside dismissal, Canvas switch, readonly, deletion, undo/redo, reload, stale result, and failure.
14. Contextual surfaces stay source-attached, collision-aware, keyboard accessible, dismissible, selection preserving, and focus restoring through interruption and Canvas lifecycle changes.
15. Revid-only abilities remain functional and non-displacing; 375x812 remains review-only with no mutation path.
16. Focused and related Chromium, production build, full functional Chromium, axe, reduced motion, persistence/history, and unchanged 200-node/300-connection thresholds pass without weakening.
17. Human side-by-side and interaction review is accepted before `DONE / PASS`; Task, PLAN, PROGRESS, REPORT, CURRENT, ROADMAP, Git delivery, and `origin/main` then agree.
