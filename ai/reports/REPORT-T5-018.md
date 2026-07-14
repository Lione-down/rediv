# REPORT-T5-018 - Typed Connection Continuation

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `4f0116993cf45f761f58fbbf242d81239702e509`
- Scope: output drag continuation into compatible new Canvas nodes

## Delivered outcome

An output connection no longer disappears when released on empty Canvas space. Revid now opens a compact chooser at the release point and lists only node subtypes accepted by the dragged registry port. Script outputs offer image/video generation, media outputs offer media-aware generation, and result outputs also expose compatible result continuations.

Choosing an option creates the node and typed edge through one `insert-graph` command. The operation therefore produces one autosave PATCH and one undo/redo entry. Direct port-to-port drops retain their existing path. A four-pixel movement threshold preserves legacy node selection for port-area clicks without opening the inspector during a true drag.

Escape, the close control, outside pointerdown, pointer cancellation, outside-Canvas release, readonly mode, invalid ports, and sources with no compatible targets leave the graph unchanged. The chooser owns initial focus, arrow/Home/End navigation, Enter activation, bounded positioning, and reduced-motion behavior.

## Verification evidence

- Pure and focused browser continuation suite: PASS, 8/8.
- Relevant command, port, resource, generation, and multi-scenario Chromium regression: PASS, 50/50.
- Full Chromium: PASS, 163/163.
- Frontend build: PASS, 4,786 modules transformed.
- Visual evidence: `output/playwright/t5-018-connection-continuation/continuation-920x900.png`, manually reviewed.
- Hygiene: strict UTF-8 PASS, changed files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Visual assessment

The chooser follows the graphite media-workbench direction. It uses one raised luminance step, a restrained border, compact 38px rows, and violet only for the focused compatible action. It stays subordinate to node and media surfaces and does not introduce a modal backdrop or permanent toolbar.

No placeholder content enters production. Labels and icons come from the canonical registry, so future supported subtypes inherit the same filtering path.

## Verification note

The repository Playwright configuration runs `vite preview`, which serves the last successful `dist` build. During development, browser attempts made after a failed build exercised stale output and were discarded. Final focused, relevant, and full Chromium evidence all ran after a successful current-source build.

## Safety and contract notes

- No backend, database, migration, quota, provider, secret, paid API, or destructive operation changed.
- Existing Canvas command history and autosave remain the only persistence boundary.
- The user-owned retired-Hermes plan and local QA output remain unstaged.
