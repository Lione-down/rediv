# T6-011 Human-confirmed Canvas card interaction contract

- Status: `FROZEN / HUMAN CONFIRMED / AMENDED 2026-07-25`
- Confirmed by: Human Owner
- Confirmation date: 2026-07-24
- Applies to: `T6-011 - Replace the Canvas card runtime and rebuild the text workflow`
- Source video: `C:\Users\mkd\Videos\20260724_154111.mp4`
- Source duration: `00:26:32`
- Architecture boundary: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md)

## 1. Authority and intent

This document is the frozen Human-confirmed visible and interaction contract for the reactivated T6-011. It supersedes any conflicting visual assumptions, snapshot-only interpretations, generic `Asset`/`Result` creation taxonomy, or automated-accept conclusions from the rejected candidate at `05679e04484857e86541aafc4601a4a7cd1f2e72`. The 2026-07-25 Human rejection further supersedes the earlier assumption that a rendered edge endpoint must equal a moving `+` center: the edge belongs to the card boundary, while `+` is an acquisition button only.

The reference is a behavior contract, not merely a color or border reference. T6-011 must reproduce the observed information hierarchy, interaction states, attached-work-surface model, reference semantics, port/edge behavior, and media workflow taxonomy while preserving Revid's accepted stack, data authority, provider boundaries, stable identities, graph/history/autosave, durable jobs, and legacy readability.

Automated proof cannot replace renewed Human visual and interaction acceptance.

## 2. Human product decisions

1. Do not implement or expose Director/`导演台` in the T6-011 Canvas card runtime.
2. Retain Video Composition/`视频合成` as a distinct visible workflow entry.
3. Retain Audio Generation/`音频生成` as a distinct capability-gated workflow entry because future models may support audio generation.
4. When no allowed audio model is available, Audio Generation must fail closed before document, history, autosave, quota, job, or provider mutation and must truthfully explain that no compatible model is currently available.
5. `Asset`/`Material` is an import, library, or reference utility and semantic role; it is not a generic generation-card type.
6. `Result` is a job-materialized state or output role; it is never manually creatable.

## 3. Visible card hierarchy

### 3.1 Resting card

- A resting card shows only its external title/type label, primary text or media body, and the minimum truthful lifecycle state.
- Prompt, provider model, generation mode, ratio, quality, duration, count, audio toggle, reference shelf, job identity, and compatibility metadata must not remain permanently stacked inside the resting card.
- Image and video cards use the actual media as the dominant body. Empty states use a quiet placeholder and a small set of truthful next actions.
- Script remains a compact draggable Canvas card. Its large structured table/editor opens only through an explicit action.

### 3.2 Selected card

- Selection enhances the existing card boundary and may attach one contextual toolbar.
- Selection never creates a second card body, a second port, a duplicate `+`, or a competing status surface.
- Media-specific transformations belong to the selected-card toolbar, not to the global Add taxonomy and not to every resting card.
- Observed examples include portrait adjustment, panorama, multi-angle, relighting, grid operations, upscale, and crop. T6-011 must preserve compatible existing Revid actions without pretending unsupported actions work.

### 3.3 Attached composer

- Prompt and generation controls live in one card-local attached composer shown only for the active composing/configuring card.
- The composer is visually subordinate to and geometrically attached to the owning card.
- It contains structured references, prompt editing, model, mode, media parameters, and the submit action.
- It is not a global inspector and not a permanent second card.
- Deselecting the card may hide the composer but must not change its persisted model, mode, references, roles, order, or parameters.

## 4. Explicit interaction state machine

The visible runtime must project one canonical state machine:

`idle -> selected -> direct-editing | composing -> submitting -> running -> succeeded | failed`

`disabled` is an explicit capability or policy state, not a visual accident.

Rules:

- Card drag, Canvas pan, direct text editing, composer editing, port drag, and toolbar interaction are mutually explicit interaction states.
- A Text card enters direct editing only through the documented edit gesture, observed as double-click in the reference.
- The direct editor owns text input while active; it must not pan the Canvas or drag the card.
- The card drag region remains available in all non-disabled states, including Script empty, direct, assisted, succeeded, and failed states, except when the pointer starts inside an active editor/control.
- Every non-interactive part of the card body is a drag region. Pointer-down-and-hold projects a grab/grabbing cursor and moves the DOM card plus all attached edges in the same rendered frame before persistence.
- Running work disables only actions that are genuinely unsafe; it does not create a second visible runtime.

## 5. Canonical card and configuration model

One persisted canonical model owns:

- stable project, Canvas, and node identity;
- authoring/media type;
- ownership and field-level editability;
- explicit visible lifecycle state;
- model ID;
- generation mode;
- ordered references;
- per-reference stable ID, type, revision, display name, thumbnail, semantic role, and order;
- image/video parameters;
- bound durable client request and job identity;
- result application state;
- legacy compatibility projection.

Selection, blur, re-entry, Canvas switching, refresh, and model-list refresh must never infer or overwrite an already explicit mode, role, or order.

