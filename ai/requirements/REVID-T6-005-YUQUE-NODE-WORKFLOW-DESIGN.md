# Revid T6-005 Yuque Visual and LibTV Logic Node Workflow Design

## 1. Design thesis

Build a deep-black media workbench where every creation action remains source-attached to the node that owns it. The card body is the result and preview authority; the prompt, connected references, parameters, and submit action form a fixed-width continuation beneath it with the same observable geometry as the Human-authored screenshots. Revid violet appears only for selection, focus, active choices, and generation intent.

This is a clean-room translation of Human-authored observable behavior. It does not copy Yuque or LibTV branding, source, icons, copy, prompts, or image assets.

## 2. Reference and evidence

- Human-authored visual source: `https://www.yuque.com/yusheng-kqb5z/vgcmxa/nxdy0z1gz07cglzo`.
- Observable logic source: `https://www.liblib.tv/canvas?spaceId=3406579&projectId=e3d413e251cb40bf9cd8c0f52b022055`.
- Inspection mode: authenticated, read-only, in-app Browser on 2026-07-22. No generation, quota consumption, external mutation, private source access, or proprietary asset reuse occurred.
- Local ignored evidence: `output/reference/yuque/t6-005/`, 20 inspected PNGs plus manifest.
- Manifest SHA-256: `59FA6146AE0BEAADAF5E513A6AF90B1E6C9132348D0CFED9FF5FA8980A0D015C`.

The references establish these observable requirements:

- renameable node labels outside the upper-left body edge;
- direct text editing inside the final text card;
- card-attached script and generation composers;
- storyboard conversion and dense shot presentation;
- grouped roles, scenes, and props with a right-side detail editor;
- same-card loading and image/video result rendering;
- first/last/reference image roles, `@` discovery, thumbnails, freeform per-image intent, and a hard nine-image budget;
- one shared add-control behavior across node sides.

The authenticated LibTV audit further locks these interaction facts:

- media and script composers are fixed at 660 CSS px and appear 16 world px below the selected source node, with a 16px outer radius and no connector neck;
- the compact image composer is prompt-first: `参考`/optional supported intent actions, prompt, model, summarized parameters, optional presets, cost/status, and submit;
- `参考` enters an explicit Canvas selection mode and establishes the input relationship through the existing graph authority;
- typing `@` does not discover or connect arbitrary Canvas nodes. It lists only eligible assets that are already connected; an empty eligible set produces a clear local message and zero graph mutation;
- image parameters open from one summary control and expose quality, resolution, aspect ratio, and output count. Revid keeps capability-owned values, including approved count `3`, even though the reference currently emphasizes `1, 2, 4`;
- final text is edited inside the node body; empty script/image cards expose lightweight suggested starts, and selected script/media cards own their lower composer.

## 3. Information architecture

The selected creation card has four vertical zones:

1. **Identity**: renameable upper-left title, subtype/status metadata, node-side add/connection controls.
2. **Body**: editable text, media preview, empty affordance, loading state, result, or retry state.
3. **Intent**: optional ordered connected-reference chips followed by a prompt/editor region placed 16 world px below the body.
4. **Execution**: model, aspect/duration/count/role summary, source actions, runtime feedback, and one violet submit action.

The Context Panel opens only for deep selected-asset detail. It must not duplicate routine prompt, count, role, or submit actions already owned by the card.

Storyboard asset groups remain on Canvas. Their top-level visual grouping is role, scene, and prop; their children remain canonical Revid image-generation cards.

## 4. Content and component plan

### Shared card workbench

- Reuse `CanvasCardWorkSurface` as the shared attached shell.
- Do not render a permanent mode/source toolbar above the prompt. Empty-card suggestions and canonical node subtype determine the starting operation; the compact `参考` action owns Canvas input selection.
- Show ordered reference thumbnails/chips above or inline with the prompt.
- Keep runtime status next to execution metadata and mirror pending/result state in the body.
- The submit action is the strongest element after the media body.

### Text

- Empty/attempt state may expose manual entry and AI draft/refine.
- Applied text becomes directly editable in the card body.
- No permanent lower composer remains after direct text apply.
- Existing stale-context protection and Canvas undo/history remain authoritative.

### Script and storyboard

- Script prompt and draft/refine controls remain attached to the script card.
- Conversion is shown as a compact local step, then yields the existing canonical storyboard/group graph.
- Dense shot rows favor readable sequence, duration, prompt summary, and generation state over decorative chrome.

