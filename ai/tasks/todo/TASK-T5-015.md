# TASK-T5-015 - Refine Canvas toward LibTV media-first fidelity

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-014 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Close the remaining visual gap between the Revid Canvas and the public LibTV reference by making media the node body, reducing fixed-card chrome, quieting ports and edges, and making contextual controls lighter while preserving Revid identity and all accepted Canvas contracts.

## Scope

- Make image and video node geometry derive from intrinsic aspect ratio rather than a fixed card frame.
- Reduce script, generation, and result nodes to content-specific silhouettes and density.
- Keep media labels outside the visual body and remove empty padding around decoded media.
- Make ports latent by default and visible on hover, selection, connection drafting, or keyboard focus.
- Replace animated purple dashed active edges with thin low-contrast solid curves, strengthening only connection-draft feedback.
- Compact the selection toolbar and contextual composer so they read as local tools rather than panels.
- Reduce minimap and Canvas chrome prominence where this does not change product capability.
- Add deterministic visual assertions and screenshot evidence against the retained public reference set.

## Non-goals and human gates

- No LibTV branding, logo, copy, proprietary assets, or pixel-for-pixel product cloning.
- No new node capabilities, provider integration, database change, Canvas engine change, or graph contract change.
- No paid provider calls, real secret access, destructive data operation, or irreversible migration.

## Acceptance criteria

- At 100% zoom, decoded image and video content fills the node body without an enclosing fixed-height card or visible empty letterbox caused by Revid geometry.
- 16:9, 1:1, and 9:16 media nodes have visibly different outer aspect ratios and keep their source ratio within 1 px.
- Media titles remain outside the media surface and do not reserve internal body space.
- Script and generation nodes are at least 25% shorter than the T5-014 fixed-card baseline when their content fits.
- Idle ports are visually quiet; selected, hovered, drafting, and keyboard-focused ports remain discoverable with at least a 24 px hit target.
- Persisted edges are solid and low contrast; no ordinary active edge uses animated purple dashes.
- Single-selection toolbar and composer do not obscure media or the inspector at 1440x900, 1366x768, or 920x900.
- The 375x812 surface remains review-only and does not expose editing controls.
- Focused visual/workflow specs, full Chromium, frontend build, four viewport screenshots, and the existing 200-node/300-connection performance boundary pass.
- PROGRESS, CURRENT, ROADMAP, REPORT, code, tests, screenshots, and retained evidence agree before `DONE - PASS`.

## Active unit

Complete. Final evidence: `ai/reports/REPORT-T5-015.md`.
