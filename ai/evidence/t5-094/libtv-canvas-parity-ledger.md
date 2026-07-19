# T5-094 LibTV Canvas clean-room parity ledger

- Ledger version: `1`
- Collected: `2026-07-18`
- Scope: publicly observable or Human-authorized LibTV Canvas surfaces only
- Status vocabulary: `MATCHED`, `BLOCKED`, `NOT_OBSERVABLE`
- Color exception: only semantic color mapping may differ; brand, copy, assets, fonts, icons, prompts, private source, and internal contracts are never copied.

## Evidence registry

| Evidence ID | Source | Observed date | Version clue | Viewport / capture | Confidence | Boundary |
|---|---|---:|---|---|---|---|
| `L-PUBLIC-HOME` | `https://www.liblib.tv/` read-only public browser | 2026-07-18 | current public landing; Agent and Seedance 2.0 banner | browser default desktop | High | No login, prompt submission, generation, payment, or account action. |
| `L-PUBLIC-CANVAS` | `https://www.liblib.tv/canvas` read-only public browser | 2026-07-18 | current public route | browser default desktop | High | Redirected to public home and displayed login acquisition UI; authenticated Canvas is not publicly observable. |
| `L-OFFICIAL-SKILL` | `https://github.com/libtv-labs/libtv-skills` | 2026-07-18 | public repository main; 7 commits visible | N/A | High | Official LibTV organization repository; API/session facts only, not private Canvas implementation. |
| `L-OFFICIAL-TERMS` | `https://www.liblib.art/activities/468ad794ccc7408d81757fd91be003ec` | 2026-07-18 | terms effective 2026-05-17 | N/A | High | Confirms LibTV ownership/account boundary; also forbids unauthorized scraping/reverse engineering. |
| `L-SS-03` | `output/playwright/libtv-03.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Human-authorized retained reference; blank Canvas shell. |
| `L-SS-04` | `output/playwright/libtv-04.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Add-node menu. |
| `L-SS-05` | `output/playwright/libtv-05.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Text node and output continuation menu. |
| `L-SS-06` | `output/playwright/libtv-06.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Text-to-image branch, selected empty image, composer. |
| `L-SS-07` | `output/playwright/libtv-07.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Generated image stack, edge draft, empty image state. |
| `L-SS-08` | `output/playwright/libtv-08.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Connected selected image and focus composer. |
| `L-SS-09` | `output/playwright/libtv-09.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Generated-image toolbar and expanded composer. |
| `L-SS-10` | `output/playwright/libtv-10.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Lighting panel. |
| `L-SS-11` | `output/playwright/libtv-11.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Video player node and video composer. |
| `L-SS-12` | `output/playwright/libtv-12.png` | retained 2026-07-15 | March 2026 public product-review capture | 1080x820 image; embedded desktop Canvas | High | Dense graph overview and continuation menu. |
| `R-014-015` | `ai/reports/REPORT-T5-014.md`, `ai/reports/REPORT-T5-015.md` | 2026-07-15 | Revid delivered baseline | 1440x900, 1366x768, 920x900, 375x812; zoom 10/100/200 | High | Route-mocked browser plus guarded real-MySQL/browser evidence. |
| `R-080-091` | T5-080 through T5-091 Tasks/reports and current code/tests | 2026-07-17 | current Revid Canvas capabilities | deterministic browser fixtures | High | Revid-owned behavior; mock-only/provider-unavailable boundaries remain explicit. |
| `R-094-U3` | `frontend/tests/e2e/canvas-script-generation.spec.ts` and T5-094 Unit 3 code | 2026-07-18 | capability v5 | 1440 desktop fixture plus 375 review-only regression | High | Browser mock; no real Agnes call. |

Evidence IDs in the item tables inherit the registry's source, date, version clue, viewport, confidence, and boundary. When several IDs are listed, the exact fact is supported by their intersection, not by an inferred private implementation.

## A. Canvas shell and navigation

| ID | Evidence | Exact observable fact | Revid evidence / current state | Status | Release condition |
|---|---|---|---|---|---|
| `A01` | `L-SS-03` | Canvas is the dominant full-window dark surface with a sparse dot grid and minimal chrome. | Unit 5A/5H proves the Canvas surface fills the workspace, uses a measured 24px sparse dot grid at 100%, and keeps identity/rail/zoom chrome within bounded footprints. | `MATCHED` | Retain full-window/grid/chrome numeric assertions. |
| `A02` | `L-SS-03` | Top-left shows compact brand/project identity and editable unnamed title on one line. | Unit 5A places Revid/project and the editable Canvas switcher on one compact line with a measured height of at most 52px. | `MATCHED` | Retain `canvas-libtv-shell-parity.spec.ts` identity geometry evidence. |
| `A03` | `L-SS-03` | Top-right places share, notification, membership/points, and avatar controls in a compact row. | Revid exposes revision/sync/account controls; share/notification/membership semantics do not exist. | `BLOCKED` | Human-approved share/notification/product contract or an honest unavailable surface; do not fabricate membership. |
| `A04` | `L-SS-03` | A fixed left vertical toolbar provides add, graph/workflow, a creative tool, history, and help. | Revid's fixed left rail now reuses add, resources/view, professional actions, revision history, and Graph Access/help; revision close restores rail focus. | `MATCHED` | Retain rail inventory and revision focus-restoration browser assertions. |
| `A05` | `L-SS-03` | Bottom-left combines collaboration/link controls with `-`, current zoom, and `+`. | The bottom-left group now keeps collaboration/link visible as explicitly unavailable controls beside decrement, numeric zoom, and increment. | `MATCHED` | Retain disabled honesty and zoom geometry assertions. |
| `A06` | `L-SS-03` | Empty Canvas provides a centered double-click hint. | Unit 5A adds a centered hint backed by the existing tested double-click insert path. | `MATCHED` | Retain shell parity plus existing double-click persistence tests. |
| `A07` | `L-SS-03` | Empty Canvas presents four horizontally arranged creation suggestions. | Unit 5A exposes four Revid-owned workflow starters in one desktop/compact strip; mobile review-only remains non-mutating. | `MATCHED` | Retain four-entry and review-only browser assertions. |
| `A08` | `L-SS-03`,`L-SS-12` | Canvas supports wide panning and overview zoom while chrome stays screen-fixed. | Revid pan/zoom and fixed chrome are verified. | `MATCHED` | Retain `R-014-015` zoom/pan and viewport tests. |
| `A09` | `L-SS-12` | Overview can show a large graph with low visual noise. | Unit 5H combines the existing guarded 200-node/300-connection threshold with a 72-node/72-edge 36%/17% visual geometry scenario and low-zoom edge attenuation. | `MATCHED` | Retain dense-overview browser and performance evidence. |
| `A10` | `L-PUBLIC-HOME` | Public home exposes prompt, attachment, model, Skill, generation-mode, and Send controls. | T5-095 corrects the former control-presence-only match: Project Resources now stages removable attachments without graph mutation; script Send persists a canonical source, invokes the existing authenticated script-authoring path with owned public-image references, and produces an editable lineage result; model loading/failure has explicit retry and retains input. | `MATCHED` | Retain attachment-with-zero-mutation, exact-input, one script-authoring request, lineage, capability-retry, persistence, and fail-closed reference browser/backend assertions. |
| `A11` | `L-PUBLIC-HOME` | Public home exposes TV Show search and categories including selected canvases and production genres. | Revid has projects/templates/resources but not this discovery surface. | `NOT_OBSERVABLE` | Canvas parity cannot infer whether discovery is part of authenticated Canvas; Human evidence required. |
| `A12` | `L-PUBLIC-CANVAS`,`L-OFFICIAL-TERMS` | Unauthenticated direct Canvas access returns to public home and asks for login. | Revid unauthenticated project/Canvas routes require login. | `MATCHED` | Retain auth redirect tests. |

## B. Node catalog, geometry, and contextual surfaces

| ID | Evidence | Exact observable fact | Revid evidence / current state | Status | Release condition |
|---|---|---|---|---|---|
| `B01` | `L-SS-04` | Add menu lists text, image, video, audio, script Beta, upload, and library selection. | Unit 5B maps the same seven observable categories to Revid canonical text/image/video/audio/script plus safe upload/library actions; Revid truthfully labels script as formal rather than copying a stale Beta claim. | `MATCHED` | Retain seven-entry catalog and resource-routing browser assertions; B20 remains separately classified. |
| `B02` | `L-SS-05` | Text node title is outside the bordered content body. | Revid semantic geometry has external labels. | `MATCHED` | Retain LibTV parity geometry test. |
| `B03` | `L-SS-05` | Text content body is a light bordered editable surface without a generic header card. | Revid uses a compact content-shaped authoring surface, external label, and detached editor; pure/browser geometry bounds prove it does not regress into a generic header card. | `MATCHED` | Retain semantic presentation and selected composer geometry tests. |
| `B04` | `L-SS-05` | Text node exposes a small output port at its right edge. | Revid typed script output port exists. | `MATCHED` | Retain typed-port tests. |
| `B05` | `L-SS-06`,`L-SS-08` | Empty image node uses a media-proportional placeholder with external title and side ports. | Revid supports media-shaped nodes and fallback content. | `MATCHED` | Retain ratio/fallback/port geometry tests. |
| `B06` | `L-SS-06` | Empty image node has an upload affordance above the media surface. | Unit 5B adds a node-local upload entry above empty media and routes it to the existing authenticated Project Resources upload contract. | `MATCHED` | Retain empty-media-to-Project-Resources browser test. |
| `B07` | `L-SS-07`,`L-SS-09` | Generated image itself is the node body, preserves ratio, and shows a restrained stacked-version offset. | Selected multi-result lineage now adds a measured 6px restrained backplate while every canonical result remains a separate locatable graph node. | `MATCHED` | Retain version-stack geometry and graph-identity assertions. |
| `B08` | `L-SS-07`,`L-SS-09` | Generated media shows an external node label and a small resolution badge. | Unit 5B preserves external labels and adds a compact natural-width × natural-height badge after successful media metadata load. | `MATCHED` | Retain real decoded-dimension browser assertion. |
| `B09` | `L-SS-11` | Video node body is a native player with play, time, duration, volume, and capture controls. | Revid has native playback, seek/volume, CORS fallback, and frame capture. | `MATCHED` | Retain T5-048/049/062/066 browser evidence. |
| `B10` | `L-SS-11` | Selected video keeps its player as the visual anchor and places composer below. | Revid keeps the native player as the node body, places the selected keyframe rail below it, and keeps full generation/reference controls in the visible Context Panel. | `MATCHED` | Retain native playback, keyframe placement, and generation editor evidence. |
| `B11` | `L-SS-05`,`L-SS-06` | Selected node composer is attached below the node and does not replace the node body. | Revid detached composer behavior exists. | `MATCHED` | Retain authoring/geometry tests. |
| `B12` | `L-SS-09` | Image composer has compact mode tiles, a large prompt field, and one bottom parameter/action row. | The selected generation editor keeps prompt, capability controls, connected context, compact submission summary, and submit in one bounded contextual hierarchy without obscuring the Canvas node. | `MATCHED` | Retain image/video generation editor structure assertions. |
| `B13` | `L-SS-09` | Image composer exposes visible model, aspect ratio, resolution, camera controls, language/control, count, cost, and submit. | Image capability controls expose model/size, aspect, shot controls, quota, one-output contract, an honest unavailable cost estimate, and submit. | `MATCHED` | Retain capability-owned image editor browser matrix. |
| `B14` | `L-SS-11` | Video composer exposes reference modes/frames, prompt, model, aspect, duration, audio state, count/cost, and submit. | Video controls expose ordered references/keyframes, prompt, model/size, aspect, duration, one output, honest unavailable audio/cost state, and submit. | `MATCHED` | Retain capability-owned video editor browser matrix. |
| `B15` | `L-SS-09` | Selected generated image reveals a horizontal toolbar above the node. | Unit 5E adds a selected owned-media toolbar 6–10px above the canonical media surface with deterministic geometry. | `MATCHED` | Retain `selected owned image exposes contextual actions without fabricating unsupported execution`. |
| `B16` | `L-SS-09` | Toolbar includes HD/upscale, expand, multi-angle, lighting, repaint, erase, cutout, grid, brush, crop, download, fullscreen. | Existing image operations route through exact capability/eligibility-filtered Palette actions; multi-angle, lighting, brush, crop, and inapplicable grid remain visibly disabled rather than fabricated. | `MATCHED` | Retain action inventory, disabled-state, and exact Palette-filter assertions. |
| `B17` | `L-SS-10` | Lighting opens a compact floating panel with perspective/front, smart mode, brightness/color, six light directions, rim light, reset, cost, submit. | Revid shot lighting is a bounded capability control, not this spatial-light panel. | `BLOCKED` | Human-approved long-term control contract/ADR or an honest unavailable panel matching the observed structure. |
| `B18` | `L-SS-05` | Right-port continuation menu lists text/image/video/audio/script near the source node. | Unit 5C shows text/image/video/audio/script beside the selected output; audio is visibly disabled because Revid has no authorized execution, while the other four retain typed atomic insertion. | `MATCHED` | Retain five-category menu, disabled boundary, insertion, and undo browser assertions. |
| `B19` | `L-SS-12` | Continuation menu remains usable at overview zoom near the target branch. | Unit 5C proves the menu stays inside the workspace and touches/overlaps the source trigger's horizontal neighborhood at 100%, 36%, and 17%. | `MATCHED` | Retain numeric overview-zoom geometry scenario. |
| `B20` | `L-SS-04` | Script node is visibly marked Beta in the add menu. | Revid script is canonical production behavior, not Beta. | `NOT_OBSERVABLE` | Product maturity labels are version-specific and should not be copied without current authenticated evidence. |
| `B21` | `L-SS-04` | Audio is a first-class add-menu node type. | Unit 5B exposes first-class canonical audio-asset insertion while the existing audio-generation preflight remains visibly unavailable/mock-only; no execution is fabricated. | `MATCHED` | Retain audio node insertion plus unavailable-preflight tests. |
| `B22` | `L-SS-04` | Upload and library selection are first-class resource insertion actions. | Revid has Project Resources upload and asset insertion. | `MATCHED` | Retain resource ownership/upload browser tests. |

## C. Graph interaction, selection, and overview

| ID | Evidence | Exact observable fact | Revid evidence / current state | Status | Release condition |
|---|---|---|---|---|---|
| `C01` | `L-SS-06` | Connections are thin, curved, low-contrast, and directionally readable. | Revid uses quiet curved typed edges, though selected/draft styling differs. | `MATCHED` | Retain T5-014/015 edge geometry tests. |
| `C02` | `L-SS-07`,`L-SS-08` | Active connection creation locally highlights a blue-white flow near the manipulated edge. | Revid has active-only local flow animation. | `MATCHED` | Retain T5-080 motion tests and reduced-motion override. |
| `C03` | `L-SS-05`,`L-SS-08` | Ports are small circles on node side midpoints, with local emphasis during connection. | Revid has typed screen-stable targets and small visible ports. | `MATCHED` | Retain T5-080 geometry/target tests. |
| `C04` | `L-SS-07`,`L-SS-12` | One source can branch to several downstream media nodes. | Revid supports result/source continuation and branches. | `MATCHED` | Retain branch/continuation tests. |
| `C05` | `L-SS-12` | Dense graphs keep media nodes readable at low zoom while edges recede. | Unit 5H proves intrinsic media geometry at 36%/17% while idle edges step down to 0.58/0.42 opacity and 1.2/1px stroke. | `MATCHED` | Retain numeric low-zoom media and edge assertions. |
| `C06` | static captures only | Marquee selection behavior is not shown. | Revid supports multi-selection and aggregate hull. | `NOT_OBSERVABLE` | Human video/read-only authenticated evidence required. |
| `C07` | static captures only | Group/ungroup and descendant movement are not shown. | Revid supports groups/storyboard groups and whole-group movement. | `NOT_OBSERVABLE` | Human evidence required before claiming LibTV parity. |
| `C08` | static captures only | Batch port behavior is not shown. | Revid supports multi-selection continuation. | `NOT_OBSERVABLE` | Human evidence required. |
| `C09` | static captures only | Edge reroute/reconnect/delete behavior is not shown. | Revid supports reroute, insertion, Graph Access deletion. | `NOT_OBSERVABLE` | Human evidence required. |
| `C10` | static captures only | Context-menu structure is not shown. | Revid has node/Canvas context menus. | `NOT_OBSERVABLE` | Human evidence required. |
| `C11` | static captures only | Duplicate/copy/paste semantics are not shown. | Revid has copy/duplicate commands and remapping. | `NOT_OBSERVABLE` | Human evidence required. |
| `C12` | `L-SS-12` | Overview shows many incoming/outgoing lines without arrowhead-heavy chrome. | Unit 5H scales overview arrow markers from 7 to 5/4 and attenuates idle edges while preserving selected/provenance emphasis. | `MATCHED` | Retain marker-size and edge-emphasis assertions. |
| `C13` | `L-SS-03`,`L-SS-12` | Zoom readout and +/- controls remain fixed and readable across 100%, 36%, and 17% observed views. | Revid controls support 10-800%, fit and screen-fixed behavior. | `MATCHED` | Retain zoom tests; add exact 17/36 targets to manifest. |
| `C14` | static captures only | Minimap presence is not observed in LibTV captures. | Revid has a minimap. | `NOT_OBSERVABLE` | Do not remove or claim parity without evidence; Revid safety/navigation enhancement remains. |
| `C15` | static captures only | Undo/redo/history mutation semantics are not shown; only a history icon is visible. | Revid has command history/revision recovery. | `NOT_OBSERVABLE` | Human interaction evidence required. |

## D. Generation lifecycle, results, and errors

| ID | Evidence | Exact observable fact | Revid evidence / current state | Status | Release condition |
|---|---|---|---|---|---|
| `D01` | `L-SS-06`,`L-SS-08` | Empty image node displays neutral placeholder, node-local upload, and a selected composer. | Selected empty media keeps the neutral body and exposes a node-local recovery toolbar below it, with Project Resources upload as the active path. | `MATCHED` | Retain selected empty-media recovery/browser geometry evidence. |
| `D02` | `L-SS-07` | Generated result replaces the empty media body and can visibly stack multiple versions. | Durable result nodes keep intrinsic media bodies and expose a restrained selected-family stack without collapsing graph identities. | `MATCHED` | Retain version-stack and lineage tests. |
| `D03` | `L-SS-07` | Empty image node offers recovery actions such as original-image generation and HD image. | Upload is executable; original-image generation and HD repair stay visible and disabled until a valid source/capability exists. | `MATCHED` | Retain disabled non-mutation and Project Resources routing assertions. |
| `D04` | `L-SS-09` | Output count and cost are visible before submission. | The pre-submit summary states the current one-output contract and explicitly reports cost estimate unavailable rather than inventing a value. | `MATCHED` | Retain capability-owned submission-summary tests. |
| `D05` | `L-SS-11` | Generated video is playable directly on Canvas. | Revid native Canvas playback is verified. | `MATCHED` | Retain video playback regression. |
| `D06` | `L-SS-09`,`L-SS-11` | Image/video results retain downstream output ports for continuation. | Revid result nodes expose downstream result ports and continuation. | `MATCHED` | Retain lineage/continuation tests. |
| `D07` | `L-SS-09` | Generated image can be downloaded and viewed fullscreen from contextual toolbar. | Unit 5E exposes direct download and fullscreen only after current-project/current-user/active-asset/type/URL checks pass. | `MATCHED` | Retain fail-closed resolver and fullscreen-target browser assertions. |
| `D08` | `L-SS-11` | Video composer displays reference thumbnails/roles above the prompt. | Revid preserves ordered multi-reference roles and provenance in Context Panel. | `MATCHED` | Retain T5-050/051/052/059 evidence. |
| `D09` | static captures only | Queued/running progress percentage and cancellation timing are not shown. | Revid has durable queued/running/stage/percent/cancel boundaries. | `NOT_OBSERVABLE` | Human video or captured lifecycle evidence required. |
| `D10` | static captures only | Provider rejection/400 presentation is not shown. | Revid now has typed actionable failures and deterministic guard. | `NOT_OBSERVABLE` | Human/provider surface evidence required; no real call without authorization. |
| `D11` | static captures only | Timeout, stale result, retry, and prior-result preservation are not shown. | Revid explicitly handles all four. | `NOT_OBSERVABLE` | Human interaction evidence required. |
| `D12` | static captures only | Result compare/replace semantics are not shown beyond visual stacking. | Revid has compare tray, explicit replace, lineage, and history. | `NOT_OBSERVABLE` | Human evidence required to compare interaction path. |
| `D13` | `L-SS-09`,`L-SS-10` | Image operations are progressive-disclosure contextual actions, not permanent node chrome. | Revid actions are contextual/Palette-driven. | `MATCHED` | Retain progressive-disclosure accessibility tests. |
| `D14` | `L-SS-10` | Image operation panel keeps source image visible behind the floating panel. | Revid's contextual operation controls preserve the full Canvas/source behind the panel; unsupported lighting remains a separate disabled toolbar action. | `MATCHED` | Retain contextual Palette/Panel visibility and disabled-lighting assertions. |
| `D15` | static captures only | Failed/broken media visual treatment is not visible. | Revid has explicit fallback without browser broken-image artifacts. | `NOT_OBSERVABLE` | Human evidence required. |

## E. Preproduction, finishing, Agent, and workflow surfaces

| ID | Evidence | Exact observable fact | Revid evidence / current state | Status | Release condition |
|---|---|---|---|---|---|
| `E01` | `L-SS-03` | Empty Canvas suggests story/script, character multi-view, first-frame video, and dance-video workflows. | Unit 5D maps four first-class starters to story script, character multi-view, first-frame video, and an honest audio-driven-video unavailable surface. Available starters create only Revid-owned atomic graphs. | `MATCHED` | Retain starter catalog, graph-shape, zero-mutation unavailable, and review-only tests. |
| `E02` | `L-SS-04`,`L-SS-05` | Script/text can be created, edited, then explicitly continued into media. | Revid supports script authoring, AI draft/refine, cinematic decomposition, and downstream generation. | `MATCHED` | Retain `R-094-U3` and T5-083/091 tests. |
| `E03` | `L-SS-03` | Character multi-view is a first-class suggested workflow. | Revid has character-turnaround Storyboard recipe. | `MATCHED` | Retain T5-084 recipe tests. |
| `E04` | `L-SS-03` | First-frame video is a first-class suggested workflow. | Revid supports image-to-video, first/last frame roles, keyframes, and captured frames. | `MATCHED` | Retain T5-059/086/091 tests. |
| `E05` | `L-SS-03` | Dance/audio-to-video is visibly suggested. | Unit 5F exposes audio-driven video as a disabled first-class starter with explicit provider unavailability and zero graph/provider/quota/task/asset mutation. | `MATCHED` | Retain disabled browser state and pure null-command assertion; execution remains Human-gated. |
| `E06` | `L-PUBLIC-HOME` | Skills are selectable from the main creation composer and categorized below. | The main composer exposes explicit Agent/Skill selection and identifies `revid.canvas-context` as a node-created preflight boundary; Palette/overlay remain the execution authority. | `MATCHED` | Retain selected-state and zero-external-execution assertions. |
| `E07` | `L-PUBLIC-HOME` | Public Skills include multi-step professional creation presets. | Revid has workflow templates, Storyboard recipes, image operations, and cinematic Skills. | `MATCHED` | Retain T5-084/087/091 contracts; no copied prompts. |
| `E08` | `L-OFFICIAL-SKILL` | Official Agent flow creates/continues sessions, sends the user's unmodified request, polls messages incrementally, uploads media, changes project, and downloads results. | Revid has native project/Canvas Agent preflight and generation tasks, but no matching external Agent session/message authority. | `BLOCKED` | ADR plus auth/session/message contract; any LibTV access key or external call requires explicit Human authorization. |
| `E09` | `L-OFFICIAL-SKILL` | Upload supports images/videos below 200MB and returns a project-scoped URL. | Revid project upload exists with stricter current limits and ownership. | `BLOCKED` | Product decision on observable size parity; never loosen safe bounds silently. |
| `E10` | `L-OFFICIAL-SKILL` | Agent polling uses incremental sequence and terminal assistant result URLs. | Revid uses durable generation tasks rather than chat messages. | `BLOCKED` | Human-approved long-term observable session contract or explicit accepted semantic equivalence. |
| `E11` | static captures/public docs | Character and scene node structures are not separately shown. | Revid represents them through recipes/groups/assets rather than dedicated canonical types. | `NOT_OBSERVABLE` | Human authenticated evidence required. |
| `E12` | static captures/public docs | Subtitle node/editor is not shown. | Revid has no production subtitle node. | `NOT_OBSERVABLE` | Human evidence required before design/ADR. |
| `E13` | static captures/public docs | Timeline/compositor structure is not shown. | Revid has video preflight only. | `NOT_OBSERVABLE` | Human evidence required before design/ADR. |
| `E14` | static captures/public docs | Export workflow is not shown in Canvas. | Revid honestly blocks export in video preflight. | `NOT_OBSERVABLE` | Human evidence and media-processing authority required. |
| `E15` | static captures/public docs | Template instantiate/edit lifecycle is not shown. | Revid has Canvas templates and workflow recipes. | `NOT_OBSERVABLE` | Human evidence required. |

## F. Responsive, keyboard, accessibility, geometry, and motion

| ID | Evidence | Exact observable fact | Revid evidence / current state | Status | Release condition |
|---|---|---|---|---|---|
| `F01` | `L-SS-03` through `L-SS-12` | All retained LibTV Canvas references are desktop-like; no mobile Canvas capture is present. | Revid has 375x812 review-only. | `NOT_OBSERVABLE` | Human LibTV mobile evidence required; Revid safety boundary remains. |
| `F02` | `L-SS-03` through `L-SS-12` | Desktop chrome remains compact while Canvas zoom changes from 100 to 17. | Unit 5A measures a compact 52px identity and 44px action rail; chrome is screen-fixed and existing 10/100/200 zoom tests remain green. | `MATCHED` | Retain 1440/920/375 shell geometry and zoom regression. |
| `F03` | `L-SS-05`,`L-SS-06`,`L-SS-09`,`L-SS-11` | Node body, ports, toolbar, and composer have stable spatial ownership. | Shared world geometry plus numeric continuation, composer, media toolbar, version-stack, and zoom assertions establish stable non-overlapping ownership. | `MATCHED` | Retain the combined geometry browser matrix. |
| `F04` | `L-SS-05`,`L-SS-06` | Node border is approximately 1px and radius is restrained. | Renderer cards use 1px idle outlines; DOM media uses an asserted 1px semantic border and 6–8px radius. | `MATCHED` | Retain per-node border/radius assertions. |
| `F05` | `L-SS-09`,`L-SS-10` | Floating toolbar/panel shadow and radius preserve hierarchy without large glow. | Revid graphite/violet surfaces are restrained. | `MATCHED` | Retain token and screenshot evidence. |
| `F06` | static captures only | Exact animation durations/easing are not measurable. | Revid uses 120/180/140ms tokens and reduced-motion zeroing. | `NOT_OBSERVABLE` | Human video/performance trace required. |
| `F07` | `L-SS-07`,`L-SS-08` | Active edge flow exists; exact timing is not observable from stills. | Revid has active-only motion and reduced-motion handling. | `NOT_OBSERVABLE` | Human video required for timing parity. |
| `F08` | static captures only | Keyboard shortcuts and focus order are not shown. | Revid has accessible shortcuts, focus restoration, and Graph Access. | `NOT_OBSERVABLE` | Human interaction evidence required. |
| `F09` | static captures only | IME composition behavior is not shown. | Revid explicitly protects IME. | `NOT_OBSERVABLE` | Human evidence required. |
| `F10` | static captures only | Screen-reader names/roles are not shown. | Revid has accessible names and axe checks. | `NOT_OBSERVABLE` | Accessibility tree evidence from authorized LibTV session required. |
| `F11` | static captures only | Reduced-motion policy is not shown. | Revid zeroes motion durations and active spinner/flow animation. | `NOT_OBSERVABLE` | Authorized preference-mode observation required. |
| `F12` | `L-SS-12` | Dense overview keeps media recognizable at 36% and 17%. | Unit 5H adds deterministic 36%/17% media-surface geometry to the existing 10/100/200 scale matrix. | `MATCHED` | Retain `dense overview keeps media recognizable while idle edges recede at 36% and 17%`. |
| `F13` | `L-SS-03` through `L-SS-12` | No visible minimap appears; navigation uses zoom/pan and fixed toolbar. | Unit 5A hides the empty-Canvas minimap by default, keeps it explicitly recoverable from view options, and retains non-empty graph navigation. | `MATCHED` | Retain progressive minimap browser assertion and existing minimap centering tests. |
| `F14` | static captures only | Drag/drop file behavior is not shown. | Revid supports explicit upload/insert, not claimed drag/drop parity. | `NOT_OBSERVABLE` | Human evidence required. |
| `F15` | `L-SS-03` through `L-SS-12` | Color hierarchy is dark neutral with bright local interaction emphasis. | Revid graphite/violet token hierarchy matches semantically. | `MATCHED` | Preserve color-token map; do not copy LibTV values. |

## Coverage summary

- The ledger has no catch-all “other Canvas features” row; shell, node catalog, graph, lifecycle/results, preproduction/finishing/Agent, and responsive/accessibility/motion are explicitly enumerated.
- `MATCHED` means current Revid evidence supports the exact observable behavior, not merely a similar feature name.
- `BLOCKED` includes both remaining implementation work and true authority/contract gates; every row names its release condition.
- `NOT_OBSERVABLE` records the checked public/authorized surfaces. It is not treated as parity success and requires Human acceptance before T5-094 closure.
- Current official public browsing confirmed that authenticated Canvas inspection is login-gated. No account, credential, prompt submission, model generation, payment, or API call was used.