## 6. Structured inline references

- Connected or explicitly selected reference media appears in the composer as numbered thumbnails.
- Prompt text contains atomic inline `thumbnail + display name` mention tokens such as `图片 1` and `图片 2`.
- A mention token is not raw `@name | type | id` text and not an unrelated shelf detached from the sentence.
- Token identity, role, and order are structured data and remain stable through edit, reorder, undo/redo, autosave, reload, duplication, and Canvas switching.
- Edge-backed references are derived from the persisted graph binding. Disconnecting an edge removes that edge-backed reference through one typed mutation; selecting or deselecting cards alone does not add or remove references.
- Provider request projection consumes the same canonical ordered reference authority used by the visible tokens.

## 7. Ports and edges

- Input ports are on the left and output ports are on the right.
- Each ordinary card has exactly one visible left acquisition `+` and one visible right acquisition `+`; multiple typed logical ports must never become multiple visible controls.
- Left and right acquisition buttons have symmetric rest, hover, pointer-follow, clamp, draft, selected, and zoom behavior. They initiate or accept a connection gesture but are not persisted edge endpoints.
- Acquisition diameter and pointer-follow clamp are Canvas-world geometry. Their screen-space size scales with the Canvas zoom; zooming out must not preserve an oversized fixed-CSS trigger region around a visually smaller card.
- Image media uses contain-style projection so the complete source frame remains visible inside the card; card clipping may bound the media surface but must not crop source content.
- Once a playable video result is projected, native video controls own the lower media area and no redundant generation lifecycle label may overlap them. Real provider progress remains visible while the card is queued/running and still has no playable result.
- Multiple compatible input edges may converge on the card boundary while retaining distinct typed logical bindings. Drop resolves exactly one compatible logical pair and otherwise fails closed.
- Resting edges are thin and quiet. Hover, acquisition, draft drag, selection, and active flow may enhance the same edge without creating another authority.
- Every persisted and draft edge paints below every card body, label, media, editor, and card-local control. No edge styling or selection state may raise a path over a card.
- DOM acquisition centers, pointer hit regions, draft origins, card-boundary anchors, and rendered SVG endpoints consume one projected geometry contract with distinct acquisition and attachment projections.
- Persisted edge endpoints attach to the owning card boundary and follow the card in the same rendered frame during drag; they never terminate on the visible `+`.
- Browser proof must use rendered path and screen-space measurements, including `getPointAtLength()` and `getScreenCTM()`, to prove card-boundary attachment, non-equality with displaced `+` centers, and frame-coherent movement at rest, hover, draft drag, selected state, and representative zooms.

## 8. Add and continuation taxonomy

The canonical visible authoring and contextual-continuation taxonomy is:

1. Text
2. Script
3. Image Generation
4. Video Generation
5. Video Composition
6. Audio Generation

Locked rules:

- Director/`导演台` is absent.
- Video Generation is present and clearly named.
- Video Composition is retained as a separate type.
- Audio Generation is retained and capability-gated by the backend-authoritative allowed-model list.
- Asset upload, project library, preflight, history, and administrative actions remain separate utilities.
- `Asset`/`Material`, `Reference`, and `Result` may be semantic roles or utility projections but are not generic authoring choices.
- A contextual output-port menu communicates that the next node uses the current node as a reference, matching the observed `引用该节点生成` behavior.
- Every enabled visible action must work. Unsupported capability states remain explicit and must not dispatch a job.

## 9. Text, Script, image, and video workflows

### 9.1 Text

- Direct text content is edited in the canonical card body.
- Assisted composition uses the selected card's attached composer.
- Allowed model selection is explicit and backend-authoritative.
- Successful assisted output applies to the same stable card through one typed undoable/autosaved mutation.

### 9.2 Script

- The Canvas card remains compact, readable, and draggable in every non-disabled state.
- Loading/progress is contained inside the card.
- The large structured script table/workspace opens explicitly and does not become the permanent Canvas card body.
- Existing Script direct and assisted behaviors remain available through the replacement runtime.

### 9.3 Image Generation

- The image body or quiet placeholder is the dominant card surface.
- The attached composer owns references, inline tokens, prompt, model, ratio, quality, resolution, count, and submit.
- Successful foreground results return to the original generation card while legacy result documents remain readable through the bounded adapter.

### 9.4 Video Generation

- The empty card truthfully offers supported video modes, including text-to-video, first-frame video, and first/last-frame video when the selected model advertises them.
- First frame and last frame are explicit persisted semantic roles, not inferred from current selection or incidental edge order.
- Model, mode, reference roles/order, ratio, resolution, duration, audio option, and count are persisted configuration.
- Reselecting the card, reselecting a model, refreshing capabilities, reloading, or switching Canvas must not silently fall back to keyframes or another mode.

### 9.5 Video Composition and Audio Generation

