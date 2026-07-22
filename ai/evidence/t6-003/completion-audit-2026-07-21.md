# T6-003 Completion Audit - 2026-07-22

- Audit outcome: `COMPLETE`.
- Current Task state: `DONE / PASS`.
- Machine boundary: acceptance criteria 1-16 are proven against the delivered worktree. The protected snapshot and integrity overlay were refreshed after Human acceptance; focused verification passed `1/1` and the final unexcluded suite passed `599/599` in `11.5m` with exit `0`.
- Human boundary: criterion 17 was accepted on 2026-07-22 when the Human Owner requested direct closure and separated future UI sketches into later work.
- Git snapshot: `HEAD == b4e7e4fad26f346648946bc0cad8919a1d8944e2`; no T6-003 staging, commit, or push has occurred.

## Acceptance-criteria audit

| Criterion | Status | Current evidence |
|---|---|---|
| 1. Official observation and approved static baseline | `PROVEN` | Clean-room LibTV observations, Human screenshots, preview decision, provenance, measurements, and correction notes are recorded under `ai/evidence/t6-003/` before their corresponding implementation units. |
| 2. Canonical card-state matrix | `PROVEN` | Pure and browser contracts cover idle, hover/focus, selected, compatible-drag, locked/readonly, lifecycle, and reduced motion without serialized geometry or graph mutation. |
| 3. Geometry and delayed metadata | `PROVEN` | Shared renderer/DOM geometry and portrait metadata tests pass at 17/36/100/200%; declared anchors remain within the 2 CSS px contract. |
| 4. Idle/selected visual semantics | `PROVEN` | Idle shadow is absent; selected outline/shadow adds no translation, scale, media-body resize, or endpoint drift. |
| 5. Shared ports and detached output | `PROVEN` | Typed logical ports share fixed boundary midpoints. A separate 20-world-px output control uses an outside `80 CSS px` circular acquisition surface, follows pointer X/Y within a `30 CSS px` radial clamp, and resets deterministically; its `+` glyph center equals the circle center within `1 CSS px`. Two persisted paths and a new draft remain fixed on the boundary midpoint throughout. Pure/browser checks cover neighboring-card priority and exact landing. This supersedes the earlier path-follow interpretation. |
| 6. Edge geometry authority | `PROVEN` | 2 CSS px visible paths, 20 CSS px hit paths, no persistent arrows, and one shared path resolver pass forward/reverse/reroute/insertion coverage. |
| 7. Active and reduced motion | `PROVEN` | Local 3000ms flow, deterministic clearing, idle suppression, and static reduced-motion output pass current contracts. |
| 8. Mutation ownership | `PROVEN` | Disclosure paths remain zero-mutation; upload, project asset, typed reference, result branching, undo/redo, autosave, and revision behavior reuse existing atomic authorities. |
| 9. Card families and selected composition | `PROVEN` | Image/video/text modes are explicit. Materialized media keeps one stable body in idle/selected; title and decoded resolution share one external header instead of overlaying a pill on the image. The lower composer is a fixed centered `660 CSS px` screen-space surface with a compact top control band, unboxed prompt, bottom metadata/action band, and `16 world px` media gap. Official 50/82/100% and Revid 50/82% DOM measurements agree; the 17/36/50/82/100/200% browser matrix passes. The separately governed top toolbar is viewport-stable at `900 CSS px`, dense, and safe-bound clamped. Selection does not open details automatically. |
| 10. Local/project asset acquisition | `PROVEN` | Eligible cards expose local upload and project assets; cancel and ownership drift fail closed; commits use project assets plus one atomic asset-to-card graph command. |
| 11. Same-card lifecycle and projection | `PROVEN` | Mock submitting/success/failure stay on the source card. The canonical result, internal edge, version/lineage outline, and detached shell are absent from the primary projection; downstream edges remap to the visible source. Explicit Graph Access restores the requested canonical result and lineage. |
| 12. Text-card choices | `PROVEN` | Direct writing, text-to-video, text-to-music, and an honest disabled unsupported choice are visible and capability-aware. |
| 13. Canvas-reference lifecycle | `PROVEN` | Compatible asset-backed candidates and typed target ports are enforced. Browser proof covers return, Escape, outside dismissal, readonly, reload, deletion, undo/redo, Canvas switch, generation/failure interruption, and atomic attachment; candidate identity snapshots close stale acquisition state. |
| 14. Contextual surfaces | `PROVEN` | Source attachment, collision handling, keyboard access, dismissal, selection preservation, focus restoration, and Canvas lifecycle interruption pass current browser coverage. |
| 15. Revid-only abilities and review boundary | `PROVEN` | Graph Access, provenance, comparison, reverse continuation, Storyboard, revisions, and professional actions remain available; 375x812 is review-only with no mutation path. |
| 16. Verification gates | `PROVEN` | Production build passes; exact Unit 6Q browser proof is 1/1, related regression is 71/71, edge insertion/reroute is 11/11, protected snapshot verification is 1/1, and the final unexcluded suite is 599/599 in 11.5m. Headed performance is 2/2, audit reports 0 vulnerabilities, and project-state/diff gates pass. |
| 17. Human acceptance and delivery agreement | `ACCEPTED` | The Human Owner requested direct closure on 2026-07-22 and explicitly placed future UI sketches outside the current implementation boundary. REPORT and all durable state now agree on `DONE / PASS`. |

