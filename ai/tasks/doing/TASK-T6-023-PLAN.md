# TASK-T6-023 PLAN - Template-aware Script/Image and old T6-014 closeout

- State: `DONE`
- Verification outcome: `PASS`
- Baseline: `327e5d216592c8286f643e14d6819320934aed56`
- Task: [TASK-T6-023](../todo/TASK-T6-023.md)

## Authority and stop boundary

The frozen PRD, V1 behavior matrix, formal redesign plan, and completed T6-017 through T6-022 contracts define this
unit. Existing strict Story Production, typed Canvas command/history/autosave, T6-021 instance/step/node lineage,
compact generation jobs, exact result retrieval, same-card result application, Image batch siblings, and provider
capability/adapters remain the only authorities.

Stop before T6-024 Video projection, T6-025 WorkflowRun, T6-026 upgrade/clone/detach, or T6-027 retirement/release.
Do not call a real/paid provider, access secret/env/provider-raw/prompt/source-content/user evidence, mutate a
user/production database, add an irreversible migration, or auto-run any generated card.

## RED-first units

### Unit 1 - Backend template-aware Story lineage

1. Characterize the current Story Director request/result and partial-regeneration contracts.
2. Add focused REDs for an exact active T6-021 instance Script step carrying sanitized template/version/instance/
   step/node lineage through request validation and strict Story Production.
3. Add REDs for stale/foreign/mismatched instance, step, Script node, and shot lineage; confirm no prompt/provider raw
   echo and no mutation before validation.
4. Implement the smallest repository/controller/schema boundary that reuses persisted T6-021 lineage and the current
   Story Director executor without adding a provider or Canvas authority.
5. Prove immutable entity/shot IDs and target-ID-only partial merge.

### Unit 2 - Atomic selected-shot Image card authoring

1. Characterize `story-shot-generation.ts`, Script workspace selection, generation parameters, typed `insert-graph`,
   and persisted node content.
2. Add focused RED browser/unit contracts for one atomic N-shot Image card command carrying source Script/shot and
   template/version/instance/step lineage plus size/ratio/output count and allowed overrides.
3. Implement the smallest pure/typed projection; card creation must make zero generation/provider/quota/run call.
4. Prove undo/redo, autosave/reload, Workflow/Storyboard stable identity, stale lineage rejection, and explicit-only
   Image 2.0 composition.

### Unit 3 - Old T6-014 same-card/batch sibling closeout

1. Reuse current capability -> persisted parameters -> request `output_count` -> exact result -> same-card/batch
   sibling chain.
2. Add a template-lineage regression with supported multi-output, independent result/asset/retry identity, and
   unsupported-count no-dispatch behavior.
3. Do not rewrite compact generation jobs, provider adapters, or legacy compatibility surfaces.

## Verification order

1. Focused observed RED.
2. Smallest coherent GREEN.
3. Focused backend and frontend/browser regression.
4. Related Story Director, Script remediation, workflow-template lineage, generation-parameter, Image batch, and
   same-card regression.
5. Fresh frontend production build.
6. Fresh provider-free runtime/browser proof from the built artifact.
7. Project-state validator, changed-file compile/type checks, `git diff --check`, scoped diff review, protected-path
   and staged secret hygiene.
8. Reconcile Task/PLAN/PROGRESS/REPORT/CURRENT/ROADMAP, exact-path stage, one `type(scope): subject` commit, push,
   fetch, and confirm ahead/behind `0/0`.

## Success criteria

T6-023 is complete only when the exact template-aware Story/Image lineage, atomic no-auto-generation card authoring,
old T6-014 same-card/batch-sibling closeout, all non-deferred checks, documentation, one commit/push, and remote parity
are verified. These gates passed. Final Human journey acceptance remains T6-027; completion did not activate T6-024.
