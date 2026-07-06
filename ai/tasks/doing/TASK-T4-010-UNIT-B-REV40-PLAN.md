# Plan: T4-010 Unit B Revision 40 — Exact Tool Browser Evidence

## Objective
Generate three exact-viewport browser evidence sets for the Workspace page without modifying any business code.

## Read-only Business Files (5)
1. `frontend/src/views/app/Workspace.vue`
2. `frontend/src/views/app/components/workspace/WorkspaceToolRail.vue`
3. `frontend/src/views/app/components/workspace/WorkspaceInspector.vue`
4. `frontend/src/views/app/components/workspace/WorkspacePromptDock.vue`
5. `frontend/src/views/app/components/workspace/WorkspaceStatusBar.vue`

## Allowed Artifacts
- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV40-PLAN.md`
- `ai/tasks/doing/TASK-T4-010-UNIT-B-REV40-PROGRESS.md`
- `ai/reports/REPORT-T4-010-UNIT-B-REV40.md`
- `ai/evidence/T4-010/unit-b/rev40/`

## Procedure
1. Verify SHA256 of all 5 business files against hard gate checksums
2. Preflight: 375x812 viewport — set viewport, verify read-back, capture PNG, validate dimensions
3. Collect 1440x900 evidence: viewport set → read-back → screenshot → bounding boxes → console check
4. Collect 920x900 evidence: viewport set → read-back → screenshot → bounding boxes → drawer overlap check → console
5. Collect 375x812 evidence: viewport set → read-back → screenshot → bounding boxes → prompt/drawer overlap → console
6. Run `npm run build` and `git diff --check`
7. Write structured REPORT with all evidence paths, SHA256, dimensions, findings

## Viewports
- 1440x900 — desktop full layout
- 920x900 — tablet / narrow desktop (drawer overlap test)
- 375x812 — mobile (prompt dock / drawer overlap test)

## Success Criteria
- All 3 viewports: exact read-back match, PNG dimensions match target, scrollWidth <= clientWidth, no JS errors
- All 5 business files: SHA256 matches hard gate
- Build passes with zero errors
- No business code modifications
