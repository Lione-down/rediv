# Task: T4-010 Unit B Revision 39 — Browser Evidence Collection Plan

## Objective

Collect real browser evidence for Workspace unit B components without modifying any business code.

## Evidence Collection Steps

1. **Baseline Verification** — SHA256 checksums of 5 read-only business files
2. **Page Load & Navigation** — Navigate to `/app/workspace`, verify components render
3. **Component Presence** — Verify Tool Rail, Main Stage, Inspector Panel, Prompt Dock exist
4. **Keyboard Navigation** — Tab through all 5 tool buttons, verify focus order and aria-labels
5. **Tab Switching** — Click Templates/Properties tabs, verify aria-selected updates
6. **Dialog Interaction** — Open/close Prompt panel dialog, verify role="dialog" and aria-modal
7. **Viewport Evidence** — Record actual browser viewport dimensions
8. **CSS Transform Simulation** — Apply scale(0.875) to simulate 1440px viewport, collect bounding boxes
9. **Media Query Checks** — Test matchMedia for various breakpoints
10. **Console/Network** — Verify no JS errors, warnings, or failed requests
11. **Build Verification** — Run npm run build, verify clean output
12. **Git Diff Check** — Run git diff --check on modified files

## Allowed Artifacts

- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV39-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV39-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-B-REV39.md`
- `ai/evidence/T4-010/unit-b/rev39/`

## Hard Gates

- All 5 file SHA256s must match baseline before and after
- No business code modifications
- Evidence must come from real browser session
