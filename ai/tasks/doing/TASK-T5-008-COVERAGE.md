# TASK-T5-008 Acceptance Coverage Matrix

- Baseline: `f7c885e8e1ef3c0984cccdaf422c65eb72ca298a`
- Source: `ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md`
- Inventory: all 97 checkbox criteria
- Updated: 2026-07-14

## Evidence Labels

- `B`: guarded disposable-MySQL backend/API evidence exists.
- `M`: Chromium evidence exists but production API calls are route-mocked.
- `S`: static/unit/schema evidence exists.
- `V`: screenshot, computed-style, axe, or manual visual evidence exists.
- `LIVE`: required T5-008 Chromium to production FastAPI to disposable MySQL evidence.
- `RED`: a concrete baseline gap must be closed before certification.

Existing evidence remains useful, but `B + M` is not classified as `LIVE`. Every row below names the missing or final evidence needed for T5-008.

## 3. Multi-Canvas

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 3.1 | B: atomic project/default Canvas tests | LIVE create project and assert exactly `画布 1` |
| 3.2 | B: last-active invariant | LIVE archive/delete boundary keeps one active Canvas |
| 3.3 | B+M: CRUD/reorder/switch/duplicate | LIVE complete metadata journey |
| 3.4 | B+M; no backend-process restart after reorder | LIVE full-order revision, dense order, refresh and restart |
| 3.5 | B: stale/missing/duplicate/foreign; archived case not explicit | Add archived-ID rejection and no-partial-write assertion |
| 3.6 | B: duplicated IDs, parents, endpoints remapped | LIVE duplicate and compare canonical graph relations |
| 3.7 | B+M: duplicate names use IDs | LIVE duplicate-name switch proof |
| 3.8 | M: switch flush behavior | LIVE pending save completes before document navigation |
| 3.9 | M partial: failed flush blocks and stores recovery | RED: assert retry and preserve-local-copy actions end to end |
| 3.10 | B+M: graph/view/history Canvas scope | LIVE switch/reopen isolation checksum |
| 3.11 | B+M: project resources shared | LIVE resources visible from two Canvases and after restart |
| 3.12 | B+S: cross-Canvas endpoint constraint | Re-run guarded DB/API rejection |
| 3.13 | B+M separated | LIVE refresh and backend restart restore selected graph/viewport |

## 4. Infinite Canvas

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 4.1 | M+V: full-screen shell at four viewports | LIVE screenshots and bounding-box check |
| 4.2 | B+M: positive/negative coordinates | LIVE save/refresh/restart exact coordinate proof |
| 4.3 | M+S: 10%-800%, numeric and presets | LIVE control matrix |
| 4.4 | Anchored zoom implementation; repeated drift unproved | RED: repeated pointer/center cycles with tolerance |
| 4.5 | M+S: graph and selection fit | LIVE `Ctrl+0` and multi-selection fit |
| 4.6 | M performance covers middle drag only | RED: Space-drag and middle-drag live checks |
| 4.7 | M: minimap/edges/grid toggles | LIVE independent toggles and retained state |
| 4.8 | Grid implementation exists; accepted-zoom visibility unproved | RED: computed visibility at representative zoom levels |
| 4.9 | M+S: stable arrange and undo | LIVE non-overlap, one undo command |
| 4.10 | No workflow-starter/explicit blank-path acceptance test | RED: implement or prove both paths |

## 5. Selection And Editing

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 5.1 | M: single selection | LIVE pointer selection |
| 5.2 | M: modifier toggle | LIVE additive/removal selection |
| 5.3 | M: marquee; additive marquee not explicit | RED: additive intersection selection |
| 5.4 | M: selected multi-drag one command | LIVE movement plus one persisted mutation |
| 5.5 | M+S: duplicate internal graph | LIVE `Ctrl+D` IDs/edges |
| 5.6 | M+S: group/ungroup | LIVE keyboard grouping |
| 5.7 | M partial: node delete; focus/input/dialog ownership incomplete | RED: Canvas-owned node/edge delete and blocked foreign focus |
| 5.8 | Backspace browser safety partially covered | RED: focused text input preserves graph and navigation |
| 5.9 | Implementation uses `Ctrl+L`; valid browser test uses another chord | RED: valid/invalid `Ctrl+L` behavior and message |
| 5.10 | M+S: duplicate/invalid-port rejection | LIVE specific messages without mutation |
| 5.11 | Accessible edge entry exists; keyboard delete not executed | RED: reach, select, delete one connection by keyboard |
| 5.12 | M: align/lock; distribute UI not explicit | RED: align, distribute, lock, unlock valid selections |
| 5.13 | M: pointer profile and pointerup save | LIVE request audit: zero pointermove API, one pointerup mutation |
| 5.14 | S+M: typed replay/inversion contract | Re-run command/history regression |

## 7. Node Registry

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 7.1 | S+M: one registry defines all required fields | Re-run registry contract |
| 7.2 | S+M: future node safe unsupported round trip | LIVE load/save preserves raw future payload |
| 7.3 | S+M+V: real previews or labeled placeholders | LIVE resource preview and visual inspection |
| 7.4 | S+B: audio asset, no audio generation | Re-run capability and route-absence checks |
| 7.5 | B: success/failure survives engine restart | LIVE history after backend-process restart |
| 7.6 | B+M: quota revision comes from response | LIVE monotonic server quota snapshot |
| 7.7 | S+B: provider mocks default | Confirm no paid call and no real provider credential use |

