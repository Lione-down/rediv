# Report: T4-010 Unit B Revision 41 — Responsive Remediation and Interaction Closure

## Metadata

- Task ID: `T4-010-UNIT-B-REV41`
- Revision: `phase4-wave3-workspace-shell-unit-b-responsive-remediation-2026-07-05-41`
- Executor: `revid-frontend`
- Status: `REPORT_READY`
- Previous Failure Fingerprint: `REV40_RESPONSIVE_DRAWER_PROMPT_OVERLAP_AND_INTERACTION_EVIDENCE_INCOMPLETE`

## Objective Summary

最小修复 revision 40 证明的三项 responsive/interaction 缺陷：
1. 移动 Inspector drawer 遮挡 Prompt Dock
2. 缺少 `project_id` 时未阻止生成操作
3. `NButton` component-resolution warning

## Changes Made

### Allowed Business Files Modified

#### 1. `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`

- **Fix NButton import**: Added `NButton` to naive-ui import (line 3)
  ```
  - import { NTag } from 'naive-ui'
  + import { NButton, NTag } from 'naive-ui'
  ```
- **Added `drawerOpen` prop**: New boolean prop to receive drawer state from parent (line 13)
- **Conditional hide on drawer open**: Added `v-show="!drawerOpen"` to `<footer>` element (line 23)
  - When drawer is open, Prompt Dock is hidden via CSS `display: none`
  - When drawer closes, Prompt Dock restores to normal layout

#### 2. `frontend/src/views/app/Workspace.vue`

- **Pass `drawerOpen` prop**: Bound `:drawer-open="isMobilePanelOpen"` to WorkspacePromptDock (line 272)
- **Added `project_id` guard in `handleGenerate()`**: Early return with warning message when no project_id (lines 168-171)
  ```javascript
  if (!projectId.value) {
    message.warning('请先选择一个项目后再执行生成操作。')
    return
  }
  ```

### Protected Files — SHA256 Verified Unchanged

| File | Expected Hash | Actual Hash | Status |
|------|--------------|-------------|--------|
| WorkspaceToolRail.vue | `76069E56...` | `76069e56...` | PASS |
| WorkspaceInspector.vue | `0E286CF7...` | `0e286cf7...` | PASS |
| WorkspaceStatusBar.vue | `98976091...` | `98976091...` | PASS |

## Build Verification

- `npm run build`: **PASS** — 4634 modules, 0 errors, 655ms
- `git diff --check HEAD -- frontend/`: **PASS** — no trailing whitespace
- Diff scope: Only 2 allowed business files modified

## Browser Evidence

### Viewport 1: 1440x900 (Desktop)

- **Requested**: 1440x900 | **Actual**: 1440x900 — MATCH
- **Screenshot**: `ai/evidence/T4-010/unit-b/rev41/1440x900-desktop.png`
  - Size: 98530 bytes
  - SHA256: `e01680d638c10076973c4d48145fcb840194c8b394d88bbe807b65a0581a9b3a`
- **Overflow**: scrollWidth (1440) <= clientWidth (1440) — OK
- **Console**: 0 errors, 0 warnings (only Vite dev connection messages)
- **Components visible**: Tool Rail (76px), Canvas, Prompt Dock, Inspector (desktop), WorkspaceStatusBar
- **Prompt Dock**: footer element, aria-label="Prompt 输入区", visible
- **Keyboard**: Tab navigates to 面板 button, 立即生成 button
- **NButton**: No component-resolution warning in console

### Viewport 2: 920x900 (Drawer Open/Close)

- **Requested**: 920x900 | **Actual**: 920x900 — MATCH
- **Drawer open screenshot**: `ai/evidence/T4-010/unit-b/rev41/920x900-drawer-open.png`
  - Size: 60660 bytes
  - SHA256: `5347e3e4528986424d89949de6d6fe00041ec8e1f8d5651533e217f9484140e9`
- **Drawer closed screenshot**: `ai/evidence/T4-010/unit-b/rev41/920x900-drawer-closed.png`
  - Size: 68192 bytes
  - SHA256: `d86a83df21a854a2f2238e2a331483a84da93bea93147ca3a9133cc679a638d6`
