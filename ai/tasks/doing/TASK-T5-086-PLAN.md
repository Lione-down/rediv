# TASK-T5-086 Plan

- State: `DONE - PASS`
- Objective: deliver strict mock-first shot direction controls over Revid's existing generation contracts while production remains capability-honest and fail closed.

## Unit 0 - Audit and contract lock (`DONE`)

1. Read the required state/task documents and inspect T5-075/T5-085 capability, parameter, request, task-snapshot, Context Panel, Storyboard, and responsive boundaries.
2. Record the exact Revid v1 values and media/reference compatibility only after the audit; do not invent provider semantics. **Locked:** capability v3; v1 angle `eye-level|high-angle|low-angle|overhead`, framing `wide|medium|close-up`, focus `deep|shallow`, lighting `natural|soft|dramatic`, temporal `hold|advance|rewind`; defaults `eye-level/medium/deep/natural/hold`; only mock video `image-to-video` with exactly one input may use non-`hold` temporal intent. Image supports only the four static controls. Production supports/provider-executes none.
3. Create RED tests for capability versioning, malformed/future data, production no-op rejection, and ordinary-generation backward compatibility.

Success gate: Task/PLAN/PROGRESS and CURRENT/ROADMAP agree on T5-086 as the only active Task; exact control contract and Human gates are explicit.

## Unit 1 - Backend and frontend contract RED to GREEN (`DONE`)

1. Implement the minimal strict capability and request/snapshot validation boundary, keeping production provider controls unavailable.
2. Extend frontend capability/node parameter parsing and request context with the same strict contract.
3. Prove no crafted unsupported control can reserve quota, create a task/result, or reach a provider.

Success gate: capability, persistence, and requests are backward compatible, versioned, and fail closed.

## Unit 2 - Focused Canvas controls RED to GREEN (`DONE`)

1. Add focused accessible controls inside the existing Context Panel and reuse existing one-command parameter persistence.
2. Prove exact mock request/snapshot, no auto-run, success/failure/retry, capability drift, undo/redo/reload/recovery/duplication, and source/Storyboard preservation.
3. Verify 1440/1366/920 editing and 375 review-only behavior without adding a parallel UI or Canvas engine.

Success gate: controls are explicit, durable, accessible, and use only existing generation lifecycle ownership.

## Unit 3 - Regression and closure (`DONE`)

1. Run focused and related backend/Canvas/generation/Storyboard regression, build, functional Chromium, visual/a11y, hygiene, and guarded performance evidence.
2. Write REPORT and close Task/PLAN/PROGRESS/CURRENT/ROADMAP only after all non-deferred acceptance evidence is classified.
3. Exact-stage, commit, and push only T5-086 owned files.

Closure evidence: focused backend `28 passed, 34 subtests`; related backend `77 passed, 43 subtests`; full backend `482 passed, 116 subtests`; build `4,893` modules; focused shot-control Chromium `9/9`; related Canvas/generation Chromium `51/51`; full Chromium `462/462`. The guarded 200-node/300-connection run passed at `56.56 FPS` and `16.8ms` frame p95 without threshold change.

## Stop rules

- Stop before a real/paid provider call, secret access, external account, database/migration change, destructive edit, cross-canvas relation, second engine/store, mobile editing, or incompatible UX.
- Stop and re-plan if capability truth cannot represent the desired controls, node/snapshot identity would drift, or provider behavior must be guessed.
- Preserve `.codex/`, `.hermes/plans`, and `output/`; never stage them.
