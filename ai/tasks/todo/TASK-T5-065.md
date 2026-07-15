# TASK-T5-065 - Reference-first visual asset recipes

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-064 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Activation rule

- Do not activate, implement, stage, or mix this Task while T5-064 is active.
- The executing session must first confirm T5-064 is committed and pushed, `CURRENT` is released, and the remaining worktree ownership is clear.
- Only then move T5-065 into the single `DOING` slot and create or refresh its PLAN and PROGRESS before editing business code.

## Objective

Turn one canonical Revid image result into a reference-first character asset sheet or scene multi-view board through one direct Agnes generation action, without requiring a user prompt or an external vision model.

## Accepted product boundary

- Provide two user-facing Canvas actions: `生成角色设定图` and `生成场景多视图`.
- Run immediately after the user clicks, with no preview or prompt requirement.
- Use one selected canonical image as the authoritative reference in the first release.
- Keep identity, hairstyle, body proportions, outfit, palette, scene geometry, atmosphere, and rendering style faithful to the reference.
- Generate one simple horizontal `1024x768` composite image per action.
- Character output uses a white background and combines one primary full-body view, front/side/back views, four expressions, two or three poses, and clothing or key-accessory details.
- Scene output combines one establishing view, complementary angles, and material or lighting details in one coherent board.
- Let the user judge the result and explicitly retry; do not auto-score or auto-regenerate.
- Keep the existing manual prompt branch for explicit changes such as replacing clothing.
- Do not add an external multimodal vision API in this release.

## Required implementation contracts

- Define backend-authoritative, versioned image recipe identifiers and structured prompts.
- Require exactly one validated image reference for each recipe and send that exact asset through the existing Agnes image-to-image boundary.
- Keep internal recipe prompts out of the editable prompt and request-preflight UI.
- Persist a typed generation branch and recipe metadata before making the provider request.
- Reuse existing generation task, quota, failure/refund, reconciliation, result lineage, reload, and manual retry behavior.
- Explicitly request the existing landscape `1024x768` output size.
- Show recipe actions only for editable canonical image results; keep 920px compact editing usable and 375px review-only mutation-free.
- Add a project-local Codex skill at `.agents/skills/revid-visual-assets`, generated and validated with `skill-creator`, documenting the recipes and their honest capability boundary.

## Recommended architecture

The executing session must verify these locations against the post-T5-064 tree before editing. Prefer the existing transaction and graph-command paths over a parallel workflow.

- Backend recipe authority: add a small typed recipe registry under `backend/core/`, then extend `backend/schemas/generation.py` and `backend/api/image_generate.py` with an optional, allow-listed recipe identifier. Existing free-prompt requests must remain backward compatible.
- Provider boundary: resolve the internal recipe prompt only on the backend and pass one validated reference URL plus explicit `size="1024x768"` through the existing `GenerationProvider.generate_image` path. Do not change Agnes authentication or call the real service during verification.
- Canvas command: extend `frontend/src/modules/canvas/resource-commands.ts` or a narrowly scoped adjacent module so one atomic command creates an image-generation node, one ordered `media` edge, and stable `generation_recipe_id` plus `generation_recipe_version` metadata.
- Request transport: extend `frontend/src/modules/canvas/generation-service.ts` with the typed recipe identifier while leaving ordinary image, video, and text payloads unchanged.
- Direct execution: reuse `use-canvas-resource-experience.ts` for persistence flush, running state, request, quota snapshot, task/asset reconciliation, result creation, foreground reveal, failure state, and retry. Do not duplicate transaction logic in the UI.
- Result actions: add the two recipe actions to the existing image-result Inspector surface in `CanvasContextPanel.vue`, route them through `CanvasWorkspace.vue` and the existing node-action composable, and preserve the generic image/video branch actions.
- Recipe-node review: hide editable prompt and final-prompt preview for recipe nodes; show recipe identity, exact reference provenance, image quota, task status, and a manual retry action using existing V2 tokens and scoped SCSS.
- Future vision seam: document the deferred `VisualAnalysisProvider` boundary in the Task/skill, but do not add an unused provider implementation or dependency in this release.

