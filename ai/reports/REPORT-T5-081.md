# REPORT-T5-081 - Storyboard projection and image storyboard groups

- Decision: `DONE - PASS`
- Date: 2026-07-17
- Scope: frontend Storyboard projection and review, validated image storyboard groups, shared ordering/layout, Canvas duplication metadata remapping, integrated verification, and durable closure.

## Outcome

Revid now presents the existing Canvas document as truthful text, image, and video Storyboard lanes without creating a second graph, route, store, or execution surface. Editors can create durable 2-25 image storyboard groups, control ratio, columns, numbering, and order, then convert or ungroup them through the existing typed command, history, autosave, and whole-group movement contracts.

Canvas duplication now preserves a valid storyboard group's exact order using the duplicate child IDs. The controller deep-copies all content and changes only `ordered_child_ids` when the source is an exact validated `group/storyboard` version-1 group with canonical unlocked image children. Ordinary groups, future versions, malformed membership, unsupported child serialization, custom metadata, project asset references, and source content remain unchanged.

## Implementation

- Added a deterministic pure projection over existing nodes and connections with stable lane order, canonical media/runtime states, malformed-metadata fallback, and no input mutation.
- Added an accessible route-local Workflow/Storyboard switch while retaining the mounted Canvas, URL, document, selection, viewport, history, revision, Context Panel, and request neutrality.
- Added explicit review-only execution ownership: Storyboard supports safe existing inspection/editing but exposes no generation, retry, recipe, branch, concat, export, or provider action.
- Added strict image-only storyboard group validation, deterministic ratio-aware grid layout, typed create/settings/reorder/convert commands, exact undo/redo/reload, and existing ungroup/group-movement reuse.
- Added a controller-local duplicate content resolver backed by the existing `node_id_map`; no endpoint, schema, migration, or persistent contract was introduced.

## TDD evidence

- Projection RED began with the missing projection module; a second RED exposed incorrect persisted `queued` classification.
- View RED failed only on the absent accessible tabs. Group REDs failed on the absent validator/action and numbering layer. Visual RED proved parent-scoped descendant styling was missing.
- Duplication RED proved valid storyboard metadata retained source UUIDs. A second fail-closed RED proved unsupported result serialization was initially accepted.
- Each RED was followed by the smallest scoped implementation and focused GREEN before broader regression.

## Verification

- Storyboard projection/group/workflow focused and related browser matrices passed, including exact one-PATCH commands, undo/redo, reload, provider-order and edge stability, conversion, ungroup, whole-group movement, request guards, and 375px review-only ownership.
- Visual/accessibility matrix: 6/6 passed across empty, mixed lifecycle, 2-image, 25-image, invalid-selection, compact, and mobile states at 1440x900, 1366x768, 920x900, and 375x812; no serious or critical Storyboard-specific axe finding.
- Final functional Chromium: 392/392 passed in 7.4 minutes.
- Production build: `vue-tsc -b && vite build` passed with 4,872 transformed modules and no CSS minifier warning.
- Backend duplication: 6/6 passed. Related multi-Canvas/document/metadata/duplication matrix: 27/27 passed.
- Full backend: 465 tests plus 78 subtests passed in 373.07 seconds. Controller and test `py_compile` passed.
- Guarded owned live run `t5008-17544-ecbd87abf9c762cd` passed 200-node/300-connection restart persistence with revision 3, 169 ms stable render, 59.94 FPS, 16.8 ms frame p95, 0.1 ms pointer p95, and zero long tasks. Evidence: `output/playwright/t5-008-live/t5008-17544-ecbd87abf9c762cd/summary.json`.
- Fresh architecture, correctness, security, performance, accessibility, adversarial, diff, strict UTF-8, file-size, sensitive-path, secret-pattern, owned-port, and exact-scope review found no unresolved issue.

## Acceptance classification

All twelve Task criteria pass: the switch and selection are identity-preserving; projection is truthful and deterministic; Storyboard is execution-free; group creation fails closed; membership/order/settings survive history, reload, and duplication; reorder preserves unrelated graph/provider identity; conversion and ungroup preserve child geometry and connections; whole-group movement reuses T5-080 semantics; required responsive surfaces pass; and all focused, full, build, visual, persistence, accessibility, hygiene, and live performance gates pass.

## Boundaries preserved

- No second graph/store, route, backend endpoint, database field, migration, provider behavior, paid execution, mobile editing, or incompatible persistent contract was added.
- No `.env` was opened, no real secret was accessed, no paid call was made, and no destructive user/runtime data operation occurred.
- Pre-existing untracked `.hermes` plans and ignored/untracked `output/` evidence remain outside staging.
