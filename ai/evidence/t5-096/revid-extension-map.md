# T5-096 Revid Extension Preservation Map

- Version: `1`
- Date: `2026-07-20`
- State: `EXTENSION_PRESERVED`; automated closure and Human side-by-side acceptance complete for fourteen ownership groups
- Rule: preserve every entry. Do not classify an entry as `EXTENSION_PRESERVED` until the fresh official audit proves there is no counterpart.

## Locked Direction

- Visual thesis: dense media-first creative workspace with graphite/violet semantic surfaces and quiet screen-fixed product chrome.
- Content plan: orient project/Canvas and sync state, expose graph creation and review, reveal advanced Revid authorities contextually.
- Interaction thesis: explicit disclosure before mutation, source-attached contextual work, deterministic focus restoration and reduced-motion-safe feedback.
- CSS strategy: existing SCSS tokens plus scoped Vue styles; no additional styling system.

## Extension Inventory

| ID | Preservation-required entry | Current slot and entry path | Native authority | Current source evidence | Current regression evidence | Official audit status | Final slot status |
|---|---|---|---|---|---|---|---|
| `X01` | Project and multi-Canvas navigation: return, switch, create, rename, reorder, duplicate, archive | Top-left `route-chrome` identity cluster | project/canvas API, flush-before-switch, graph isolation | `CanvasIdentityBar.vue`, `CanvasWorkspace.vue` | `canvas-shell-navigation.spec.ts`, `authenticated-workflow.spec.ts` | `COUNTERPART_OBSERVED` | `TOP_LEFT_IDENTITY_AND_CANVAS_SWITCHER`; Revid-only lifecycle actions stay inside the switcher |
| `X02` | Revision, conflict, local recovery, sync state | Top-right route status plus left-rail history shortcut and revision dialog | autosave, durable revision, restore-to-new-head | `CanvasRevisionPanel.vue`, `canvas-revision-store.ts`, `CanvasWorkspace.vue` | `canvas-revisions.spec.ts`, `canvas-autosave.spec.ts` | `COUNTERPART_OBSERVED` | `BOTTOM_CENTER_HISTORY_DISCLOSURE`; durable revision detail is a subordinate Revid section |
| `X03` | Account and authenticated logout | Top-right route status account menu | auth store and authenticated logout acknowledgement | `account-session-menu.vue`, `CanvasWorkspace.vue` | `logout-session.spec.ts` | `COUNTERPART_OBSERVED` | `TOP_RIGHT_ACCOUNT_MENU`; session/logout authority remains Revid-owned |
| `X04` | Workflow and Storyboard view switch, projection, reorder | Screen-fixed workspace view switch and alternate Storyboard shell | canvas document plus pure Storyboard projection and commands | `CanvasViewModeSwitch.vue`, `CanvasStoryboardView.vue`, `storyboard-projection.ts` | `canvas-storyboard-workflow.spec.ts`, `canvas-storyboard-visual.spec.ts` | `COUNTERPART_OBSERVED` | `TOP_CENTER_WORKFLOW_STORYBOARD_SWITCH` |
| `X05` | Graph Access and keyboard-accessible node/edge review | Left action rail trigger and modal dialog | synchronized Canvas DOM access list and command executor | `CanvasGraphAccessPanel.vue`, `CanvasStage.vue` | `canvas-command-interactions.spec.ts`, `canvas-performance-accessibility.spec.ts` | `NO_COUNTERPART_OBSERVED` | `EXTENSION_PRESERVED` in `BOTTOM_CENTER_TOOLBOX_ACCESSIBILITY_SECTION`; comparison contract shows zero parity-core edge effect |
| `X06` | Professional Action Palette and its 29 current registry entries | Left action rail trigger, floating searchable Palette | pure action registry plus command/preflight owners | `professional-action-registry.ts`, `CanvasProfessionalActionPalette.vue` | `canvas-professional-action-registry.spec.ts`, `canvas-professional-action-palette.spec.ts` | `COUNTERPART_OBSERVED` | `BOTTOM_CENTER_ADD_AND_TOOLBOX_DISCLOSURES`; registry remains searchable subordinate content |
| `X07` | Revid Storyboard recipes and cinematic script-to-shot authoring | Palette category and contextual source selection | strict shot schema, recipes, one atomic graph command | `storyboard-recipe-registry.ts`, `use-canvas-storyboard-recipes.ts`, `use-canvas-shot-schema.ts` | `canvas-storyboard-recipes.spec.ts`, `canvas-shot-schema-workflow.spec.ts`, `canvas-cinematic-script.spec.ts` | `COUNTERPART_OBSERVED` | `ADD_SCRIPT_AND_STORYBOARD_CONTEXT`; Revid schema authority stays subordinate |
| `X08` | Workflow batch dependency/quota preflight | Palette entry to dedicated overlay | mock-only workflow preflight, no generic execution | `CanvasWorkflowBatchOverlay.vue`, `workflow-orchestration.ts` | `canvas-workflow-orchestration-ui.spec.ts` | `COUNTERPART_OBSERVED` | `TOOLBOX_WORKFLOW_SECTION`; explicit dependency/quota preflight remains Revid-owned |
| `X09` | Video trim/concat/export preflight | Palette entry to dedicated overlay | backend-export-unavailable video preflight | `CanvasVideoEditPreflightOverlay.vue`, `video-edit-preflight.ts` | `canvas-video-edit-preflight-ui.spec.ts` | `COUNTERPART_OBSERVED` | `ADD_VIDEO_SYNTHESIS_CONTEXT`; unavailable backend reason remains explicit |
| `X10` | Audio generation/audio-driven-video preflight | Palette entry to dedicated overlay | production-unavailable audio contract | `CanvasAudioGenerationPreflightOverlay.vue`, `audio-generation.ts` | `canvas-audio-generation-preflight-ui.spec.ts` | `COUNTERPART_OBSERVED` | `ADD_AUDIO_AND_AUDIO_VIDEO_STARTER_CONTEXT`; production-unavailable reason remains explicit |
| `X11` | Agent/Skill Canvas-context preflight | Palette entry to dedicated overlay | closed Revid-owned registration/preflight, no generic execute | `CanvasAgentSkillPreflightOverlay.vue`, `agent-skills.ts` | `canvas-agent-skill-contract.spec.ts`, `canvas-agent-skill-preflight-ui.spec.ts` | `COUNTERPART_OBSERVED` | `TOP_RIGHT_AGENT_PANEL`; registration/preflight remains closed and Revid-owned |
| `X12` | Provider/model ownership, quota, billing acknowledgement, exact request disclosure | Node-local/contextual generation controls; provider-specific details remain subordinate | capability catalog, provider selection, quota/task/result authority | `CanvasGenerationParameterControls.vue`, `CanvasCinematicSkillControls.vue`, `provider-cost-acknowledgement.ts` | `canvas-generation-parameters.spec.ts`, `canvas-cinematic-skills.spec.ts` | `COUNTERPART_OBSERVED` | `NODE_CONTEXTUAL_GENERATION_CONTROLS`; provider/model/quota detail remains subordinate |
| `X13` | 375x812 review-only ownership | Full-width review surface with edit/delete/generate controls removed | responsive route and readonly command gates | `CanvasWorkspace.vue`, `CanvasIdentityBar.vue` | `canvas-performance-accessibility.spec.ts`, `canvas-shell-navigation.spec.ts` | `NOT_APPLICABLE` | `REVID_REVIEW_BOUNDARY` |
| `X14` | Main creation composer attachment/model/Skill/mode/Send/retry authority | Empty-Canvas extension surface above the bottom rail | T5-095 durable script authoring, capability, attachment, and bounded retry owners | `CanvasEmptyGuide.vue`, `CanvasWorkspace.vue` | `canvas-libtv-shell-parity.spec.ts`, `canvas-composer-zoom.spec.ts` | `NO_COUNTERPART_OBSERVED` | `EXTENSION_PRESERVED` in `BOTTOM_CENTER_COMPOSER_EXTENSION_ABOVE_RAIL`; measured starter core remains unchanged |

