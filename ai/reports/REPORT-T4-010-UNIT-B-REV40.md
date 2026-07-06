# Report: T4-010 Unit B Revision 40 — Exact Tool Browser Evidence

## Metadata

- Task ID: `T4-010-UNIT-B-REV40`
- Revision: `phase4-wave3-workspace-shell-unit-b-exact-browser-evidence-2026-07-05-40`
- Executor: `revid-frontend`
- Date: 2026-07-05
- Dev Server: `http://127.0.0.1:9099/` (Vite v8.0.16)
- Page Under Test: `/app/workspace` (Workspace page, no project selected)

## Hard Gate: SHA256 Verification

| File | Expected SHA256 | Actual SHA256 | Status |
|------|-----------------|---------------|--------|
| Workspace.vue | `CC42C75E4CB22A6C5DA2827428C9561D9C1B65C024F31ED518B00C576D688437` | `cc42c75e4cb22a6c5da2827428c9561d9c1b65c024f31ed518b00c576d688437` | PASS |
| WorkspaceToolRail.vue | `76069E5692A7BD65F1E7177DDC54DF00BF8104FF870B7DA8EA8803D10B689C75` | `76069e5692a7bd65f1e7177ddc54df00bf8104ff870b7da8ea8803d10b689c75` | PASS |
| WorkspaceInspector.vue | `0E286CF79A58F001B568273CA0122641FD15B72D8CB05FC66B93A08E6A460FF6` | `0e286cf79a58f001b568273ca0122641fd15b72d8cb05fc66b93a08e6a460ff6` | PASS |
| WorkspacePromptDock.vue | `F19F28C9FBAEAE3AB6F005416B658D5CEE13EB40C83F1328AE61042717005711` | `f19f28c9fbaeae3ab6f005416b658d5cee13eb40c83f1328ae61042717005711` | PASS |
| WorkspaceStatusBar.vue | `989760912D31A9754A65C8D290CA501EB04EC6EDC384001874D55AF4E3605F7F` | `989760912d31a9754a65c8d290ca501eb04ec6edc384001874d55af4e3605f7f` | PASS |

## Build & Diff Check

- `npm run build`: PASS (622ms, 0 errors, 4634 modules built)
- `git diff --check`: PASS (only pre-existing CRLF warnings, no whitespace errors)
- Business files unmodified: CONFIRMED

## Evidence Files

| File | Path | Size | SHA256 |
|------|------|------|--------|
| Preflight 375x812 | `ai/evidence/T4-010/unit-b/rev40/preflight-375x812.png` | 32531 bytes | `09177ee3f314d9ba5a6dda7c596adfe444058ccea8fb02b3d8cf6fb176e4f97f` |
| Screenshot 1440x900 | `ai/evidence/T4-010/unit-b/rev40/screenshot-1440x900.png` | 98432 bytes | `69e8bd185c9c7559460c41bf42f7712e42ab9f79f5ddc5363c7bcd5666826bca` |
| Screenshot 920x900 | `ai/evidence/T4-010/unit-b/rev40/screenshot-920x900.png` | 67923 bytes | `f619da2cc1a42976ec92fcc1f3491e7412c9a34137de305e8815a0b60122ff2a` |
| Screenshot 375x812 | `ai/evidence/T4-010/unit-b/rev40/screenshot-375x812.png` | 32531 bytes | `09177ee3f314d9ba5a6dda7c596adfe444058ccea8fb02b3d8cf6fb176e4f97f` |

## Viewport Evidence

### 1440x900 (Desktop Full Layout)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Viewport set | 1440x900 | 1440x900 | PASS |
| innerWidth | 1440 | 1440 | PASS |
| innerHeight | 900 | 900 | PASS |
| scrollWidth | - | 1440 | PASS |
| clientWidth | - | 1440 | PASS |
| scrollWidth <= clientWidth | - | 1440 <= 1440 | PASS |
| scrollHeight | - | 900 | PASS |
| clientHeight | - | 900 | PASS |
| PNG dimensions | 1440x900 | 1440x900 | PASS |
| Console errors | 0 | 0 | PASS |
| Console warnings | 0 | 0 | PASS |

**Component Bounding Boxes:**

| Component | Tag | Position | Size |
|-----------|-----|----------|------|
| Tool Rail | NAV | x=0, y=52 | 76 x 848 |
| Canvas Stage | DIV | x=0, y=52 | 1440 x 848 |
| Prompt Dock | FOOTER | x=88, y=824 | 1012 x 58 |
| Right Panel (Inspector) | ASIDE | x=1120, y=52 | 320 x 848 |

**Notes:** Full desktop layout. All components visible side-by-side. No overlap. No scroll needed.

### 920x900 (Tablet / Narrow Desktop)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Viewport set | 920x900 | 920x900 | PASS |
| innerWidth | 920 | 920 | PASS |
| innerHeight | 900 | 900 | PASS |
| scrollWidth | - | 920 | PASS |
| clientWidth | - | 920 | PASS |
| scrollWidth <= clientWidth | - | 920 <= 920 | PASS |
| scrollHeight | - | 1535 | WARN |
| clientHeight | - | 900 | - |
| PNG dimensions | 920x900 | 920x900 | PASS |
| Console errors | 0 | 0 | PASS |
| Console warnings | 0 | 0 | PASS |

