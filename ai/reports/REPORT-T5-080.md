# REPORT-T5-080 - Canvas node and connection interaction usability

- Decision: `DONE - PASS`
- Date: 2026-07-17
- Scope: frontend Canvas geometry, port and connection interaction, aggregate continuation, group movement, active edge presentation, browser verification, and project-state documentation.

## Outcome

Canvas authoring now uses one visible-node geometry contract, forgiving screen-stable port acquisition, exact compatible landing, truthful aggregate batch continuation, graph-unit group movement, and restrained active-only edge direction. Existing graph identity, typed commands, one-PATCH history/autosave behavior, responsive ownership, and review-only mobile behavior remain intact.

## Implementation

- Centralized intrinsic media, dynamic authoring-card, visible rect, center, and containment geometry for presentation and interaction consumers.
- Kept the visible port at 16 world pixels while providing a 40 CSS px DOM-capture acquisition target across 10% through 800% zoom.
- Filtered locked, unsupported, direction-mismatched, and typed-incompatible targets before stable nearest-anchor ranking for both new edges and reroutes.
- Generalized the multi-selection hull and reused the authoritative selection-generation intent and existing atomic `insert-graph` command for exact batch continuation.
- Expanded a selected normal group to deterministic parent-before-child movement IDs and reused them for preview, commit, cancel, undo, redo, reload, and ungroup.
- Added exactly three directional dash segments only for draft, selected, and included provenance connections. Idle and excluded edges remain static; reduced motion retains static emphasis.
- Isolated active flow paths in a pointer-passive SVG layer and enumerated them in proportion to active paths rather than all persisted edges. Non-primary edge pointer events remain owned by pan and context behavior.

## Verification

- Strict TDD covered visible geometry, six-zoom port acquisition, gesture ownership, compatible landing, aggregate continuation, group movement, and connection motion before production behavior changed.
- Final focused and related Canvas matrix: 61/61 passed with the environment-sensitive mock performance case excluded by exact title for separate classification.
- Full functional Chromium: 372/372 passed in 6.6 minutes. This includes functional, history, persistence, responsive, accessibility, listener, heap, and network behavior.
- Production build: `vue-tsc -b && vite build` passed with 4,855 transformed modules.
- Four-viewport visual inspection passed at 1440x900, 1366x768, 920x900, and 375x812, including active lineage, compact Graph Access, minimap, and browse/review-only ownership.
- Guarded owned supervisor run `t5008-8928-2f348650034263c4` passed with 200 nodes, 300 connections, revision 3, 174ms stable render, 59.92 FPS, 16.8ms frame p95, 0.1ms pointer p95, zero long tasks, and automatic owned cleanup. Evidence: `output/playwright/t5-008-live/t5008-8928-2f348650034263c4/summary.json`.
- Local mock performance remained environment-sensitive under software rendering: 55.16 FPS passed its FPS floor, while the 33.3ms p95 scheduling bucket missed the unchanged 33ms threshold. No production threshold or assertion was weakened; the applicable guarded live 200/300 boundary passed.
- Hygiene: fresh diff review, `git diff --check`, strict UTF-8 reads, file-size review, sensitive-path scan, staged-secret scan, and exact staged-path review passed.

## Acceptance classification

All twelve Task criteria pass. The guarded owned live run is the decisive applicable 200/300 performance boundary. The local mock scheduling variance is retained as explicit environment evidence and does not conceal or waive any functional failure.

## Boundaries preserved

- No backend, database, provider, quota, schema, migration, persistent graph format, UI framework, or mobile-editing contract changed.
- No paid call, real secret access, `.env` read, destructive operation, or user/runtime migration occurred.
- T5-081 remains inactive. Pre-existing untracked `.hermes` plans and `output/` evidence remain outside staging.
