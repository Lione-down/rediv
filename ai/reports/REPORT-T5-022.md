# REPORT-T5-022 - Generation Input Provenance Spotlight And Deterministic Ordering

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `f8637005ae43d4e34bc5575a59b42bd3510e837f`
- Scope: visually auditable multi-input generation provenance and order

## Delivered outcome

Selecting one generation node now reveals the exact direct inputs behind its next request. Participating source nodes receive compact fixed-screen T1/T2 and R1/R2 markers plus restrained rings, while their incoming edges use a static violet spotlight. Missing, unsupported, duplicate, and over-limit media remain visible with R× and a muted dashed path instead of appearing active.

The generation-context resolver is the single source for connection identity, per-kind order, included reference request order, exclusion state, panel labels, graph presentation, accessible edge labels, final prompt composition, and `image_ids`. Selecting any other node removes all provenance chrome. Readonly review retains provenance inspection without exposing mutation or generation controls.

## Verification evidence

- Pure generation-context plus browser provenance scenarios: PASS, 6/6.
- Related generation, multi-scenario, command interaction, reroute, and edge insertion regression: PASS, 39/39.
- Full current-source Chromium: PASS, 182/182.
- Frontend build: PASS, 4,793 modules transformed.
- Provider request evidence: two ordered scripts and two ordered image IDs match graph and panel order; duplicate and missing references remain excluded.
- Visual evidence: `output/playwright/t5-022-generation-provenance/ordered-four-inputs-1440x900.png` and `readonly-provenance-375x812.png`, manually reviewed.
- Hygiene: strict UTF-8 PASS, changed implementation files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Visual assessment

The treatment stays inside the established graphite-black media workbench. Violet appears only on participating paths and compact source markers; excluded inputs fall back to muted graphite. No permanent toolbar, modal, card grid, gradient, or animated execution trace was added. The right panel explains the same order in natural language without creating a second provenance model.

## Safety and contract notes

- No graph mutation, provider schema, backend, database, migration, quota, secret, paid API, or destructive operation changed.
- Recursive indirect context, drag reordering, animated execution traces, and Canvas engine changes remain explicit non-goals.
- The user-owned retired-Hermes plan and local QA/reference output remain unstaged.