## Delivery sequence

1. Re-read required project state and inspect any post-T5-064 overlap.
2. Create T5-065 PLAN/PROGRESS and record the accepted product boundary and non-goals.
3. Add backend RED tests for schema, recipe resolution, exact provider prompt/reference/size, success persistence/quota, and failure refund behavior.
4. Add frontend RED tests for pure graph command metadata, exact service payload, direct execution, retry, compact, readonly, and manual-branch compatibility.
5. Implement the smallest backend registry and request contract, then the smallest Canvas action and recipe-node presentation.
6. Initialize `.agents/skills/revid-visual-assets` using the official `skill-creator` script, keep `SKILL.md` concise, generate `agents/openai.yaml`, and run `quick_validate.py`.
7. Run focused tests first, then related generation transaction, provider, branch, lineage, responsive, build, visual, diff, encoding, file-size, and sensitive-path checks.
8. Perform a fresh acceptance review, update PROGRESS/CURRENT/ROADMAP, write REPORT only after all non-deferred criteria pass, then commit and push the single logical change.

## Verification requirements

- Add backend RED tests for recipe validation, exact internal prompt selection, exact single-reference provider input, explicit size, success persistence/quota, and failure no-charge behavior.
- Add frontend pure tests for typed recipe branch creation, metadata, source connection order, request payload, and retry guards.
- Add Chromium coverage for both direct actions, no prompt requirement, result materialization, quota, reload, failure plus explicit retry, desktop, compact, and readonly behavior.
- Run focused provider/image/generation transaction regressions, relevant Canvas generation/branch/lineage suites, production build, screenshot inspection, diff review, and sensitive-path checks.
- Use only mock providers; do not call real or paid Agnes.

## Suggested verification commands

Exact test names may be adjusted after RED coverage is added, but the executing session should retain the same coverage classes.

```powershell
cd backend
python -m pytest tests/test_image_generate.py tests/test_agnes_provider.py tests/test_generation_provider_validation.py tests/test_canvas_generation_transactions.py tests/test_generation_transaction_restart.py tests/test_generation_transaction_concurrency.py

cd ..\frontend
npx playwright test tests/e2e/canvas-visual-asset-recipes.spec.ts tests/e2e/canvas-generation-service.spec.ts tests/e2e/canvas-result-branch-generation.spec.ts tests/e2e/canvas-generation-context.spec.ts tests/e2e/canvas-generation-run-result.spec.ts
npm run build
```

Retain desktop `1440x900`, compact `920x900`, and review-only `375x812` screenshots. Verify the real rendered buttons, no internal prompt leakage, direct running/success/failure states, and no horizontal overflow.

## Risks and release guards

- A fixed recipe cannot reliably infer person count, semantic roles, or conflicting references. Keep the first release single-reference and state the boundary in UI/skill copy without claiming vision analysis.
- Direct execution can race graph autosave if the provider request starts before persistence flush. The test must prove the branch and recipe metadata are durable before the request is sent.
- A recipe identifier must not become a client-controlled raw prompt selector. Use an allow-list and backend-owned prompt mapping; reject unknown identifiers and invalid reference counts.
- Recipe prompts can regress reference fidelity through hard-coded wardrobe, appearance, or scene details. Tests should assert preservation constraints and the absence of specific invented identity/style content.
- Failure and retry must preserve the existing no-charge/no-result contract. Do not create a second result or a second charge for one successful task.
- The project-local skill is guidance, not an alternate runtime provider. It must not imply that installing the skill gives Agnes new vision capability.

## Deferred

- Multi-person detection and separate character profiles.
- Automatic primary/supporting-person assignment.
- Multi-image semantic role assignment or intelligent fusion.
- External `VisualAnalysisProvider` implementation.
- Automatic quality scoring, acceptance, or retry.
