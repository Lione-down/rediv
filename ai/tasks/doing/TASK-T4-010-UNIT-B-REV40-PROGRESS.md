# Progress: T4-010 Unit B Revision 40

## Completed Steps

### Step 1: SHA256 Verification ✅
All 5 business files verified against hard gate checksums:
- Workspace.vue: `cc42c75e...` ✅ MATCH
- WorkspaceToolRail.vue: `76069e56...` ✅ MATCH
- WorkspaceInspector.vue: `0e286cf7...` ✅ MATCH
- WorkspacePromptDock.vue: `f19f28c9...` ✅ MATCH
- WorkspaceStatusBar.vue: `98976091...` ✅ MATCH

### Step 2: Preflight (375x812) ✅
- `browser_set_viewport(375, 812)` → actual: 375x812 ✅
- `window.innerWidth/innerHeight` read-back: 375/812 ✅
- PNG captured: `preflight-375x812.png` (32531 bytes)
- PNG dimensions verified: 375x812 ✅
- Console: 1 Vue warning (`n-button` unresolved in WorkspacePromptDock), 0 JS errors

### Step 3: 1440x900 Evidence ✅
- Viewport: 1440x900 ✅
- Read-back: innerWidth=1440, innerHeight=900 ✅
- scrollWidth=1440, clientWidth=1440 → scrollWidth <= clientWidth ✅
- scrollHeight=900, clientHeight=900 → no vertical scroll ✅
- Screenshot: `screenshot-1440x900.png` (98432 bytes, 1440x900) ✅
- Component bounding boxes:
  - Tool Rail (NAV): x=0, y=52, w=76, h=848
  - Canvas Stage (DIV): x=0, y=52, w=1440, h=848
  - Prompt Dock (FOOTER): x=88, y=824, w=1012, h=58
  - Right Panel (ASIDE): x=1120, y=52, w=320, h=848
- Console: 0 errors, 0 warnings ✅

### Step 4: 920x900 Evidence ✅
- Viewport: 920x900 ✅
- Read-back: innerWidth=920, innerHeight=900 ✅
- scrollWidth=920, clientWidth=920 → scrollWidth <= clientWidth ✅
- scrollHeight=1535, clientHeight=900 → vertical scroll needed ⚠️
- Screenshot: `screenshot-920x900.png` (67923 bytes, 920x900) ✅
- Component bounding boxes:
  - Tool Rail: x=0, y=52, w=76, h=1317
  - Right Panel: x=0, y=756, w=320, h=613 (DRAWER/MOBILE STATE)
  - Prompt Dock: x=12, y=716, w=896, h=98
  - Mobile Panel Toggle: x=830, y=65, w=76, h=38
- **DRAWER OVERLAP ISSUE**: Right panel at y=756 overlaps prompt dock at y=716-h98 (extends to y=814). Vertical overlap of ~58px.
- Console: 0 errors, 0 warnings ✅

### Step 5: 375x812 Evidence ✅
- Viewport: 375x812 ✅
- Read-back: innerWidth=375, innerHeight=812 ✅
- scrollWidth=375, clientWidth=375 → scrollWidth <= clientWidth ✅
- scrollHeight=1427, clientHeight=812 → vertical scroll needed ⚠️
- Screenshot: `screenshot-375x812.png` (32531 bytes, 375x812) ✅
- Component bounding boxes:
  - Tool Rail: x=0, y=52, w=76, h=1209
  - Right Panel: x=0, y=648, w=320, h=613 (DRAWER/MOBILE STATE)
  - Prompt Dock: x=12, y=635, w=351, h=93
  - Mobile Panel Toggle: x=285, y=65, w=76, h=38
- **OVERLAP ISSUE**: Right panel at y=648 overlaps prompt dock at y=635-h93 (extends to y=728). Vertical overlap of ~13px.
- Console: 0 errors ✅ (Vue warning about n-button from earlier cleared)

### Step 6: Build & Diff Check
- Pending...

## UI Defects Found
1. **Drawer/Panel Overlap at 920px**: Right panel collapses to drawer at bottom, overlapping prompt dock by ~58px
2. **Drawer/Panel Overlap at 375px**: Right panel collapses to drawer at bottom, overlapping prompt dock by ~13px
3. **Vue Warning**: `n-button` component unresolved in WorkspacePromptDock (Naive UI import issue)
4. **Vertical Scroll at Narrow Viewports**: scrollHeight exceeds clientHeight at 920x900 and 375x812
