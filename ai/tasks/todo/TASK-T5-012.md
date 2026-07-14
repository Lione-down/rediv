# TASK-T5-012 - Restore Canvas workspace rendering with Naive UI theme compatibility

- State: `DOING`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-011 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Restore the authenticated Canvas workspace UI when opening a canonical Canvas route.

## Scope

- Make the Canvas-scoped Naive UI theme use parser-compatible color values.
- Add a focused regression guard for the theme contract.
- Verify the real browser route, Console, and frontend build.

## Non-goals and human gates

- No database changes, migrations, API contract changes, or unrelated visual redesign.
- No secret access or destructive operations.

## Acceptance criteria

- Opening `/app/projects/:projectId/canvases/:canvasId` renders the Canvas chrome/stage instead of a blank page.
- No Naive UI color-parser error is emitted during Canvas route initialization.
- Focused regression checks and frontend build pass.