- Both remain visible, distinct workflow types.
- They reuse the same canonical card, attached composer, capability, durable-job, and persistence contracts.
- They must not silently alias Image Generation, Video Generation, a generic Asset card, or a generic Result card.
- Unsupported model/provider combinations fail closed before mutation.

## 10. Lifecycle and visual restraint

- `idle`: quiet content or placeholder.
- `selected`: one enhanced boundary and optional attached toolbar/composer.
- `editing/composing`: one active editor authority.
- `submitting/running`: contained skeleton/progress and only truthful cancellation or status actions.
- `succeeded`: canonical content/result replaces the placeholder on the owning card.
- `failed`: one card-local error authority with recoverable action when available.

Provider IDs, job IDs, raw lineage IDs, compatibility data, and technical status dumps are not normal card chrome.

At overview zoom, users must still recognize media type, primary content, lifecycle, and graph structure. Detailed parameters appear only at an appropriate interaction level.

## 11. Runtime and compatibility boundaries

- Leafer remains the Canvas/world engine.
- The DOM card subsystem is the sole visible and interactive authority for card body, editing, selection, ports, and attached controls.
- MySQL, Canvas document, stable node IDs, graph/history/autosave, durable generation jobs, backend provider authority, and legacy readability remain unchanged.
- Ordinary Canvas runtime synchronizes only current-Canvas or bound job IDs through compact status/result DTOs.
- Current-Canvas delta remains a bounded recovery capability but is not called by normal persisted-card polling. Once a card has a persisted job binding, reload recovery and live queued/running progress use only that exact compact job route; terminal result retrieval is exact and polling stops at terminal/card removal.
- Project-wide legacy generation-task lists are history/admin-only.
- No real or paid provider call, secret access, migration against user/runtime data, destructive operation, framework rewrite, database rewrite, or Canvas-engine replacement is authorized.

## 12. Frozen video observations

| Approximate time | Observed contract |
|---|---|
| `00:03:20-00:05:00` | Compact Script card opens a dedicated structured script workflow with stage progress and editable table content. |
| `00:10:50` | Text card enters direct editing by double-click and shows a separate rich-text toolbar. |
| `00:11:15` | Contextual continuation menu is framed as generating from the referenced node and exposes media/workflow types rather than generic Result creation. |
| `00:12:05` | Empty Image card has one input `+`, one output `+`, and a card-attached generation composer. |
| `00:14:35` | Image parameters are grouped inside a compact on-demand quality/resolution/ratio/count popover. |
| `00:15:50-00:17:35` | Connected images appear as numbered thumbnails and inline named mention tokens in the prompt. |
| `00:18:12` | The reference explicitly states that disconnecting a connection also removes its reference. |
| `00:19:20` | Empty Video card offers first/last-frame and first-frame generation paths. |
| `00:19:40-00:20:00` | First and last frames retain visible semantic roles; video ratio, resolution, duration, audio, and count live in the attached composer. |
| `00:25:18-00:25:48` | Image transformations are selected-card tools and workflow tokens, not permanent generic card chrome. |

## 13. Required TDD and browser proof

Before production changes, the implementing session must add or refresh focused RED assertions for:

1. resting/selected/editing/composing hierarchy;
2. direct-edit versus card-drag versus Canvas-pan separation;
3. exact six-type taxonomy, absent Director, non-creatable Result, and utility-only Asset/Material;
4. capability-gated Audio Generation and retained Video Composition;
5. edge-backed inline thumbnail/name token lifecycle;
6. explicit video mode plus first/last/reference roles across deselect, model reselection, Canvas switch, reload, and capability refresh;
7. compact Script card and explicit expanded workflow;
8. exactly one visible acquisition `+` per card side with symmetric, fail-closed typed logical-port resolution;
9. rendered persisted-edge endpoints on card boundaries plus acquisition-only draft anchors at rest, hover, drag, selected state, and zoom;
10. compact bound-job synchronization and history-only legacy list use;
11. persisted and draft edge paint order below a real intersecting card plus zero Canvas-delta calls across repeated exact bound-job polling.

Focused RED must be observed before the smallest coherent GREEN. A fresh frontend build is required before browser proof. Broad automated proof and independent audit remain separate from Human visual and interaction review.

## 14. Human review checklist

The renewed Human review must verify the complete workflow, not isolated screenshots:

- resting Canvas hierarchy;
- Text direct edit and drag separation;
- Script empty/direct/assisted/running/succeeded/failed drag behavior;
- Image and Video attached composers;
- inline reference tokens and edge disconnect lifecycle;
- Video mode/model/role persistence;
- Text, Script, Image Generation, Video Generation, Video Composition, and Audio Generation taxonomy;
- absent Director;
- utility-only Asset/Material and non-creatable Result;
- ports and edges at rest, hover, drag, selected state, and zoom;
- refresh, Canvas switching, autosave, undo/redo, and durable job recovery.

Only explicit `ACCEPT` or `ACCEPT_WITH_DECLARED_BOUNDARIES` after this review releases T6-011 closure, exact staging, commit, and push.
