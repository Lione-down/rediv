# TASK-T4-010-REV32-PLAN

## Goal

Split 925-line `Workspace.vue` into focused local components and implement v3 workspace shell:
- 76px left floating Tool Rail (absolute/fixed overlay, not grid column)
- Central Canvas
- 320px Inspector (right panel)
- Bottom Prompt Dock
- Below 920px: Inspector via Naive UI NDrawer, Tool Rail as floating bottom bar
- Below 375px: no horizontal overflow, accessible drawer/touch layout

## Scope

### Allowed Files (modify/create)

- `frontend/src/views/app/Workspace.vue` (reduce to ≤500 lines)
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue` (new)
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue` (new)
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue` (new)
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue` (new)
- `ai/tasks/doing/TASK-T4-010-REV32-PLAN.md` (this file)
- `ai/tasks/doing/TASK-T4-010-REV32-PROGRESS.md` (new)
- `ai/reports/REPORT-T4-010-REV32.md` (new)
- `ai/evidence/T4-010/rev32/` (browser screenshots)

### Read-Only (do NOT modify)

- `frontend/src/components/canvas/CanvasStage.vue`
- `frontend/src/components/common/PromptComposer.vue`
- `frontend/src/components/layout/AppTopBar.vue`
- `frontend/src/router/index.ts`
- `frontend/src/store/canvas.ts`
- Backend, API contract, Home, Space, global design tokens

## Architecture

### Component breakdown

1. **WorkspaceToolRail** — receives `activeTool` (string) prop, emits `update:activeTool`. Renders 5 tool buttons (select/hand/text/image/generate) with lucide icons, active state styling, focus-visible rings.

2. **WorkspaceInspector** — receives `activeTab` (computed ref), `visibleAssets`, `templates`, `selectedNode`, `selectedTitle`, `selectedNodeType`, `selectedNodeStatus`, `activeToolLabel`, `selectedQuotaType`, `selectedQuotaRemaining`, `isQuotaInsufficient`, `lastErrorMessage`, `lastSuccessMessage`, `onTabChange` handler. Uses Naive UI `NTabs` for Assets/Templates/Properties tabs. Props/emits fully typed.

3. **WorkspacePromptDock** — receives `selectedNode`, `selectedTitle`, `isQuotaInsufficient`, `isGenerating`, `generationButtonLabel`, `lastErrorMessage`, `onTogglePanel`, `onGenerate`. Rendered as floating bottom bar with copy text, generate button, quota warning.

4. **WorkspaceStatusBar** — receives `PROJECT_CONTEXT` (from route query), `activeToolLabel`, `isMobilePanelOpen`, `onTogglePanel`. Shows project context eyebrow + h1, status pill, mobile panel toggle.

### Key changes to Workspace.vue

- Replace `PROJECT_NAME` constant with `route.query.project_id` from Vue Router
- When `project_id` is absent: show "未选择项目" status, disable generate action
- Tool Rail: 76px wide, `position: absolute` overlay on left of canvas column, NOT a grid column
- Inspector: 320px fixed width on desktop; below 920px use `NDrawer` from Naive UI
- Prompt Dock: positioned above canvas bottom area, responsive to Inspector presence
- All existing logic (generation, quota, asset prepend, node status) preserved in Workspace.vue and passed down via props

### Responsive breakpoints

- ≥920px: desktop layout with grid (Tool Rail overlay + Canvas + Inspector 320px)
- <920px: Inspector becomes NDrawer, Tool Rail becomes floating bottom bar, Prompt Dock adjusts
- <375px: single column, no overflow, accessible drawer

## Implementation Order

1. Create `WorkspaceToolRail.vue` (extract tool rail section)
2. Create `WorkspaceInspector.vue` (extract right panel with tabs)
3. Create `WorkspacePromptDock.vue` (extract footer section)
4. Create `WorkspaceStatusBar.vue` (extract canvas chrome/header)
5. Refactor `Workspace.vue` to import and compose these components
6. Add route-based project_id handling (replace PROJECT_NAME)
7. Add NDrawer for Inspector below 920px
8. Adjust CSS for Tool Rail as absolute overlay (76px, not grid column)
9. Verify build, run browser tests at 3 viewports

## Testing

- `npm run build` — must exit 0
- `git diff --check` — no whitespace errors
- Browser at 1440x900: Tool Rail 76px overlay, Inspector 320px, Canvas visible, Prompt Dock at bottom
- Browser at 920x900: Inspector drawer opens/closes, Tool Rail + Canvas controls don't overlap
- Browser at 375x812: No horizontal overflow, keyboard accessible tabs/tools/drawer/Prompt
- Console: 0 errors, 0 failed network requests
- `scrollWidth <= clientWidth` at all viewports
