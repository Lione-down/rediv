# T6-003 Revid Runtime Evidence - 2026-07-21

- State: `HUMAN_REVIEW_PENDING`.
- Runtime basis: fresh Vite production build exercised by deterministic Playwright mock fixtures.
- Scope: final visual, interaction, responsive-readonly, persistence, accessibility, and performance evidence for T6-003.
- Exclusions: no real/paid provider call, secret access, user/runtime database mutation, external account action, or external motion-preview generation.

## Deterministic captures

The corrected acceptance artifacts remain untracked under `output/playwright/t6-003-visual-convergence/` and are excluded from Git delivery. The older `t6-003-card-interaction/` captures are retained only as the rejected historical comparison.

| Artifact | Bytes | SHA-256 | Declared review role |
|---|---:|---|---|
| `desktop-1440x900.png` | 183,384 | `C2ABA57956902D493DB87BE637851E8921B1B1249BA6B7238ECE2B5CDEBCFE1C` | Primary Unit 5C composition and selected-media review |
| `desktop-1366x768.png` | 165,121 | `AEEBAB793A1ED529097BC49BFACB7523116A531E7015C1BD23BC942EEF46ACBF` | Desktop density and source-attached collision review |
| `compact-920x900.png` | 159,134 | `EE2FA612DB2223034200C3121DB5E830D6CE27B0E5EDC2FFD410BDF3707596EC` | Compact bounded-composition review |
| `readonly-375x812.png` | 192,342 | `EE9AF53994C6C9CCDFFDA820BF70C72988D07E6E25E20269E008E8CBA497D30C` | Review-only boundary and continuation suppression |

## Visual inspection

- `1440x900`: ten non-group authoring, note, media, generation, and result nodes form a readable left-to-right creative graph. The representative lawful SVG media is the focal selected card; its media toolbar is attached above, its real image/video result-branch surface is attached below, competing inspectors are closed, and exactly one local hover flow is active.
- Script, note, and generation cards now expose the accepted internal type-title-body-lifecycle hierarchy. Media and group titles remain external, matching their established presentation boundary.
- The graph occupies at least `72%` of stage width and `58%` of stage height while every declared critical node stays inside the stage. Short authoring/generation cards retain at least `85%` of the representative media height at fitted overview. Quiet arrowless edges, secondary minimap/navigation chrome, and graphite/violet Revid identity remain intact.
- Enabled grid dots remain visibly present at `0.22` alpha because the Leafer root no longer covers the CSS grid with an opaque fill. The selected media toolbar uses an opaque Canvas surface and strong semantic border.
- `1366x768` and `920x900`: all declared nodes remain bounded; the selected identity, toolbar, and continuation surface stay available without serialized geometry changes.
- `375x812`: review mode is explicit; media toolbar, result continuation, and all continuation mutation buttons are absent while pan/zoom/inspection controls remain available.
- Renderer inspection after a live desktop-to-375px transition reports `state: readonly`, `shadowTone: none`, and `portOpacity: 0`; this closes the prior stale-Leafer state gap.
- All four corrected captures were produced by one dedicated deterministic representative fixture/spec and recorded zero document PATCH requests.
- The focal card center is deliberately covered by an SVG connection hit path. A direct Canvas pointer click still selects the card, proving node geometry outranks an overlapping edge hit target; edge pointer selection remains available on a true node-external segment, with keyboard selection retained for compact views where no such segment is visible.

## Contract evidence

- Card resolver: idle, hover/focus, selected, compatible-drag, locked/readonly, lifecycle progress/danger, and reduced motion share one semantic authority across DOM and Leafer.
- Geometry: card selection changes no translation or scale; visible ports are `20 world px`; acquisition remains exactly `40 CSS px`; delayed/current-boundary port evidence remains covered at `17/36/100/200%` zoom.
- Connections: one pure resolver owns persisted/draft/reroute paths; forward controls use midpoint X, reverse tangents use `132 world px`; visible/hit widths are `2/20 CSS px`; persistent arrow markers are absent.
- Motion: selected, hovered, and provenance flow is localized at `3000ms`; idle edges stay still; reduced motion produces static output.
- Context: source-attached toolbar/composer collision checks, resource/graph exclusivity, selection preservation, dismissal, focus restoration, and disclosure-only zero mutation remain covered.
- Responsive: 375px is review-only both in DOM and Leafer; no graph/history/autosave/revision/quota/task/asset/provider mutation is exposed.

## Verification results

- Corrected visual-convergence browser contract: `2/2`; Unit 5B related presentation/authoring/LibTV/geometry/visual regression: `33/33`; final edge identity/insertion/reroute interaction group: `18/18`.
- Related Canvas regression: initial `71/72` exposed a real selection-toolbar/video overlap after the new inspector action. Current visible media-toolbar ownership was added to collision geometry; the exact failing video case and corrected visual suite then passed.
- Fresh production build: `PASS` (`vue-tsc -b` and Vite, 4,958 modules transformed).
- Full functional Chromium: final `570/570 passed` in `10.0m`.
- Headed performance: `2/2 passed` in `1.2m` for the unchanged 200-node/300-connection thresholds.
- Dependency audit: `npm audit --audit-level=high` reported zero vulnerabilities.
- The historical T5-096 evidence manifest remains unchanged. Exactly five intentionally changed current snapshots are pinned by `t5-096-snapshot-overlay-2026-07-21.json`, and the existing `0.002` visual threshold remains unchanged.
- Project-state validation and `git diff --check` pass. Across 67 owned paths, strict UTF-8 failures, BOM files, sensitive path names, high-confidence secret assignments, and database artifacts are all zero. Existing aggregate `CanvasStage.vue` (770 nonblank lines) and `CanvasWorkspace.vue` (900) remain documented exceptions; no new oversized production file was introduced.

## Human gate

Final Human side-by-side and interaction acceptance of the corrected `desktop-1440x900.png` remains required before REPORT, `DONE / PASS`, commit, or push. The static design approval authorized implementation but does not replace this runtime acceptance.
