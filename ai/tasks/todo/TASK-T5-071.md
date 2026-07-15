# TASK-T5-071 - Reference-first visual fidelity v2 and recipe-flow isolation

- State: `DONE`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-070 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Activation rule

- Do not activate, implement, stage, or mix this Task while T5-070 is active.
- The executing session must first confirm T5-070 is committed and pushed, `CURRENT` is released, and remaining worktree ownership is clear.
- Only then activate T5-071 as the single implementation Task and create or refresh its PLAN and PROGRESS before editing business code.
- Re-read the final T5-070 code and REPORT before choosing recipe entry-point logic; reuse its semantic image-reference gate and do not create a competing compatibility system.

## Objective

Upgrade the backend-owned visual asset recipes and the project-local `revid-visual-assets` skill so reference medium, observable identity, clothing, palette, and art direction receive materially stronger constraints instead of generic preservation guidance. Close the observed recipe-flow toolbar collision so controls belonging to one selected card cannot cover another card's content. Do not claim guaranteed identity matching: a technically successful Agnes request is still subject to user visual acceptance.

## Failure evidence and acceptance oracle

The user-observed T5-065 result is the motivating failure:

- Reference: a photorealistic woman with brown hair wearing a white dress in a flower field.
- Result: a structurally valid white-background character sheet, but rendered as a generic two-dimensional illustrated woman.
- Classification: layout `PASS`; reference medium/style `FAIL`; identity fidelity `FAIL`; wardrobe/palette only `PARTIAL`.
- Required interpretation: provider/task success is not visual acceptance. This result must not be described as a faithful character asset.

For the equivalent photographic reference class, an acceptable result remains photographic in every panel, depicts one recognizably consistent real person, preserves observable facial structure, hair, body proportions, dress construction, colors, and materials, and introduces no anime, cartoon, painterly, 3D, beautification, age, or identity substitution.

The user-observed 2026-07-15 Canvas result adds a separate UI regression:

- Layout: an image result is above a selected recipe generation card, with another image result below it.
- Failure: the selected generation card's floating action toolbar docks above that card and covers the lower part of the unrelated upper image result.
- Classification: graph node placement `PASS`; contextual overlay isolation `FAIL`.
- Required interpretation: the lower/selected card has not changed the upper result data. Its controls are visually leaking into a neighboring card because collision scoring treats neighboring node content and selected-node auxiliary surfaces as equivalent overlap costs.
- Acceptance oracle: no selection toolbar may cover visible content, labels, or status controls belonging to any other Canvas node. Avoiding unrelated node content outranks contextual proximity; when no collision-free local slot exists, use a panel-safe Canvas fallback without moving graph nodes.

## Product direction

- Source medium is immutable art direction: photography remains photography, illustration retains its linework and rendering language, and 3D retains its material and render language.
- Identity and styling constraints outrank decorative character-sheet conventions.
- A white board background may replace the source environment, but it must not transform the subject's rendering medium.
- Unseen side/back details may be minimally inferred for continuity, but must not introduce new wardrobe, accessories, anatomy, or identity claims.
- The existing no-prompt direct action remains; internal recipe prompts stay backend-owned and hidden.
- User review and explicit retry remain authoritative. Do not claim automatic face matching, quality scoring, or acceptance.

## Scope

### 1. Versioned recipe contract

- Add explicit end-to-end `generation_recipe_version` handling for recipe requests.
- Preserve the exact T5-065 version 1 definitions for reload and deterministic retry of existing v1 nodes.
- Make new character-sheet and scene-multiview branches use version 2.
- Resolve recipes by the exact `(recipe_id, recipe_version)` pair on the backend; reject unknown pairs and prompt overrides.
- Treat legacy id-only requests as version 1 for backward compatibility; never map a missing version to `latest`.
- Reject a version without an ID and every unknown pair before task creation, quota mutation, or provider execution.
- Do not silently execute a new prompt under persisted version 1 metadata and do not auto-migrate old Canvas nodes.

### 2. Fidelity-first version 2 prompts