## 8. Persistence, Conflict, And History

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 8.1 | B: one consistent document | LIVE response/load checksum |
| 8.2 | B+M: base revision and mutation ID | LIVE request capture through server evidence |
| 8.3 | B: transactional idempotency ordering | Re-run guarded MySQL concurrency/transaction suite |
| 8.4 | B+M: stale 409 and no overwrite | LIVE two-session conflict |
| 8.5 | B: identical retry returns original | LIVE response-loss retry with unchanged write count |
| 8.6 | B: fingerprint mismatch 409 | Re-run exact mutation-ID conflict |
| 8.7 | S+M: 100 Canvas-scoped commands | Re-run 101-command boundary and switch isolation |
| 8.8 | B: latest 50 plus checkpoints | Re-run guarded retention reconstruction |
| 8.9 | B+M: restore creates new head | LIVE restore and revision comparison |
| 8.10 | M: Saving then Saved under one second | LIVE timing measurement |
| 8.11 | M: offline/error/local recovery | LIVE server outage, retry, and retained local command |
| 8.12 | M partial: switch/route/pagehide; no real close/reopen | RED: close/reopen plus retry/preserve path |
| 8.13 | B+M: separate debounced viewport revision | LIVE viewport save leaves graph revision unchanged |

## 9. Visual

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 9.1 | V: graphite/violet surfaces | LIVE four-viewport screenshot inspection |
| 9.2 | V+S: one violet semantic family | Token/computed-style audit |
| 9.3 | V+S: green/amber/red semantics | State screenshot/computed-style audit |
| 9.4 | M+V: compact project/Canvas identity | LIVE screenshot inspection |
| 9.5 | M+V: contextual bottom dock | LIVE overlap check at supported viewports |
| 9.6 | M+V: required bottom-left controls | LIVE control presence and labels |
| 9.7 | M+V: asset panel resize/collapse | LIVE resize/collapse behavior |
| 9.8 | M+V: contextual inspector | LIVE empty/selection context assertions |
| 9.9 | M+V: contextual content/generation editor | LIVE selected-node context assertion |
| 9.10 | S+V: depth and forbidden-style audit | Fresh CSS/token and screenshot review |
| 9.11 | M+V: media/results visual anchors | LIVE resource screenshot inspection |

## 10. Performance

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 10.1 | M: mocked 200/300 stable render passes | LIVE MySQL document load plus stable render <=3s |
| 10.2 | M: shortened scripted profile passes | LIVE approved 30-second profile >=55 FPS |
| 10.3 | M: frame p95 passes | LIVE frame p95 <=33ms |
| 10.4 | M: pointer p95 passes | LIVE pointer p95 <=50ms |
| 10.5 | M: observed long tasks pass | LIVE no interaction task >=200ms |
| 10.6 | M: minimap cap passes | LIVE update rate and raw trace |
| 10.7 | S+M: transform-only viewport | Re-run renderer reconciliation and live trace |
| 10.8 | S+M: keyed incremental visuals | Re-run renderer reconciliation and live mutations |
| 10.9 | M: switch listener/heap bound | LIVE 20 switches with CDP/listener evidence |
| 10.10 | No live 200/300 persistence checksum | RED: save/close/reopen/restart exact checksum |

## 11. Accessibility

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 11.1 | S+M: `zh-CN` | LIVE document language assertion |
| 11.2 | M+V: labels/tooltips/target sizes | LIVE all icon-control audit |
| 11.3 | M+V: non-color state labels | LIVE focus/selection/save/conflict assertions |
| 11.4 | M: synchronized DOM graph list | LIVE locate/select/inspect/delete flow |
| 11.5 | S+V: focus contrast tokens | Fresh computed contrast >=3:1 |
| 11.6 | S+V: body contrast tokens | Fresh computed contrast/WCAG AA |
| 11.7 | M+V: reduced-motion variables | LIVE animation/transition audit under reduce |
| 11.8 | M: keyboard graph review/panels | LIVE keyboard-only complete journey |
| 11.9 | M: selected controls at 200% | LIVE every critical Chinese control accessible |
| 11.10 | M+V: mobile review-only | LIVE no edit/delete/upload/template-use/generation actions |

## 12. Failure And Security

| ID | Baseline | T5-008 certification target |
|---|---|---|
| 12.1 | S partial: missing/wrong/revision; unreachable/missing table not explicit | RED: all five fail-closed runtime cases |
| 12.2 | S: MySQL-only active runtime | Re-run forbidden fallback scan/runtime gate |
| 12.3 | B: authentication/ownership negatives | LIVE anonymous and foreign-owner API/browser checks |
| 12.4 | B+S: cross-project/cross-Canvas constraints | Re-run schema/API rejection |
| 12.5 | M: future schema safe render; server preservation not explicit | RED: rejected/round-tripped future payload leaves document exact |
| 12.6 | B+M partial: targeted failures | RED: representative API/provider/save active-voice retry messages |
| 12.7 | Prior report hygiene only | Add reproducible redacted log/evidence scan |
| 12.8 | Prior report hygiene only | Add path/line/fingerprint-only candidate scanner assertion |
| 12.9 | Process rule documented | Prove harness touches only owned schema/runtime paths; no `.db` deletion |

## Unit A RED Set

The first implementation pass is limited to the harness and the explicit RED items above. Product code changes require a reproduced failing test. Existing B/M/S/V evidence is rerun only where it completes or supports a LIVE journey; it is never relabeled as live evidence by assertion alone.
