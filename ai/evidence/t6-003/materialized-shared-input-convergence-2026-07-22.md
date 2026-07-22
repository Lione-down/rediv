# T6-003 Unit 6P Materialized Shared-Input Convergence

## Purpose

The Human reference shows several cards connecting into one target-side point. Logical input roles remain typed, but their visible geometry must converge.

Unit 6O proves the output half through a moving multi-edge source. Unit 6P verifies the target half against the actual production DOM/SVG for a materialized media card, where persisted generation dimensions differ from visible result dimensions.

## Contract

- Two different source cards connect to the same materialized target.
- One connection uses logical target port `prompt`; the other uses `media`.
- The target displays exactly one shared input `+` at its left midpoint.
- Each SVG path endpoint, measured with `getPointAtLength(getTotalLength())` and `getScreenCTM()`, equals that visible input point.
- The target remains one projected media card and the internal canonical result/lineage edge remains concealed.
- Capture and measurement produce zero document PATCHes.

## Human Gate

This is browser evidence for the shared-input interaction requirement. Human acceptance is still required before T6-003 delivery closure.

## Result

- Focused browser evidence: `1/1` pass.
- Complete node-geometry matrix: `8/8` pass.
- Logical target IDs remain `prompt` and `media`.
- Both transformed SVG endpoints equal the same visible target input point.
- Visible materialized cards: one; visible canonical result cards: zero.
- Document PATCHes: zero.
- Production-code changes in Unit 6P: none.
- Current production gates from Unit 6O remain build `4,972`, related `52/52`, full Chromium `599/599`, headed performance `2/2`, and dependency audit `0`.
- Final hygiene: `112` owned paths, `107` UTF-8 text files, zero UTF-8 failures, BOM files, sensitive paths, secret signatures, or database artifacts.

Artifact: `output/playwright/t6-003-shared-input/materialized-prompt-media-shared-input.png`, SHA-256 `B38FB2310C670EE2085E7EE412F76D9216C6E292CCB7B046073BA66585066BFD`.

Manual inspection confirms both curves visibly land on the same left-side `+` of the one projected media card.