- Treat reference medium detection as an instruction executed by the Agnes image model from the supplied image; do not add a second external vision call.
- Character v2 must include explicit conditional constraints:
  - photographic source means photorealistic photographic output only;
  - illustrated source preserves line quality, shading, proportions, and palette;
  - 3D source preserves materials, lighting, lens/render character, and geometry;
  - the same person and observable facial structure remain consistent in every panel;
  - no anime, cartoon, painterly, 3D conversion, face replacement, beautification, age shift, ethnicity shift, wardrobe redesign, or invented accessories unless already present in the reference;
  - a white background changes only the board environment, never the subject medium.
- Scene v2 must apply the equivalent medium lock plus geometry, object, palette, atmosphere, time-of-day, and lighting continuity.
- Keep the current one-reference and `1024x768` contracts.

### 3. Honest human-acceptance contract

- Keep task lifecycle success semantics unchanged for quota and persistence.
- Keep existing explicit retry and its quota contract unchanged.
- In the skill, Task evidence, and REPORT, distinguish provider success from visual approval and record the Human verdict separately.
- Do not add a database acceptance state, new UI status, automatic scoring, silent retry, or a second status widget in this Task.

### 4. Skill contract

- Update `.agents/skills/revid-visual-assets/SKILL.md` so operation and verification explicitly reject medium conversion and identity substitution.
- Add a small manual fidelity checklist covering medium, identity, hair, proportions, wardrobe, palette/materials, and cross-panel consistency.
- State that one reference cannot reveal unseen views and that the recipe minimizes, rather than eliminates, inference.
- State that backend/provider success is not visual acceptance and that real fidelity claims require an authorized real-service sample.
- Regenerate or validate `agents/openai.yaml` only if its user-facing description changes.

### 5. Recipe-flow contextual toolbar isolation

- Reproduce the exact dense vertical recipe branch: source image result above, selected recipe generation in the middle, and generated result below.
- Treat visible rectangles belonging to other nodes as hard occupied space. The selected node's detached composer, video/keyframe surfaces, and other contextual auxiliaries may remain secondary placement constraints, but they must never make covering an unrelated card the preferred result.
- Select toolbar placement lexicographically: first eliminate or minimize overlap with other node content, then minimize overlap with selected-node auxiliaries and distance from the selection.
- If the standard above/below/left/right candidates all collide, add or reuse a panel-safe viewport fallback that remains associated with the selection and avoids the Inspector/drawer insets.
- Preserve the T5-063 compact-drawer ownership, readonly suppression, selected video/keyframe avoidance, keyboard semantics, and existing contextual-distance target whenever a collision-free placement permits it.
- Do not mutate node positions, edge geometry, graph history, selection, or persisted viewport merely to place the toolbar.

## Required implementation contracts

- Continue sending exactly one validated image through the official Agnes `extra_body.image` boundary with `response_format='url'`.
- Keep recipe prompt text solely in `backend/core/image_generation_recipes.py`; no client prompt leakage or editable prompt field.
- Preserve ordinary prompt-based image generation, video generation, generation transaction, quota, reconciliation, lineage, reload, and failure behavior.
- Preserve T5-070's final authoring compatibility decisions. This Task must not reopen unsupported video/audio/text reference authoring.
- Existing v1 recipe nodes must remain readable and their historical metadata stable.
- New recipe actions must expose only the current v2 definitions; retaining v1 resolution must not duplicate user-facing actions.
- Recipe execution and retry must read and send the version persisted on the selected generation node, not infer `latest` from the recipe ID.
- No schema or migration work is expected.

## Likely files

The executing session must verify paths against the post-T5-070 tree before editing.

