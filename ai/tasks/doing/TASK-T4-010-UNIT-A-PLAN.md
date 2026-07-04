# Plan: T4-010 Unit A — Partial Diff Static and Build Closure

## Goal

Preserve the partial frontend diff from revision 32, verify static contracts, ownership, line counts, TypeScript build, and scoped diff closure. No browser testing, no Reviewer/HANDOFF cards, no expanded UI scope.

## Scope

### Allowed Business Files
- `frontend/src/views/app/Workspace.vue` (modified, 352 lines)
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue` (untracked, 100 lines)
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue` (untracked, 326 lines)
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue` (untracked, 200 lines)
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue` (untracked, 128 lines)

### Protected (no diff)
- CanvasStage, CanvasStore, router, API, backend, global tokens

## Verification Steps

1. Confirm revision 32 partial diff ownership — only allowed files touched
2. Line count audit: Workspace.vue <= 500, each component < 500
3. Props/emits typed check
4. Route `project_id`, missing context guard, generation/quota/selected-node contract audit
5. Protected files confirmed no diff
6. `npm run build` exit 0
7. `git diff --check` exit 0
8. Write REPORT confirming Unit A scope boundaries

## Out of Scope (Unit A)
- Browser/visual acceptance (Unit B)
- Reviewer/HANDOFF card creation
- Any backend contract changes
- Any design system expansion
