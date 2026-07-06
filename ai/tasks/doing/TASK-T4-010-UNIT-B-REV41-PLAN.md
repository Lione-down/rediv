# Plan: T4-010 Unit B Revision 41 — Responsive Remediation and Interaction Closure

## Objective

最小修复 revision 40 证明的 responsive/interaction 缺陷：
1. 移动 Inspector drawer 不得遮挡 Prompt Dock 或 Prompt action
2. 缺少 `project_id` 时必须阻止依赖项目上下文的生成操作
3. 消除 Prompt Dock 的 `NButton` component-resolution warning

## Allowed Business Files

- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`

## Protected Files (SHA256 unchanged)

- `WorkspaceToolRail.vue`: `76069E56...` ✓
- `WorkspaceInspector.vue`: `0E286CF7...` ✓
- `WorkspaceStatusBar.vue`: `98976091...` ✓

## Implementation Plan

### Fix 1: NButton Warning (WorkspacePromptDock.vue)
- Import `NButton` from `naive-ui` alongside `NTag`
- No other changes to this file

### Fix 2: Drawer/Prompt Dock Overlap (Workspace.vue + WorkspacePromptDock.vue)
- Pass `:drawer-open` prop to WorkspacePromptDock from Workspace.vue
- In WorkspacePromptDock, when `drawer-open=true`, hide the prompt dock entirely (display: none)
- This ensures the drawer content is never occluded by Prompt Dock at any viewport

### Fix 3: project_id Guard (Workspace.vue)
- Pass `:has-project-id` prop to WorkspacePromptDock
- In WorkspacePromptDock, disable generate button when `has-project-id=false`
- In Workspace.vue `handleGenerate`, add early return when `!projectId.value` with clear message

## Browser Evidence Plan

Three exact viewports:
1. **1440x900**: Desktop layout, no drawer, Prompt Dock visible, all components present
2. **920x900**: Drawer open/close keyboard trace, no overlap between drawer and Prompt Dock
3. **375x812**: Drawer closeable, Prompt action visible when drawer closed, no horizontal overflow

Each viewport: screenshot PNG with dimensions/path/SHA256, scrollWidth<=clientWidth check, console errors, network requests, focus-visible, ARIA state, reduced-motion.

## Stop After

REPORT_READY — 等待 PMC queue decision
