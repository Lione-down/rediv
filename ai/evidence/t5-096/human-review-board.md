# T5-096 Human Review Board

- State: `ACCEPTED_WITH_DECLARED_BOUNDARIES`
- Review authority: Human Owner
- Decision date: `2026-07-20`
- Product scope: Director/`导演台` is `HUMAN_EXCLUDED_NOT_APPLICABLE`. It has no Revid implementation, entry, placeholder, disabled action, imitation, or parity counter.
- Add menu scope: exactly 9 Revid actions.
- Color rule: compare structure, hierarchy, geometry, behavior, and focus; Revid retains its graphite/violet semantic color base.

## Raw screenshot pairs

| Scenario | Official raw evidence | Revid raw evidence | Automated evidence scope |
|---|---|---|---|
| Empty 1440x900 / 100% | `output/t5-096/official/2026-07-20/libtv-empty-canvas-exact-1440x900-100pct.jpg` | `output/t5-096/revid/2026-07-20/revid-empty-1440x900-100pct.png` | Exact viewport snapshot and shell assertions |
| Empty 1366x768 / 100% | `output/t5-096/official/2026-07-20/libtv-empty-canvas-exact-1366x768-100pct.jpg` | `output/t5-096/revid/2026-07-20/revid-empty-1366x768-100pct.png` | Exact viewport snapshot and responsive assertions |
| Empty 920x900 / 100% | `output/t5-096/official/2026-07-20/libtv-empty-canvas-exact-920x900-100pct.jpg` | `output/t5-096/revid/2026-07-20/revid-empty-920x900-100pct.png` | Exact viewport snapshot and compact assertions |
| Empty 1440x900 / 17% | `output/t5-096/official/2026-07-20/libtv-empty-canvas-exact-1440x900-17pct.jpg` | `output/t5-096/revid/2026-07-20/revid-empty-1440x900-17pct.png` | Zoom/fixed-chrome assertions |
| Empty 1440x900 / 36% | `output/t5-096/official/2026-07-20/libtv-empty-canvas-exact-1440x900-36pct.jpg` | `output/t5-096/revid/2026-07-20/revid-empty-1440x900-36pct.png` | Zoom/fixed-chrome assertions |
| Empty 1440x900 / 200% | `output/t5-096/official/2026-07-20/libtv-empty-canvas-exact-1440x900-200pct.jpg` | `output/t5-096/revid/2026-07-20/revid-empty-1440x900-200pct.png` | Exact zoom/fixed-chrome assertions |
| Populated 1440x900 | `output/t5-096/official/2026-07-20/libtv-official-share-populated-exact-1440x900-28pct.jpg` | `output/t5-096/revid/2026-07-20/revid-populated-1440x900-fit.png` | 11 outer landmarks: 0% tolerant edge difference at 2px; this is not a pixel/typography/port/shadow gate |
| Populated 1366x768 | `output/t5-096/official/2026-07-20/libtv-official-share-populated-exact-1366x768-28pct.jpg` | `output/t5-096/revid/2026-07-20/revid-populated-1366x768-fit.png` | Exact viewport browser snapshot; Human accepted declared visual boundary |
| Populated 920x900 | `output/t5-096/official/2026-07-20/libtv-official-share-populated-exact-920x900-28pct.jpg` | `output/t5-096/revid/2026-07-20/revid-populated-920x900-fit.png` | Exact viewport browser snapshot; Human accepted declared visual boundary |
| Selected media | `output/t5-096/official/2026-07-20/libtv-official-share-image-selected-exact-1440x900-39pct.jpg` | `output/t5-096/revid/2026-07-20/revid-image-selected-1440x900-100pct.png` | Context exclusivity and Revid focus/dismissal assertions; Human accepted declared visual boundary |
| Selected high zoom | `output/t5-096/official/2026-07-20/libtv-official-share-image-selected-exact-1440x900-207pct.jpg` | `output/t5-096/revid/2026-07-20/revid-image-selected-1440x900-200pct.png` | Official public-share 207% / Revid 200% boundary; Human accepted declared zoom boundary |

## 17-scenario action, focus, and mutation matrix

Every mapped primary assertion below is present in the `chromium` JSON reporter artifact and passed in the dedicated `34/34` run. The Human Owner accepted every row with the declared evidence boundaries on 2026-07-20.

