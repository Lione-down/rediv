# PLAN: T4-010 Unit B — Browser and Interaction Closure

## Objective

In the Workspace shell (Workspace.vue + 5 components), verify responsive geometry, keyboard/ARIA/focus, console/network cleanliness, and generation/loading/success/error/quota/selected-node behaviors across 1440x900, 920x900, and 375x812 viewports. Fix only defects found by these verifications in Allowed Files.

## Scope

### Allowed Business Files (read/write)
- `frontend/src/views/app/Workspace.vue`
- `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`
- `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`
- `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`
- `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`

### Read-Only (audit only)
- CanvasStage, CanvasStore, router, API, backend, Home, Space, global design tokens

### Allowed Artifacts
- `ai/tasks/doing/TASK-T4-010-UNIT-B-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-B-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-B.md`
- `ai/evidence/T4-010/unit-b/`

## Test Matrix

| Viewport | Checks |
|----------|--------|
| 1440x900 | Tool Rail 76px overlay, Inspector 320px right, Canvas + Prompt Dock geometry, scrollWidth<=clientWidth, no horizontal overflow |
| 920x900 | Inspector drawer activates, Tool Rail/Canvas controls no overlap, drawer closable |
| 375x812 | No horizontal overflow, Prompt action visible, drawer closable, long Chinese text adapts |

### Accessibility
- Tab/Enter/Space on tabs, tools, drawer close button, Prompt actions
- focus-visible ring on all interactive elements
- ARIA roles: tablist/tab/tabpanel, aria-label, aria-pressed, aria-expanded, aria-controls
- prefers-reduced-motion respected

### Console/Network
- Zero console errors/warnings
- Zero failed network requests (except expected 404s to backend endpoints)

### Behavior
- generation/loading/success/error/quota/selected-node states preserved
- Missing project_id: no fake ID, no dependent context operations

## Procedure

1. Navigate to `/app/workspace?project_id=test-001` at each viewport
2. Capture screenshots, measure geometry (scrollWidth/clientWidth, overlay positions)
3. Test keyboard navigation and ARIA attributes
4. Check console for errors and network for failures
5. Fix any defects found in Allowed Files
6. Final build + git diff --check
7. Write REPORT with evidence paths

## Risks
- Backend endpoints may not be reachable; expect 404s on `/api/image-generate` and `/api/video-generate` — these are acceptable.
- CanvasStage uses leafer-ui which may have WebGL dependency issues in headless browser.
