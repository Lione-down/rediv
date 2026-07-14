# REPORT-T5-021 - Atomic Typed Node Insertion Into An Existing Edge

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `6ca0b0ddebaecffb2724b2493ed2a368503828eb`
- Scope: selected-edge midpoint insertion with atomic typed topology replacement

## Delivered outcome

A selected editable edge now exposes one quiet midpoint plus action only when at least one canonical node subtype can bridge both sides of the existing connection. The compact chooser uses registry icons and semantic port labels, supports arrow/Home/End navigation, Escape and outside dismissal, clamps to the viewport, and respects readonly and reduced-motion boundaries.

Insertion creates a midpoint-positioned node, preserves the original connection ID for the source-to-inserted segment, and creates one new inserted-to-target connection. One dedicated command and mutation commit the node and both edge upserts through a single autosave PATCH and history entry. Undo restores the exact original graph and redo restores the exact inserted graph.

Compatibility and command validation reject missing, locked, unsupported, duplicate, stale, or incorrectly typed graph state. Legacy connections with omitted canonical `out`/`in` ports are normalized during validation.

## Verification evidence

- Pure compatibility and command coverage plus browser insertion scenarios: PASS, 6/6.
- Edge insertion plus direct reroute regression: PASS, 11/11.
- Full current-source Chromium: PASS, 179/179.
- Frontend build: PASS, 4,793 modules transformed.
- Autosave contract: one PATCH, one node upsert, two connection upserts, no original-edge delete.
- History contract: exact undo and redo graph equality verified.
- Visual evidence: `output/playwright/t5-021-edge-insertion/edge-insertion-920x900.png`, manually reviewed.
- Hygiene: strict UTF-8 PASS, changed implementation files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Visual assessment

Idle graph presentation remains low-noise. Only the selected compatible edge gains the small violet midpoint action. The chooser stays compact and close to the point of intent, semantic labels explain each bridge direction, and the 920px viewport remains unclipped without adding a persistent toolbar or decorative panel.

## Safety and contract notes

- No backend, database, migration, quota, provider, secret, paid API, or destructive operation changed.
- Arbitrary drag-on-edge insertion, batch insertion, legacy subtype creation, and Canvas engine replacement remain explicit non-goals.
- The user-owned retired-Hermes plan and local QA output remain unstaged.
