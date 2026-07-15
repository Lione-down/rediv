---
name: revid-visual-assets
description: Create and verify Revid reference-first visual asset branches from one canonical image result. Use when implementing, testing, or operating the character-sheet and scene-multiview recipes, or when deciding whether a request belongs in a fixed recipe or the editable image-generation flow.
---

# Revid Visual Assets

Use Revid's fixed, reference-first recipes to derive production reference boards from one canonical image. Preserve the source identity and visual language, keep recipe prompts backend-owned, and verify the persisted graph plus generated result.

## Choose the Path

- Use `character-sheet` for a clean character board with a primary full-body view, front/side/back views, expressions, poses, and identifying details.
- Use `scene-multiview` for a scene board with an establishing view, complementary angles, and material and lighting details.
- Use the ordinary image branch when the user wants to edit the prompt, alter identity, replace the style, or combine multiple references.

Both fixed recipes accept exactly one canonical image result and produce a `1024x768` image. New branches use recipe version `2`; existing version `1` nodes remain valid and must retry with their persisted version. Do not ask the user to write a prompt for these recipes.

## Operate the Recipe

1. Confirm the selected node is a completed image result with a resolvable asset ID.
2. Create the recipe branch from the result node. Persist the current recipe ID, exact recipe version, and one ordered media edge before generation starts.
3. Submit only the recipe ID and the single reference asset ID. Never expose or persist the internal recipe prompt in the browser document.
4. Keep the transaction on the existing generation lifecycle: running, success or failure, quota reconciliation, retry, and result materialization.
5. On retry, reuse the same recipe generation node and submit its persisted recipe version. Do not infer the latest version, create a second branch, or charge quota for a failed request.

## Verify the Result

- Confirm the request contains `generation_recipe_id` and one `image_id`, with no client `prompt`.
- Confirm document persistence occurs before the generation request.
- Confirm success creates exactly one result node and consumes quota exactly once.
- Confirm failure creates no result, consumes no quota, and offers an explicit retry.
- Check wide, compact, and `375px` readonly layouts. Recipe actions must disappear in readonly mode.
- In a dense vertical recipe flow, confirm the selected toolbar does not intersect the result card above or below and causes no graph or viewport persistence mutation.
- Judge visual fidelity manually against the canonical reference. Provider success is not visual acceptance.

## Manual Fidelity Checklist

Record a separate Human verdict for every authorized real-service sample:

- Medium: photography stays photographic; illustration keeps its linework and shading language; 3D keeps its materials and render character.
- Identity or geometry: observable facial structure, person identity, scene geometry, and object identity are not substituted.
- Hair and proportions: hairstyle, color, texture, anatomy, body proportions, and scale remain consistent where observable.
- Wardrobe and objects: construction, accessories, props, and materials are preserved without redesign or invention.
- Palette and materials: colors, surface response, atmosphere, time of day, and lighting remain continuous.
- Cross-panel consistency: every view depicts the same subject or space without medium drift or unexplained variation.

A single reference cannot reveal every side or back detail. The recipe minimizes unseen-view inference; it cannot eliminate it. Reject medium conversion, generic face replacement, identity substitution, or invented wardrobe and props. Retry or use the editable image branch when creative correction is required.

## Stay Honest About Capability

These recipes supply versioned backend prompts; they do not perform a separate vision call, person detection, face matching, or automatic quality scoring. The image model is instructed to inspect the supplied reference, but prompt adherence cannot guarantee identity. A successful backend task proves provider completion only. Real fidelity claims require an authorized real-service sample and a separate Human verdict. Treat `backend/core/image_generation_recipes.py` as the runtime authority for prompt text, size, and version. This skill documents the workflow but does not override runtime contracts.
