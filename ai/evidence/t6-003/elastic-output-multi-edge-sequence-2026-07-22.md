# T6-003 Unit 6O Elastic Output Multi-Edge Sequence

> Historical evidence only. Unit 6Q supersedes this coupling contract: the visible output control now follows X/Y independently while persisted paths and the draft origin remain fixed on the logical boundary midpoint. The artifacts below record the Unit 6O state and must not be used as the current interaction contract.

## Purpose

The Human reference requires two coupled behaviors:

1. all logical ports of one direction visually land on the same point;
2. the output `+` acquires in a broad edge region, follows the pointer while inside, moves every attached outgoing path with it, and resets only after exit.

Existing pure and browser tests prove these rules, but the prior screenshot recorded only the follow state and did not visibly demonstrate two outgoing paths sharing the moving source. The stronger Unit 6O RED contradicted the prior completion claim: resting paths begin at the projected media boundary, but entering the acquisition band moved both SVG path starts to `x=520` while the visible output `+` remained at `x=500`. The exact `20px` delta is the persisted generation width `340` minus the materialized result's visible width `320`.

## Contract

- One source card has two visible outgoing connections to two distinct targets.
- Resting output is at the source-card right-edge midpoint.
- Moving the pointer within the broad outside band relocates the output `+` to the clamped pointer Y.
- Both SVG paths begin at exactly that same output screen point in resting and following states.
- Moving beyond the acquisition boundary returns the output and both path starts to the midpoint.
- Rest, follow, and reset frames share one fixed capture clip.
- Logical source/target port IDs, Canvas document, history, and autosave remain unchanged; document PATCH count stays zero.

## Correction Boundary

`useCanvasStageCardInteractions` already owns both the materialized-card projection and elastic anchor. Pointer-down and hover-follow calculations must resolve the node by ID from `presentationNodes` before falling back to the persisted node. No acquisition constant, clamp, connection, command, history, or persistence contract changes.

## Human Gate

This visual sequence supports interaction review but cannot replace Human acceptance. T6-003 stays open until the final card shape and interaction are explicitly accepted.

## GREEN Result

Elastic hover and pointer-down now resolve the node from the existing materialized presentation before falling back to persistence. This makes the renderer port, draft origin, persistent outgoing paths, hit target, and visual surface consume one current visible layout.

- Focused sequence: `1/1` pass.
- Related projection/port/target/motion/continuation/card regression: `52/52` pass.
- Production build: `4,972` modules.
- Full functional Chromium: `599/599` in `10.0m`.
- Headed performance: `2/2` in `42.1s`.
- Dependency audit: `0` vulnerabilities.
- Project-state and diff checks: pass.
- Canvas document PATCHes during the sequence: zero.
- Final hygiene: `111` owned paths, `106` UTF-8 text files, and zero UTF-8, BOM, sensitive-path, secret-signature, or database-artifact findings.

Artifacts:

- `01-resting-shared-anchor.png`, SHA-256 `5BD037D6F0AF8DA097D848BB942F35C82E214C398C3B297A20C884C5851812DA`.
- `02-following-shared-anchor.png`, SHA-256 `391BDC0305C1D67381EBE313F60873F236E3B93032CB9688C3710B0FACB70769`.
- `03-reset-shared-anchor.png`, SHA-256 `5BD037D6F0AF8DA097D848BB942F35C82E214C398C3B297A20C884C5851812DA`.

Manual inspection confirms the two curves share one source midpoint at rest, move together to the pointer-following `+`, and return together. Rest and reset are byte-identical.

The prior authenticated tab was no longer available and a fresh local URL redirected to `/login`. No credential was read and no login was attempted. Current deterministic evidence runs the rebuilt production bundle and measures the actual rendered DOM/SVG rather than a pure helper only.
