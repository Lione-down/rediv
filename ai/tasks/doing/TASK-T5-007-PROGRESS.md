# TASK-T5-007 Progress

- Task state: `DOING`
- Active unit: Unit B - additive MySQL resource contract
- Updated: 2026-07-13
- Baseline HEAD: `e05e8bb0dd12c96c41211a61c17009da5f4f0a96`

## Completed Work

- Completed Unit A through RED -> GREEN -> regression -> visual QA -> independent review.
- Added one typed registry for canonical `script`, `note`, `asset`, `generation`, `result`, and `group` definitions, including subtype, port data type, size, icon key, capabilities, and serialization version.
- Kept legacy node definitions compatibility-only and gave their default ports/capabilities truthful legacy behavior; canonical creation surfaces never expose them.
- Preserved unknown types, unknown subtypes, and future serialization versions as labeled unsupported nodes without coercing identifiers or injecting fallback content during create, autosave, or recovery.
- Routed context/double-click creation, `Tab` ToolDock creation, group creation, connection compatibility, renderer labels/media/ports, access-tree labels, and legacy generation gating through registry facts.
- Added exact multi-input/output port geometry for rendered nodes, pointer targets, temporary edges, and persisted connection paths.
- Added image preview and honest image/video/audio placeholder presentation, with distinct asset/result labels.
- Added the V2 bottom-center ToolDock with keyboard navigation, focus restoration, reduced-motion handling, no overlap with graph access controls, and no mobile edit surface.
- Closed independent-review findings for explicit port validation, autosave losslessness, future-group rendering/mutation, legacy `result`/`group` marker disambiguation, group serialization, unsupported generation, icon-source drift, affected-graph mutation gates, mixed-command atomic preflight, Graph Access Panel actions, ToolDock tooltip semantics, structural child detach, and legacy media-port selection.
- Confirmed no paid provider call, real secret access, user/runtime migration, destructive data operation, or ignored-artifact cleanup occurred.

## Remaining Work

- Unit B: add and verify the additive MySQL resource contract.
- Unit C: deliver project-scoped asset/template services and target-Canvas graph insertion.
- Unit D: deliver durable mock-provider generation transactions and authoritative quota synchronization.
- Unit E: deliver Canvas resource/generation UI and complete regression/review/report closure.

## Exact Next Action

Read the FastAPI structure guidance and current migration/model/test helpers, then write the guarded-MySQL Unit B tests and observe the expected RED before changing ORM models or adding the migration.

## Files Changed

- State/docs: `ai/tasks/todo/TASK-T5-007.md`, `ai/tasks/doing/TASK-T5-007-PLAN.md`, `ai/tasks/doing/TASK-T5-007-PROGRESS.md`, `ai/state/CURRENT.md`, `ai/state/ROADMAP.md`.
- Registry/serialization: `frontend/src/modules/canvas/node-registry.ts`, `node-serialization.ts`, `mappers.ts`, `persistence.ts`, `canvas-autosave.ts`, `canvas-recovery.ts`, `canvas-commands.ts`, `canvas-command-executor.ts`, `frontend/src/types/canvas.ts`.
- Canvas presentation/interaction: `frontend/src/components/canvas/CanvasToolDock.vue`, `CanvasStage.vue`, `CanvasGraphAccessPanel.vue`, `canvas-node-icons.ts`, `canvas-node-presentation.ts`, `canvas-geometry.ts`, `canvas-renderer.ts`, `canvas-stage.scss`, and the changed Canvas composables for context menu, keyboard, overlays, connection presentation, stage presentation, command interactions, and stage orchestration.
- Compatibility UI: `frontend/src/views/app/CanvasWorkspace.vue`.
- Tests: `canvas-node-registry.spec.ts`, `canvas-node-compatibility.spec.ts`, `canvas-node-presentation.spec.ts`, `canvas-node-icons.spec.ts`, `canvas-port-geometry.spec.ts`, plus changed command, autosave, and shell-navigation specs.

## Commands And Results

- Required start commands - PASS; clean baseline at `e05e8bb0dd12c96c41211a61c17009da5f4f0a96`.
- TDD RED evidence - PASS; observed missing registry/icon/geometry/autosave exports, unknown-type coercion, raw-content injection, incorrect asset label, invalid explicit ports, unsupported group mutation/chrome, non-registry group content, unsupported generation eligibility, orphaned child references, legacy media-to-prompt selection, mixed-command partial mutation, markerless legacy-group rejection, enabled no-op access-tree actions, and the missing ToolDock tooltip before each fix.
- Final Canvas Chromium regression - PASS, 71/71 with one worker, including mock-browser 200-node/300-connection and accessibility cases.
- Legacy authenticated workflow regression - PASS, 6/6, including image generation success/failure and four responsive viewports; the post-tooltip focused run passed the six workflow cases plus the ToolDock browser case, 7/7.
- Production build - PASS, `vue-tsc -b && vite build`, 4,747 modules transformed.
- Manual visual inspection - PASS for ToolDock/menu and graph-access coexistence at 1440x900, 1366x768, 920x900, and 375x812; mobile remains review-only.
- Independent Unit A review - PASS after all findings were closed, 0 HIGH / 0 MEDIUM; reviewer focused runs passed 30/30 and 40/40, with independent build, diff, and file-size gates.
- Hygiene - PASS; `git diff --check` clean apart from Git CRLF notices, all 39 changed/untracked files at or below 500 lines, no secret-bearing file opened or staged.

## Blockers And Release Conditions

- No repository blocker prevents Unit B.
- Applying Alembic migrations to user/runtime data requires Human Owner authorization and is outside this Task run.
- Paid provider calls, real secret access, destructive MySQL/filesystem work, and ignored local-artifact cleanup remain Human Owner gates.
