# T6-003 Unit 6M Desktop Project-Resource Escape Correction

## Trigger

The final requirement-by-requirement audit opened `项目资产` from the selected image card in an authenticated local Revid Canvas. The source-selection surface was disclosure-only: no asset was selected, no upload or generation was started, and no graph/history mutation was made.

With the desktop `项目资源` complementary panel open, the selected `项目资产` tab was explicitly focused and received Escape. The panel remained mounted (`complementaryCount = 1`). The same component already closes as a compact `920px` modal drawer because the drawer framework owns Escape, so the behavior differs only at the desktop panel boundary.

## Contract

- Escape from a focused control inside either resource presentation closes that presentation.
- Desktop closure reuses `closeResourceSurface -> closeResources -> restoreResourceFocus`.
- The exact connected opener regains focus.
- Card selection, Canvas document, history, project resources, uploads, and generation state do not change.
- Existing ArrowLeft/ArrowRight/Home/End tab navigation and compact drawer Escape remain unchanged.

## RED/GREEN Result

1. The desktop RED failed exactly at panel removal: expected `0`, received `1` after the focused `项目资产` tab received Escape.
2. `CanvasAssetPanel` now captures Escape within its own focused surface and emits the existing `close` event. No new resource state or close authority was added.
3. The focused desktop/920px keyboard contract passes. Desktop removal restores the resource trigger and preserves the document PATCH count; the compact modal drawer still restores its trigger.
4. The exact selected-card flow passes: card-source disclosure closes, focus returns to the same card's `项目资产` button, and the card work surface remains visible.

## Authenticated Runtime Result

The rebuilt local Canvas was retested without selecting an asset or mutating the graph. After Escape, the project-resource complementary count was `0`, the card work-surface count was `1`, and the active element label was `项目资产`, proving return to the source-card opener.

## Verification

- Production build: `4,972` modules.
- Focused browser contracts: `2/2`.
- Related resource/card/context/keyboard regression: `30/30`.
- Full functional Chromium: `599/599` in `10.1m`.
- Headed 200-node/300-connection performance: `2/2` in `42.1s`.
- Dependency audit: `0` vulnerabilities.
- `git diff --check`: pass with line-ending notices only.
- Project-state validation: pass with `CURRENT.md` at its `60`-line rolling-snapshot budget.
- Final hygiene: `109` owned paths, `104` UTF-8 text files, and zero UTF-8 failures, BOM files, sensitive paths, high-confidence secret signatures, or database artifacts. `CanvasAssetPanel.vue` has `319` nonblank lines.

## Human Gate

This correction does not close T6-003. Human side-by-side and interaction acceptance remains required before REPORT, `DONE / PASS`, staging, commit, push, or goal completion.