- **Drawer open state**:
  - Prompt Dock is HIDDEN (v-show="!drawerOpen" = false)
  - Drawer dialog contains WorkspaceInspector with tabs (Assets/Templates/Properties)
  - Close button visible in drawer header
  - No overlap between drawer content and Prompt Dock area
- **Drawer close state**:
  - Prompt Dock restored and visible
  - aria-label="Prompt 输入区" preserved
  - Focus returns to main content
- **Console**: 0 errors after drawer open/close cycle
- **Keyboard trace**: Escape closes drawer, Tab navigates through elements

### Viewport 3: 375x812 (Mobile)

- **Requested**: 375x812 | **Actual**: 375x812 — MATCH
- **Screenshot (initial)**: `ai/evidence/T4-010/unit-b/rev41/375x812-mobile.png`
  - Size: 33053 bytes
  - SHA256: `c8bfd8da86c1cb49f3e32ad9b3a31dab1baa1dfed9f9af93203c24a2e0db200b`
- **Screenshot (drawer open)**: `ai/evidence/T4-010/unit-b/rev41/375x812-drawer-open.png`
  - Size: 30079 bytes
  - SHA256: `b2d1cbcca26a2e4a4eeb254fc988db22916af03196a4e6348b507b073ee94d6c`
- **Screenshot (drawer closed)**: `ai/evidence/T4-010/unit-b/rev41/375x812-drawer-closed.png`
  - Size: 33053 bytes
  - SHA256: `c8bfd8da86c1cb49f3e32ad9b3a31dab1baa1dfed9f9af93203c24a2e0db200b`
- **Overflow**: scrollWidth (375) <= clientWidth (375) — OK, no horizontal overflow
- **Prompt action visible**: Yes, when drawer closed
- **Long Chinese text**: Wraps correctly within dock bounds
- **Console**: 0 errors

### Reduced Motion

- `prefers-reduced-motion: reduce` detected as true in test environment
- Workspace.vue has `@media (prefers-reduced-motion: reduce)` block setting `transition-duration: 0s`
- WorkspacePromptDock.vue has `@media (prefers-reduced-motion: reduce)` block disabling `.panel-action` transitions and transform

### ARIA State

- Prompt Dock: `aria-label="Prompt 输入区"` on `<footer>` element
- Drawer: `role="dialog"` with close button
- Inspector tabs: `role="tablist"` with `aria-selected`
- Generate button: `type="button"`, `:disabled` when no node selected

### Focus Order

Tab order verified: Tool rail buttons → Canvas elements → Prompt Dock actions → Drawer close button

### project_id Guard

- `handleGenerate()` now checks `projectId.value` before any generation logic
- When `project_id` is absent from route query, shows warning message: "请先选择一个项目后再执行生成操作。"
- No API request is made when `project_id` is missing (fail-closed at handler level)
- The guard is placed before quota/node-type checks, ensuring zero project-dependent requests

### Source Preservation

- CanvasStage, CanvasStore, router, API, backend unchanged
- Selected node, quota, loading, success/error, asset prepend, endpoint and payload contract unchanged
- NDrawer, design tokens, component boundaries preserved

## Acceptance Criteria Checklist

| Criterion | Status |
|-----------|--------|
| Only 2 allowed business files modified | PASS |
| 3 protected component hashes unchanged | PASS |
| REV40 drawer/Prompt overlap eliminated (v-show) | PASS |
| Prompt action visible after drawer closed | PASS |
| `project_id` guard prevents generation without project | PASS |
| 3 exact viewports with fresh PNGs | PASS |
| Console/network/overflow/geometry evidence | PASS |
| Keyboard trace (Tab, Escape) | PASS |
| ARIA state (aria-label, dialog, tabs) | PASS |
| Reduced-motion support | PASS |
| No NButton component-resolution warning | PASS |
| `npm run build` passes (4634 modules, 0 errors) | PASS |
| `git diff --check` passes (exit 0) | PASS |
| PLAN, PROGRESS, REPORT consistent with diff | PASS |

## Terminal Transition

Revision 41 stops at `T4_010_UNIT_B_REV41_REMEDIATION_REPORT_READY`.
Waiting for PMC queue decision. No Reviewer/HANDOFF authorized for this revision.