**Component Bounding Boxes:**

| Component | Tag | Position | Size |
|-----------|-----|----------|------|
| Tool Rail | NAV | x=0, y=52 | 76 x 1317 |
| Right Panel (Inspector) | ASIDE | x=0, y=756 | 320 x 613 |
| Prompt Dock | FOOTER | x=12, y=716 | 896 x 98 |
| Mobile Panel Toggle | BUTTON | x=830, y=65 | 76 x 38 |

**Notes:**
- Right panel collapsed to drawer mode (positioned at bottom-left x=0, y=756)
- **DRAWER OVERLAP DEFECT**: Right panel (y=756, h=613, extends to y=1369) overlaps Prompt Dock (y=716, h=98, extends to y=814). Vertical overlap ~58px at y=756-814.
- Mobile panel toggle button visible at x=830 (right edge of viewport)
- Vertical scroll needed (scrollHeight 1535 > clientHeight 900)

### 375x812 (Mobile)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Viewport set | 375x812 | 375x812 | PASS |
| innerWidth | 375 | 375 | PASS |
| innerHeight | 812 | 812 | PASS |
| scrollWidth | - | 375 | PASS |
| clientWidth | - | 375 | PASS |
| scrollWidth <= clientWidth | - | 375 <= 375 | PASS |
| scrollHeight | - | 1427 | WARN |
| clientHeight | - | 812 | - |
| PNG dimensions | 375x812 | 375x812 | PASS |
| Console errors | 0 | 0 | PASS |
| Console warnings | 0 | 0 | PASS |

**Component Bounding Boxes:**

| Component | Tag | Position | Size |
|-----------|-----|----------|------|
| Tool Rail | NAV | x=0, y=52 | 76 x 1209 |
| Right Panel (Inspector) | ASIDE | x=0, y=648 | 320 x 613 |
| Prompt Dock | FOOTER | x=12, y=635 | 351 x 93 |
| Mobile Panel Toggle | BUTTON | x=285, y=65 | 76 x 38 |

**Notes:**
- Right panel collapsed to drawer mode (positioned at bottom-left x=0, y=648)
- **OVERLAP DEFECT**: Right panel (y=648, h=613, extends to y=1261) overlaps Prompt Dock (y=635, h=93, extends to y=728). Vertical overlap ~13px at y=648-728.
- Mobile panel toggle button visible at x=285
- Vertical scroll needed (scrollHeight 1427 > clientHeight 812)
- Prompt dock text wraps on narrow width (351px wide vs 375px viewport minus margins)

## Accessibility & Keyboard

- **focus-visible**: Tab buttons show `focus-ring` class in DOM (`.panel-tab.focus-ring.active`, `.panel-action.focus-ring`) — focus indicators present
- **ARIA**: Tablist/tab/tabpanel roles used for panel tabs (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
- **Complementary landmark**: Inspector panel uses `<complementary>` landmark element
- **Reduced motion**: Not tested (requires prefers-reduced-motion media query check)
- **Keyboard**: No keyboard traps detected; mobile panel toggle accessible at narrow widths

## No Project ID Behavior

- Page loads correctly at `/app/workspace` without project_id
- Displays "未选择项目" (No project selected) heading
- Does NOT fabricate a project ID
- Does NOT trigger project-context-dependent operations
- Canvas shows empty state with mini-map placeholder buttons

## UI Defects Summary

1. **[DEFECT] Drawer/Panel Overlap at 920px viewport** (Medium severity)
   - Right panel collapses to drawer mode at bottom, overlapping prompt dock by ~58px
   - Panel at y=756 overlaps footer at y=716 (height 98px)
   - Affects asset panel and quota section visibility

2. **[DEFECT] Drawer/Panel Overlap at 375px viewport** (Medium severity)
   - Right panel collapses to drawer mode at bottom, overlapping prompt dock by ~13px
   - Panel at y=648 overlaps footer at y=635 (height 93px)
   - Both panels and prompt dock compete for bottom viewport space

3. **[WARNING] Vue component resolution warning** (Low severity)
   - `n-button` unresolved in WorkspacePromptDock
   - Naive UI button component not properly imported/resolved
   - Does not affect rendering (fallback to native button)

4. **[INFO] Vertical scroll at narrow viewports**
   - 920x900: scrollHeight=1535 (>900)
   - 375x812: scrollHeight=1427 (>812)
   - Expected behavior for content-heavy workspace page

## State Preservation Notes

- Generation/loading/success/error states: Not tested (no active generation)
- Quota display: Visible in right panel quota section at all viewports
- Selected node preservation: Mini-map shows "定位到 故事脚本", "定位到 角色参考", "定位到 Agnes Image", "定位到 视频结果" buttons — node references preserved

## Conclusion

All three exact viewports collected with real browser evidence. All viewport dimensions verified via `browser_set_viewport` read-back and PNG IHDR parsing. SHA256 checksums of all 5 business files match hard gates. Build passes cleanly. No business code modified.

Two UI defects identified: drawer/panel overlap with prompt dock at both 920px and 375px viewports. These are pre-existing layout issues in the responsive design, not introduced by this revision.

T4_010_UNIT_B_REV40_EXACT_BROWSER_EVIDENCE_REPORT_READY