- `backend/core/image_generation_recipes.py`
- `backend/schemas/generation.py`
- `backend/api/image_generate.py`
- `backend/tests/test_image_generate.py`
- `backend/tests/test_agnes_provider.py`
- `backend/tests/test_generation_provider_validation.py`
- `frontend/src/modules/canvas/visual-asset-recipes.ts`
- `frontend/src/modules/canvas/generation-service.ts`
- `frontend/src/components/canvas/composables/use-canvas-resource-experience.ts`
- `frontend/src/components/canvas/composables/use-canvas-stage-presentation.ts`
- `frontend/tests/e2e/canvas-visual-asset-recipes.spec.ts`
- `frontend/tests/e2e/canvas-generation-service.spec.ts`
- the existing focused contextual-toolbar browser spec, if post-T5-070 inspection identifies one; otherwise keep the regression in `canvas-visual-asset-recipes.spec.ts`
- `.agents/skills/revid-visual-assets/SKILL.md`
- `.agents/skills/revid-visual-assets/agents/openai.yaml` only if needed

## Delivery sequence

1. Reconstruct final T5-070 state and activate T5-071 only after its release gate passes.
2. Create T5-071 PLAN/PROGRESS and record the real visual failure fingerprint plus the no-extra-vision boundary.
3. Add a browser RED regression for the exact upper-result / selected-recipe-generation / lower-result stack. Assert the toolbar has zero intersection with both result cards and does not mutate the graph or persisted viewport.
4. Implement the smallest toolbar occupancy-priority correction, then rerun the T5-063 video/keyframe, compact-drawer, readonly, Inspector-inset, and keyboard regressions before proceeding.
5. Add backend RED tests for exact recipe version resolution, v1 compatibility, v2 prompt invariants, one reference, explicit size, and unchanged Agnes outbound reference placement.
6. Add frontend RED tests for new-branch v2 metadata/payload, existing-v1 reload/retry, prompt secrecy, failure/retry, responsive, and readonly behavior.
7. Implement the smallest exact-version recipe registry and request contract.
8. Add the fidelity-first v2 character and scene prompts without changing provider authentication or transaction architecture.
9. Update and validate the project-local skill with the manual fidelity checklist and honest capability boundary.
10. Run focused tests, related generation regressions, build, skill validation, diff, encoding, file-size, and sensitive-path checks.
11. If explicitly authorized for paid Agnes calls, run a bounded real-service visual sample and have the Human Owner judge it against the checklist. Otherwise leave the real-fidelity gate explicitly unverified; do not claim visual closure from mocks.
12. Update PROGRESS/CURRENT/ROADMAP and write REPORT only when every non-deferred criterion is satisfied, then commit and push the single scoped Task.

## Acceptance criteria

- New recipe branches persist and submit version 2; existing version 1 branches still reload and resolve deterministically.
- In the motivating dense vertical recipe branch, the selected generation toolbar has zero geometric intersection with the visible bounds of the upper and lower result cards.
- Toolbar placement remains inside panel-safe Canvas bounds, avoids Inspector/drawer ownership, and causes no graph PATCH, node translation, history entry, selection change, or persisted viewport mutation.
- Existing selected-video/keyframe placement, contextual keyboard access, compact drawer handoff, and readonly toolbar suppression remain unchanged.
- Unknown recipe/version pairs, prompt overrides, zero references, and multiple references are rejected before provider execution.
- Character v2 prompt explicitly locks photo, illustration, and 3D source media and forbids the documented medium/identity/wardrobe drift classes.
- Scene v2 prompt explicitly locks source medium, geometry, palette, atmosphere, and lighting continuity.
- Exact HTTP-boundary tests still prove one reference in `extra_body.image`, `extra_body.response_format='url'`, and no top-level `image`.
- The browser never receives or persists the internal prompt.
- Skill and REPORT evidence explicitly separate technical completion from Human visual judgment; existing explicit retry remains available.
- Existing ordinary image/video branches, quota accounting, failure no-charge behavior, result lineage, and reload remain unchanged.
- `revid-visual-assets` validates successfully and contains an honest manual fidelity checklist.
- No automatic quality score, face-match claim, external vision API, schema change, or real/paid provider call is introduced without Human authorization.

## Verification requirements

### Offline and mocked gates

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_image_generate.py tests/test_agnes_provider.py tests/test_generation_provider_validation.py tests/test_canvas_generation_transactions.py tests/test_generation_transaction_restart.py tests/test_generation_transaction_concurrency.py

