# TASK-T5-071 Plan

- State: `VERIFYING`
- Objective: add exact recipe-version transport and fidelity-first v2 prompts, and isolate recipe-flow contextual controls from neighboring node content, while preserving v1 retries and honest Human visual acceptance.

## Design thesis

- Visual thesis: source medium is immutable art direction; a board layout may change the environment but never silently restyle the subject.
- Content plan: new recipe branches use v2; historical v1 nodes remain deterministic; provider success and Human fidelity verdict remain separate facts.
- Interaction thesis: keep the current no-prompt recipe actions and explicit retry; contextual chrome orbits its selected node without covering neighboring cards, with no new status widget or automatic scoring surface.

## Delivery sequence

1. Add a browser RED test for the upper-result / selected-recipe-generation / lower-result stack, including zero intersection and zero persistence mutation.
2. Correct toolbar placement priority so other-node content is hard occupancy, then run the T5-063 video/keyframe, compact-drawer, readonly, inset, and keyboard regressions.
3. Add backend RED tests for exact recipe pairs, v1 fallback, v2 prompt invariants, request validation, and Agnes HTTP placement.
4. Add frontend RED tests for v2 creation, persisted-version retry, prompt secrecy, reload, failure, readonly, and responsive review.
5. Implement a minimal versioned backend registry and end-to-end `generation_recipe_version` transport.
6. Add character and scene v2 prompts while preserving the exact v1 definitions.
7. Update the project skill with the manual fidelity checklist and honest capability boundary.
8. Run focused and related offline suites, build, browser evidence, skill validation, diff, encoding, file-size, and sensitive-path checks.
9. Leave the Task `VERIFYING` until an authorized real Agnes sample receives a Human verdict, unless the Human Owner explicitly accepts offline-only closure.

## Invariants

- Missing recipe version with a recipe ID resolves to v1, never latest.
- Unknown pairs and version-without-ID fail before task, quota, or provider work.
- Internal recipe prompts remain backend-only and exactly one image reaches `extra_body.image`.
- Ordinary image/video generation, transaction, quota, lineage, reload, and T5-070 compatibility remain unchanged.
- Toolbar placement never mutates node positions, graph history, selection, or persisted viewport; other-node visible bounds outrank proximity.
- No paid call, secret access, schema change, automatic score, or fidelity guarantee is introduced.