### Asset group

- Group headings expose roles, scenes, and props with clear counts and add actions.
- Child cards expose selection, remove, individual generate/retry, and existing group-level generate-all.
- Selecting a child opens the existing right-side detail surface for description and generation intent.

### Image

- The body owns empty, loading, generated, error, and retry states.
- Local intent owns references, prompt, model, aspect ratio, capability-driven count, and submit.
- Count is contract-driven `1, 2, 3, 4`; the menu may visually prioritize `1, 2, 4` to match the authored workflow.
- Slot 1 remains in the initiating card and later outputs remain deterministic sibling cards.

### Video

- The attached workbench supports first-frame, last-frame, and ordinary references.
- `参考` opens the existing bounded Canvas-image selection mode and creates the normal typed input relationship.
- `@` opens a bounded list of already-connected eligible images and inserts a mention into the prompt without creating or changing a connection.
- Selected images render as ordered thumbnail chips with role, accessible remove/reorder, and optional per-image intent text.
- The exact total budget is visible and a tenth reference is rejected before mutation.

## 5. Visual system

Use existing tokens only:

- Canvas: `--v2-canvas`.
- Surfaces: `--v2-surface-1`, `--v2-surface-2`, `--v2-surface-3`, and `--canvas-composer-surface`.
- Text: `--v2-text-primary`, `--v2-text-secondary`, `--v2-text-muted`.
- Accent and focus: `--v2-accent`, `--v2-accent-soft`, `--v2-focus-ring`.
- Borders: `--v2-border-subtle`, `--v2-border-standard`, `--canvas-composer-outline`.
- Radius scale: 4px for micro controls, 8px for chips/fields, 12px for media/composer surfaces, 16px only for prominent containers, pill only for semantic chips.
- Typography: existing Sora stack; 12px caption, 13px body, 14px control, 15px title.
- Spacing: existing 4/8/12/16/20/24/32px tokens.
- Composer geometry: fixed 660 CSS px; 16 world-px source gap; 16px outer radius; no connector bridge.
- Motion: 120ms state response, 150ms card transition, 180ms enter; opacity/scale only and reduced-motion safe.

No gradients, glass blur, oversized pills, decorative floating cards, unrelated accent colors, or new typography are introduced.

## 6. Interaction contract

- Selection reveals the source-attached workbench without changing graph identity.
- `参考` selection and prompt `@` mention are separate states. Only the first may dispatch an existing typed connect command.
- Pointer and keyboard share the same actions and resulting commands.
- Escape exits reference selection or closes the deepest transient layer first, then restores focus to its opener.
- Pending disables only actions that would duplicate the same authoritative request.
- Errors remain local and retryable; successful batch/group siblings remain untouched.
- Add controls resolve through one action registry and retain typed-port compatibility.
- Disclosure-only actions never mutate Canvas, history, autosave, quota, tasks, or assets.

## 7. Responsive and accessibility contract

- `1440x900`: full attached workbench and reference detail.
- `920x900`: workbench stays node-attached, wraps compact actions, and never clips the submit/status region.
- `375x812`: review-only; no graph editing or generation mutation, but content, status, references, and detail remain legible.
- All interactive targets meet the existing minimum target contract.
- Every icon-only action has an accessible name; status uses `role=status`, errors use `role=alert`, and grouped choices expose labels and pressed/selected state.
- Focus order follows identity, body, references, prompt, parameters, submit. Reduced motion removes nonessential animation.

## 8. CSS and implementation strategy

- Keep Vue SFC scoped SCSS and existing shared CSS variables.
- Do not add Tailwind, CSS-in-JS, a new component library, or a parallel token layer.
- Prefer flex/grid reflow and existing projected geometry over fixed viewport offsets.
- Keep state derivation in current Canvas modules/composables and rendering in focused components.
- Split any new component before it pushes an existing file further beyond the project's general 500-line guidance.

## 9. Verification and Human gate

- RED fixtures must first prove the current detached hierarchy and missing local states.
- Focused GREEN must prove each node family without changing request/persistence snapshots.
- Browser evidence must compare current-source Revid at `1440x900`, `920x900`, and `375x812` against the authored sequence, not against pixel-identical proprietary styling.
- Full backend/frontend/build/performance/audit/state/hygiene gates remain required.
- The Human Owner reviews the final full-width and 375px result and the text, script, group, image, and video interactions. No REPORT, closure, staging, commit, or push occurs before explicit acceptance.