## Official Slot Basis

- Director/`导演台` is not a Revid extension. It is a Human Owner product-scope exclusion classified `HUMAN_EXCLUDED_NOT_APPLICABLE`; no entry, implementation, or inert imitation may occupy an extension slot.

- Exact 1440x900/100% public geometry places the seven 32x32 core actions in a horizontal bottom-centered rail; the official empty state has no permanent left sidebar.
- Official counterparts are not permission to remove Revid authority. Project lifecycle, durable revision, schema, provider/model/quota, unavailable-backend, and closed Agent/Skill details remain subordinate inside the measured counterpart surface.
- `X05` and `X14` are the ownership groups for which the official shell, direct guide, and public populated share exposed no equivalent. The toolbox accessibility section and bottom composer extension retain named slots; their Revid keyboard/focus regressions are green, while exact official-vs-Revid zero-core-effect classification remains Unit 6 work.
- `X14` has no visible counterpart in the authenticated empty Canvas: the exact screenshot and live role audit expose no main creation form or textarea. Revid preserves the composer as an adjacent bottom-center extension above the rail while the four starter cards retain official core geometry.
- Deterministic browser evidence covers 1440x900, 1366x768, and 920x900 plus the 375x812 review boundary. All fourteen ownership groups are `EXTENSION_PRESERVED`; Human review accepts or requests changes to the complete package but does not silently redefine an automated row.

## Professional Action Catalog Snapshot

The live registry exposes 29 deterministic entries. The official audit will classify each entry as parity-core or Revid extension; none may disappear during that classification.

- Create: `canvas.create-script`, `canvas.create-note`, `canvas.create-image-generation`, `canvas.create-video-generation`.
- Script: `script.generate-draft`, `script.refine`, `script.create-shot-graph`, `script.create-cinematic-shot-graph`.
- Workflow boundaries: `workflow.canvas-generation-batch`, `video.edit-preflight`, `audio.generation-preflight`, `agent-skill.canvas-context`.
- Storyboard recipes: `storyboard.plot-board-4`, `storyboard.shot-board-9`, `storyboard.shot-board-16`, `storyboard.shot-board-25`, `storyboard.character-turnaround`, `storyboard.scene-reference-views`.
- Image operations: `image-operation.expand`, `image-operation.inpaint`, `image-operation.erase`, `image-operation.cutout`, `image-operation.upscale`, `image-operation.region`, `image-operation.fusion`.
- Grid split: `image.split-4`, `image.split-9`, `image.split-16`, `image.split-25`.

## Final Slot Rules

1. If the official Canvas has an equivalent, its measured core placement and action trace take priority. Revid-specific authority details stay in a subordinate adjacent section.
2. If there is no counterpart, preserve the current one-level entry unless measured core geometry conflicts.
3. A conflict may move an extension only into a named adjacent slot. It may not hide the extension in an unrelated workflow.
4. Every final extension row needs deterministic browser evidence for visibility, keyboard access, focus restoration, real function or explicit unavailable reason, responsive ownership, and zero parity-core geometry effect.
5. Structural comparison may mask only the exact final extension rectangle. It may never mask a parity-core mismatch.
