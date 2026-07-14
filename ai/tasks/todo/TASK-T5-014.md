# TASK-T5-014 - Deliver LibTV-inspired Canvas visual parity

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-013 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Bring Revid Canvas node geometry, media presentation, contextual editing, ports, passive edges, and selection feedback to a screenshot-comparable LibTV-inspired quality level while preserving Revid identity and existing runtime contracts.

## Scope

- Split text, media/result, generation, and unknown nodes into semantic visual geometries.
- Preserve decoded media aspect ratios and render exactly one visible media surface per result.
- Move editable content into a contextual composer anchored to the selected node without covering media.
- Make Canvas edges passive while retaining explicit port creation and accessible review/delete in Graph Access.
- Replace heavy success cards and state fills with media-first hierarchy and restrained semantic feedback.
- Add deterministic browser fixtures, screenshot evidence, supported-viewport checks, and 200-node/300-connection regression evidence.

## Non-goals and human gates

- No Canvas engine, database schema, provider contract, automatic graph execution, audio generation, timeline/compositor, or export pipeline change.
- No LibTV branding, proprietary copy, icons, or visual assets.
- No paid provider calls, real secret access, destructive database/filesystem operation, or irreversible migration.

## Acceptance criteria

- Text, media/result, and generation nodes use observably different typed geometry.
- Deterministic 16:9, 1:1, and 9:16 images preserve aspect ratio within 1 px and remain recognizable at 10%, 100%, and 200% Canvas zoom.
- Each result has exactly one visible media surface; no duplicate Leafer placeholder remains behind active DOM media.
- Single-selection desktop editing shows a contextual composer and toolbar without moving or covering media; IME, Escape, blur commit, Canvas-switch flush, and shortcut ownership remain correct.
- Canvas edges do not participate in ordinary pointer or keyboard selection; connections remain creatable from explicit ports and inspectable/deletable through Graph Access.
- Selected, editing, generating, failed, and unavailable states remain distinguishable without large success fills or overpowering glow.
- Focused specs, full Chromium, frontend build, guarded live Canvas evidence, and the existing 200-node/300-connection performance boundary pass.
- Final screenshots cover 1440x900, 1366x768, 920x900, and 375x812 review-only behavior and are manually checked against the visual criteria.
- PROGRESS, CURRENT, ROADMAP, REPORT, code, tests, and retained evidence agree before `DONE - PASS`.

## Active unit

Complete. Final evidence: `ai/reports/REPORT-T5-014.md`.