## Final visual evidence

- Idle: `output/playwright/t6-003-materialized-card/idle-materialized-image-card.png`.
- Selected desktop: `output/playwright/t6-003-materialized-card/selected-materialized-image-card.png`.
- Selected compact: `output/playwright/t6-003-materialized-card/selected-materialized-image-card-920x900.png`.
- Selected square reference: `output/playwright/t6-003-materialized-card/selected-materialized-square-card.png`, local SHA-256 `C9890ECD3EF1BF076A2271E067B198CEB3AD9FC3A9134F081292FB4E34208FB3`.
- Detached output resting: `output/playwright/t6-003-detached-output/01-resting-shared-anchor.png`, local SHA-256 `5A429C45072C4533C20650AE5F87CB1AD29D213E2CBAD3720E8175F4AC259261`.
- Detached output following: `output/playwright/t6-003-detached-output/02-following-shared-anchor.png`, local SHA-256 `3A43B7E57F19BB4546D8B71532FFA3F3BD911D1F61F139FF13F05C400636747D`.
- Detached output reset: `output/playwright/t6-003-detached-output/03-reset-shared-anchor.png`, local SHA-256 `B3BDBBDB7B53FAC0E893F4CF99CF0AFF9AD014093E732855B7F2CF11024EF84A`.
- Manual inspection confirms one stable media card with title-left/resolution-right external header, no internal resolution pill, a dense `900 x 50 CSS px` toolbar, one-row icon-label actions, and a centered fixed `660 CSS px` continuous lower composer. The constrained 920px frame stays complete, selected video metadata does not overlap its rail, and the previously overlooked right-side `V1` lineage outline is absent. Screenshot hashes are informational; exact DOM, geometry, natural-dimension, and zero-mutation assertions are the machine gate.
- A final read-only Chrome comparison opened the exact Human-supplied LibTV Canvas and reused an already-authenticated local Revid Canvas. LibTV showed the shared directional midpoint and lower selected-card composer; Revid showed the same card ownership model plus directly observed elastic output follow/reset. The probe performed no upload, generation, graph mutation, paid action, or credential inspection.

## Release sequence

1. Human acceptance: complete.
2. Intended protected snapshot plus integrity overlay refresh: complete.
3. Focused `1/1` and final unexcluded `599/599`: complete.
4. REPORT and durable-state reconciliation: complete.
5. Exact staging, conventional commit, push, and origin agreement: final delivery action.