| Scenario | Official action and visible result | Revid mapped action/result | Focus or dismissal | Mutation boundary | Human decision |
|---|---|---|---|---|---|
| `L096-SHELL-EMPTY-1440` | Open exact 1440x900 at 100%; dotted shell, 4 starters, horizontal rail, no permanent sidebar | Exact empty-matrix browser assertion | Baseline; no content field focused | 0 nodes / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-SHELL-EMPTY-1366` | Resize to exact 1366x768; shell and rail remain available | Exact empty-matrix browser assertion | Viewport change preserves Canvas state | 0 nodes / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-SHELL-EMPTY-920` | Resize to exact 920x900; compact shell retains rail and view controls | Exact empty-matrix browser assertion | Viewport change preserves Canvas state | 0 nodes / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-ZOOM-EMPTY-17` | Enter 17 in zoom input; world scales while chrome stays fixed | Exact empty-matrix zoom assertion | Enter commits and closes zoom surface | 0 nodes / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-ZOOM-EMPTY-36` | Enter 36; transition settles at 36% | Exact empty-matrix zoom assertion | Controlled input is reacquired; Enter closes | 0 nodes / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-ZOOM-EMPTY-200` | Enter 200; empty Canvas settles at 200% | Exact empty-matrix zoom assertion | Enter commits; disclosure closes | 0 nodes / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-DISCLOSURE-ADD-ESC` | Open Add over zoom; ordered Escape dismissal; official inventory observed | Revid Add exposes exactly 9 actions and omits Director | Exclusive surface closes with Escape and restores owner | No insertion / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-RAIL-DISCLOSURES-EMPTY-NATIVE` | Open/dismiss rail surfaces without invoking create/upload/generation | Revid rail geometry and native disclosure routing assertion | Same owner, Escape, or named close dismisses | Disclosure-only / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-AGENT-EMPTY-NATIVE` | Open empty Agent panel; Send remains disabled; close | Revid Agent/Skill closed preflight opens accessible and mock-only | Named close restores Canvas | No provider call / no graph mutation | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-STORYBOARD-EMPTY-NATIVE` | Switch to empty Storyboard sections and back to Workflow | Revid truthful Storyboard projection assertion | Active view returns to Workflow | No persistence write | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-ASSET-MANAGER-EMPTY-NATIVE` | Open asset manager; inspect empty state; do not upload; collapse | Revid resource/history drawer keyboard assertion | Search focus is contained; close restores Canvas | No upload/insertion / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-MINIMAP-EMPTY-NATIVE` | Toggle empty minimap | Revid independent minimap toggle assertion | Toggle remains active owner | View-only / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-GUIDE-NODES-WORKFLOW-SHELL` | Read official guide sections for node/workflow/shell behavior | Revid group creation, history, reload, and movement regression | Revid keyboard/selection ownership asserted | Mock/local persistence only; no paid call | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-SHARE-POPULATED-EXACT-MATRIX` | Inspect read-only populated share at 3 viewports; Director region is source context only | Revid lawful 10-node + 1-group + 11-edge fixture; 1440 outer-landmark gate | No graph-changing control focused | Read-only official; deterministic Revid fixture | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-SHARE-IMAGE-SELECTED` | Select media, inspect panorama controls, use named Exit | Revid selected-media/context exclusivity assertion | Named Exit/Escape restores graph context | Selection only / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-SHARE-POPULATED-HIGH-ZOOM-BOUNDARY` | Public share rejects exact 200; deterministic nearest state is 207% | Revid exact 200% selected-media geometry assertion | Zoom owner remains operable | View-only / no graph mutation | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |
| `L096-SHARE-FOCUS-RESTORATION-BOUNDARY` | Panorama Exit restores zoom control; Escape clears context and returns BODY | Revid exclusive context closes and restores documented Revid owner | Official and Revid focus owners are recorded, not assumed identical | Context-only / no PATCH | `ACCEPTED_WITH_DECLARED_BOUNDARIES` |

## Declared evidence boundaries requiring Human judgment

1. The 2px/2% automatic comparison proves only 11 outer rectangles in the populated 1440x900 state. Typography, labels, icons, ports, edge curves, selection outline, shadow, motion, and the 1366/920 populated pairs remain Human visual judgments.
2. Official paid or mutating paths were not invoked: upload, provider Send, generation/retry/result mutation, group mutation, replace/download, and reload-after-mutation. Revid mock/native regressions prove Revid safety, not official real-provider parity.
3. Official guide section `1.4.2 画布左侧栏` and the authenticated Add disclosure place upload under Add/添加资源. Revid preserves that authority in its nine-action Add catalog and removes the duplicate node-local empty-media upload/recovery strip.
4. Director/`导演台` is already decided and is not part of this review.

## Human decision

After inspecting the raw pairs and the 17 rows, choose one:

- `ACCEPT_WITH_DECLARED_BOUNDARIES`: accept the visible result within the color, native-editing, read-only official, and 200/207 boundaries above.
- `CHANGES_REQUESTED`: name the scenario ID and the exact visual, functional, focus, or mutation difference.

The Human Owner selected `ACCEPT_WITH_DECLARED_BOUNDARIES` on 2026-07-20. REPORT, exact staging, commit, push, and final state synchronization are authorized.
