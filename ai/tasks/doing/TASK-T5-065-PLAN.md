# TASK-T5-065 Plan

- State: `DONE - PASS`
- Objective: turn one canonical image result into a directly executed, reference-first character sheet or scene multi-view board through backend-owned Agnes recipes.

## Scope and invariants

- Add versioned allow-listed recipe identifiers for `character-sheet` and `scene-multiview` with backend-owned structured prompts.
- Require exactly one validated image reference and explicit landscape `1024x768` output.
- Persist one typed recipe generation branch before provider execution and reuse existing quota, task, failure/refund, reconciliation, lineage, reload, and explicit retry paths.
- Expose `生成角色设定图` and `生成场景多视图` only for editable canonical image results.
- Hide internal recipe prompts from editable prompt and final-prompt preflight while showing recipe identity and reference provenance.
- Preserve ordinary manual image/video branch behavior and all existing request contracts.
- Add and validate `.agents/skills/revid-visual-assets` using the official `skill-creator` initialization and validation scripts.

## Non-goals

- No real or paid Agnes calls, external vision model, semantic person detection, multi-reference role inference, automatic scoring, or automatic retry.
- No database schema or provider authentication change.
- No replacement of the existing manual prompt branch.

## Delivery sequence

1. Map the current image generation request, transaction, retry, result-branch, Inspector, and command contracts.
2. Add backend and frontend RED tests for recipe validation, exact provider request, durable-before-request execution, success/failure/retry, responsive visibility, and prompt secrecy.
3. Implement the backend registry/schema/API/provider request extension and focused tests.
4. Implement the typed Canvas branch, direct actions, recipe review, and browser tests.
5. Initialize and validate the project-local skill, then run related regressions, build, screenshots, diff review, documentation, commit, and push.

## Acceptance criteria

- Both direct actions create one durable recipe branch from one canonical image and execute without user prompt input.
- Unknown recipes, wrong reference count, noncanonical results, readonly, and unsupported media fail closed.
- Provider receives the exact backend-owned prompt, one validated reference, and `1024x768`; internal prompt text never appears in editable/preflight UI or client payload.
- Success creates one canonical result and one charge; failure creates no result and no charge; explicit retry remains single-settlement safe.
- Desktop 1440x900, compact 920x900, and readonly 375x812 browser evidence passes without overflow.
- Project-local skill contains only required artifacts, accurately states limitations, and passes `quick_validate.py`.
