# T6-003 LibTV Card Work-Model Scope Correction

- Observed at: `2026-07-21`, Asia/Shanghai.
- Human clarification: LibTV parity includes the card work model, not only card shells, ports, edges, and contextual chrome.
- Authoritative observation URL supplied by the Human Owner: `https://www.liblib.tv/canvas?spaceId=878893&projectId=ccf8bd537cb048a9a5ea767750c0b05c`.
- Browser: user-authenticated Chrome through the supported browser control surface.
- Safety: read-only navigation, zoom, selection, disclosure, and reference-mode inspection only. No prompt submission, generation, upload, asset attachment, project rename, graph mutation, or paid action was invoked.
- Clean-room boundary: only visible public product behavior and geometry were observed. No private source, bundle, network contract, proprietary asset, prompt, icon, or brand implementation is copied.

## Scope correction

The earlier T6-003 implementation incorrectly treated LibTV parity primarily as a presentation problem. The Human Owner clarified that the intended parity boundary includes how creators work inside each card and how typed cards consume one another. The prior conclusion that only final Human visual acceptance remained is invalid.

## Fresh visible observations

| State | Visible contract | Implementation implication |
|---|---|---|
| Empty image card selected | The media body remains the node body and a source-attached composer opens immediately below the same node. It exposes reference, mark, style, prompt editing, model, aspect ratio, quality, resolution, count, preset, and submit controls. | Revid must not require a separate detached generation card or a global-only composer for the primary image workflow. |
| Image generation card at 100% | The selected node preserves the media body above a same-width composer. Ports and connected edges remain attached to the node while the composer is disclosed. | Media, composer, ports, and connection endpoints need one current-layout authority. |
| Reference disclosure | Activating `参考` enters `从画布选择参考` with `返回节点` and `退出`; other compatible canvas cards become direct reference candidates. | Reference selection is a typed card-to-card interaction, not merely a resource-panel attachment or generic edge drag. |
| Empty image intent shortcuts | Empty image nodes visibly offer `图生图` and `图片高清` before content exists. | Image cards need explicit mode initialization without creating unrelated node families. |
| Empty text card | Text cards visibly offer `自己编写内容`, `文生视频`, `图片反推提示词`, and `文字生音乐`. | Text cards need multiple user-visible modes with mode-specific downstream intent and safe capability gating. |
| Empty video card | Video cards visibly offer `首尾帧生成视频` and `首帧生成视频`. | Video cards require input-role-aware modes rather than one generic generation interaction. |
| Dense typed graph | Text, image, and video cards connect in different topologies; selected cards expose plus endpoints, and reference mode temporarily changes how another card is acquired. | Generic port geometry remains necessary but is insufficient; card mode, reference role, and same-card generation lifecycle must govern interaction affordances. |

## Revid gap audit

| Area | Current Revid behavior | Gap |
|---|---|---|
| Media card activation | `CanvasNodeMedia.vue` sets the image/placeholder surface to `pointer-events: none`; selection exposes only external toolbar/continuation surfaces. | An empty or populated media card cannot directly open local upload/project asset choices. |
| Card-local generation | Canonical `generation` and `result` are separate node types. Selected editable nodes use `CanvasNodeComposer.vue`, which is only a plain content textarea. The full creation composer is global and only appears on an empty canvas. | Image/video generation controls are not source-attached to the selected media/generation card, and successful generation is not represented as an in-card lifecycle/result transition. |
| Text modes | Script/note cards expose direct text editing; workflow starter choices live in the empty-canvas guide. | A text card does not present the required mode choices or mode-specific typed continuation contract. |
| Canvas reference acquisition | Assets can be attached through the project resource panel and generation nodes can receive typed edges. | There is no selected-card `从画布选择参考` state with compatible candidates, cancel/return behavior, and atomic reference attachment. |
| Interaction parity evidence | Existing T6-003 tests prove shell state, geometry, ports, edges, disclosure safety, and regression. | They do not prove the corrected card work-model contract and cannot establish completion. |

## Corrected acceptance boundary

T6-003 remains `DOING / PENDING`. Existing visual/geometry work is retained as a foundation, but completion now additionally requires:

1. source-attached image/video/text card work surfaces and explicit empty-card modes;
2. local upload and project-asset selection from a media card without accidental graph mutation;
3. same-card mock generation lifecycle and result projection while preserving provider/model ownership and existing backend contracts;
4. typed canvas-reference acquisition with deterministic cancel, focus restoration, history, and persistence outcomes;
5. updated functional, accessibility, persistence, visual, and Human interaction acceptance evidence.
