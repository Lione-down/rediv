# PLAN: T4-010 REV32 — Workspace Shell Continuation

## Objective

Continue and complete the T4-010 workspace shell split from revision 31.
Previous run (run #147) created the 4 component files and refactored
Workspace.vue down to 361 lines but timed out before build verification
and browser testing.

## Scope

### Files to modify (Allowed Files)

- `frontend/src/views/app/Workspace.vue` — shell grid layout fix
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue` — positioning fix
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue` — import fix
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue` — remove unused emits

### Files read-only (do not touch)

- CanvasStage, PromptComposer, AppTopBar, router, canvas store
- Backend, API, Home, Space, global design tokens

## Issues Found from Previous Run

1. **WorkspacePromptDock.vue**: Missing imports for `PanelsTopLeft` (lucide) and `NButton` (naive-ui).
2. **WorkspaceInspector.vue**: Unused `defineEmits<{ update: ... }>()` — parent uses callback `onTabChange` not event.
3. **Workspace.vue CSS**: Dead classes `.tool-rail-desktop` and `.right-panel-desktop` never referenced in template.
4. **ToolRail positioning**: Component's `.tool-rail` had grid layout but no `position: absolute` — parent grid had only 1 column, so rail had no container to overlay on.
5. **Inspector layout**: `.workspace-shell` grid had `grid-template-columns: minmax(0, 1fr)` (single column) — inspector (320px) stacked below canvas instead of beside it.

## Implementation Steps

1. Add missing imports to WorkspacePromptDock.vue (PanelsTopLeft, NButton)
2. Remove unused defineEmits from WorkspaceInspector.vue
3. Add `position: absolute; left: 0; top: 0; bottom: 0; width: 76px; z-index: 10` to ToolRail component CSS
4. Fix `.workspace-shell` grid to `grid-template-columns: minmax(0, 1fr) 320px` for desktop
5. Clean up dead CSS classes in Workspace.vue
6. Run `npm run build` and verify exit 0
7. Run `git diff --check` for whitespace
8. Browser verification at 1440x900, 920px, 375px
9. Write PLAN, PROGRESS, REPORT

## Line Count Budget

- Workspace.vue: 341 lines (target ≤ 500) ✓
- WorkspaceToolRail.vue: 90 lines (< 500) ✓
- WorkspaceInspector.vue: 313 lines (< 500) ✓
- WorkspacePromptDock.vue: 191 lines (< 500) ✓
- WorkspaceStatusBar.vue: 118 lines (< 500) ✓
