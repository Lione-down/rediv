# REPORT-T6-007 - Characterize and freeze replacement contracts

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-23`
- Activation baseline: `07dfa5b06b4920677a513b5ac562aa191ee7eaf3`
- Task: [TASK-T6-007](../tasks/todo/TASK-T6-007.md).
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).

## Delivered

- Added compact v2 submit/status/result DTO characterization with exact ordinary-response exclusions.
- Added hard payload budgets: submit and single status at `4 KiB`, and a 100-item delta page at `128 KiB`.
- Added semantic video-reference characterization for stable node/asset IDs, source revision, role, instruction, exclusions, deterministic order, and the nine-reference boundary.
- Added the versioned `revid.story-production` / `revid.story-director` schema contract with stable asset/shot identities and one non-empty video prompt per shot.
- Added browser contract characterization for node rename, undo/redo/reload identity, duplicate-title-safe bindings, durable text/script/image/video jobs, refresh restoration, same-card results, and image-batch siblings.
- Added browser characterization for automatic non-selectable director ownership, built-in story-production output, semantic capability separation from keyframes, and connected-compatible-image-only `@` binding.
- Labeled overlapping legacy full-task payload, keyframe, project-wide polling, and hidden result projection expectations as compatibility behavior without changing assertions.

## RED evidence

- Backend compact DTO contract: `3` expected failures, fingerprint `compact-generation-dto-module-absent`.
- Backend payload budgets: `2` expected failures, fingerprint `compact-generation-payload-budget-module-absent`.
- Backend semantic references: `3` expected failures, fingerprints `semantic-video-reference-schema-absent` and `semantic-video-nine-reference-boundary-absent`.
- Backend story director: `2` expected failures, fingerprint `story-production-schema-module-absent`.
- Browser rename: `2` expected failures, fingerprints `node-rename-command-absent` and `node-rename-executor-absent`.
- Browser durable/same-card/batch: `4` expected failures for submit, refresh restore, same-card result, and image-batch same-card result.
- Browser director: `2` expected failures for built-in capability and story-production result.
- Browser semantic references: `3` expected failures for capability, request context, and connected-image `@` options.
- All `21` failures are assertion failures caused by absent approved replacement contracts. There are no collection, syntax, fixture, authentication, preview, MySQL, real-provider, or infrastructure failures.

## Compatibility and build proof

- Backend compatibility: `tests.test_generation_parameter_contract` `13/13` pass.
- Disposable-MySQL compatibility: `tests.test_canvas_generation_transactions` `13/13` pass.
- Browser compatibility labels: `6/6` pass across v6 keyframes, project-wide polling, and hidden result projection.
- Frontend production build: pass, `4,988 modules transformed`.
- No snapshot was regenerated and no threshold or assertion was weakened.

## Boundaries

- T6-007 changes tests and delivery documents only. It implements no runtime behavior.
- No production API, schema, migration, provider adapter, application source, or visual design changed.
- No real or paid provider call, secret access, destructive operation, user/runtime database mutation, or external-account action occurred.
- User-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` remain excluded from delivery.
- The expected RED suite intentionally remains failing until T6-008 through T6-015 implement the owned contracts; broad suites that include those RED files are not completion gates for this characterization Task.

## Decision

T6-007 is `DONE / PASS`: the replacement behavior is frozen as precise RED contracts, not implemented. T6-008 may activate only after this scoped delivery is committed and pushed.