cd ..\frontend
npx playwright test tests/e2e/canvas-visual-asset-recipes.spec.ts tests/e2e/canvas-generation-service.spec.ts tests/e2e/canvas-result-branch-generation.spec.ts tests/e2e/canvas-generation-context.spec.ts
npx playwright test tests/e2e/canvas-generation-run-result.spec.ts tests/e2e/canvas-video-frame-capture.spec.ts tests/e2e/canvas-node-continuation-trigger.spec.ts tests/e2e/canvas-command-interactions.spec.ts
npm run build

cd ..
python C:\Users\mkd\.codex\skills\.system\skill-creator\scripts\quick_validate.py .agents\skills\revid-visual-assets
```

- Retain desktop `1440x900`, compact `920x900`, and review-only `375x812` browser evidence without overwriting unrelated artifacts.
- At desktop and compact widths, measure actual toolbar/result bounding boxes for the motivating vertical stack and require zero intersection. Also prove no document PATCH and no viewport persistence request is emitted by toolbar placement.
- Verify v1 and v2 recipe nodes across create, reload, failure, retry, and result materialization.
- Review the fresh diff against T5-071 only and run sensitive-path checks without reading `.env`.

### Real-service visual gate

Real Agnes evidence is distinct from mocks and requires explicit action-time Human authorization.

- Use a bounded non-sensitive reference set containing at least one photograph, one illustration, and one scene image.
- For the photographic character case, reject any illustration/anime/cartoon/3D conversion or generic face replacement.
- For every case, manually check medium, observable identity/geometry, wardrobe/objects, palette/materials, and cross-panel consistency.
- Record provider/model identity, recipe version, Human verdict, and redacted evidence path without recording secrets.
- If the same medium or identity drift persists, classify it as a provider-capability limit and return for a Human product decision; do not mark T5-071 `DONE - PASS` by merely lengthening the prompt again.

## Risks and release guards

- Prompt hardening can improve adherence but cannot create guaranteed face matching. The Task must use honest language and stop if the provider cannot meet the accepted visual bar.
- Changing prompt text without exact version transport would make persisted metadata false. Version compatibility is a release blocker, not optional cleanup.
- The backend schema forbids extra fields today; land backend version parsing before the frontend starts sending the field, and keep missing-version fallback pinned to v1.
- Node `serialization_version` is unrelated to `generation_recipe_version` and must not change.
- A single oblique or closed-eye photograph cannot reveal complete front/side/back identity. Judge preservation of observable traits and minimal inference, not impossible pixel identity in unseen views.
- Strong negative clauses can reduce composition quality or cause provider refusal. Validate both character and scene recipes, not only the motivating photograph.
- Real visual QA consumes paid quota and therefore remains a Human gate.
- A global node-gap increase may hide one screenshot while wasting Canvas space and leaving the overlay algorithm incorrect. Do not use graph re-layout, persisted node translation, or a blanket spacing increase as this regression's fix.
- T5-063's proximity target is subordinate to isolation: if no nearby zero-overlap slot exists, use the nearest panel-safe fallback and record the exceptional distance in browser evidence.

## Non-goals

- External multimodal analysis, face embeddings, ControlNet/IP-Adapter integration, provider replacement, model training, automatic person detection, multi-person role assignment, multi-reference fusion, automatic scoring, automatic retry, migrations, or destructive data changes.
- Reworking T5-070 authoring compatibility, changing graph authoring surfaces, adding video/audio reference support, redesigning the contextual toolbar, or redesigning Canvas status UI.

## Completion standard

- Offline contract and browser gates alone may prove implementation correctness, but they do not prove visual fidelity.
- T5-071 may be `DONE - PASS` only after an authorized real-service sample meets the Human fidelity checklist, or after the Human Owner explicitly accepts offline-only closure with the provider-capability caveat.
- If real output still changes photography into illustration or replaces identity, keep the Task in `VERIFYING` or `BLOCKED` with the exact evidence and next product decision.
