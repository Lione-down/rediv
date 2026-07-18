# TASK-T5-094 - Agnes contract recovery, AI script authoring, and LibTV observable Canvas parity

- State: `DONE - PASS`
- Objective: restore a backend-owned, diagnosable Agnes text/image/video contract; add explicit `Agnes 2.0 Flash` draft/refine authoring for canonical script nodes; and close a clean-room ledger of publicly observable LibTV Canvas behavior while retaining Revid semantic colors and native auth/quota/task/asset/command ownership.
- Dependency: `T5-093 - DONE - PASS` at pushed business delivery `b23b6cb9d4354cc37a78b13352e95774a81f2b07` and closure `e932a3615273f3fde9c3173a51f39c8291acac34`.
- Activation baseline: `HEAD == origin/main == e932a3615273f3fde9c3173a51f39c8291acac34`; no tracked worktree changes; user-owned `.codex/`, `.hermes/plans/`, and `output/` remain untracked and out of staging scope.

## Scope

1. Establish one typed backend Agnes contract for model, endpoint, request/response adapters, polling, supported controls, retryability, and safe error metadata.
2. Reproduce and close image/video HTTP 400 contract failures with fixtures, correct API/frontend error mapping, duplicate-submit guards, and durable failure semantics.
3. Add `script_draft` and `script_refine` through the existing authenticated text-generation, quota, admission, idempotency, durable task, and Canvas command paths.
4. Produce a clean-room LibTV Canvas parity ledger, semantic color map, machine-readable scenario manifest, and bounded evidence from official public or Human-authorized surfaces.
5. Implement ledger deltas for shell, node catalog/states, graph interactions, preproduction, generation/results, finishing, Agent/workflow, responsive behavior, motion, keyboard, and accessibility without weakening Revid safety or performance boundaries.
6. Verify by evidence tier: unit/mock, browser mock, build/regression, guarded disposable MySQL/browser, performance, and only separately authorized real-provider smoke.

## Non-goals and Human gates

- Do not access or expose `.env` values, secrets, provider credentials, raw sensitive provider bodies, or complete sensitive prompts.
- Do not make real or paid Agnes calls without an exact Human-authorized call matrix; internal fixtures and browser mocks never count as real-service proof.
- Do not perform destructive database/filesystem operations, irreversible migrations, user-data cleanup, or external-account changes.
- Do not copy LibTV private source, prompts, credentials, logos, trademarks, proprietary assets, fonts, or icon files. Match only publicly observable behavior using Revid-owned or licensed assets and Revid semantic colors.
- Do not bypass backend auth/quota/task/asset/provider authority, fabricate unavailable execution, hide provider errors, or introduce unbounded automatic retry.
- Do not stage `.codex/`, `.hermes/plans/`, `output/`, `.env*`, or unrelated user files.

## Acceptance criteria

### Agnes contract and failure closure

1. Text/image/video execution and the capability catalog consume one backend-owned typed contract with no conflicting route/model/endpoint constants.
2. Provider failures preserve only bounded, allowlisted, redacted status/code/correlation/message metadata and map to stable actionable API errors rather than generic internal 500 responses.
3. Image and video fixtures cover accepted requests, deterministic 400, malformed success, provider 5xx, and video submit/poll terminal/timeout/missing-result paths.
4. Duplicate pending/running or unchanged deterministic-failure fingerprints fail closed; only safe transient classes expose bounded manual retry.
5. Failed/rejected/busy/stale requests do not create active assets, charge successful quota, attach stale output, or discard a prior valid result.

### Script authoring

6. Eligible canonical script context shows `Agnes 2.0 Flash`, `从创意生成脚本`, and `优化当前脚本`, with explicit separation from cinematic shot decomposition.
7. Draft/refine inputs are bounded and fail closed for blank/unsupported/multi-select/readonly/mobile-review/locked cases.
8. Success creates an editable lineage-bearing script node by default; explicit replace is atomic and undoable; stale responses never overwrite newer content.
9. Autosave, reload, Canvas switch, undo/redo, cancellation/failure recovery, IME, focus, and the separate cinematic action have browser evidence.

### Clean-room observable Canvas parity

10. Every observed LibTV Canvas surface/state/action has a source/date/viewport/fact/confidence entry and status `MATCHED`, `BLOCKED`, or `NOT_OBSERVABLE`; missing/unexplained items prevent closure.
11. Shell, node types and lifecycle states, selection/group/batch, ports/edges, workflows, results, responsive layouts, keyboard/accessibility, geometry, and motion have deterministic scenario or numeric/screenshot evidence.
12. Color is mapped to Revid semantic tokens without using color as a reason to change hierarchy, spacing, geometry, interaction, or state weight.
13. Unavailable provider/media/Agent capabilities remain honest, visible surfaces without fabricated results or unauthorized execution.

### Verification and delivery

14. Focused backend/frontend tests pass before related regression/build/browser/MySQL/performance gates; evidence tiers are labeled accurately.
15. `CURRENT`, `ROADMAP`, Task, PLAN, PROGRESS, code, tests, evidence, REPORT, commit, and remote state agree before `DONE - PASS`.
16. Real Agnes smoke and `BLOCKED`/`NOT_OBSERVABLE` parity closure require Human acceptance when they remain completion dependencies.

## Accepted documented deferrals

- On 2026-07-19, the Human Owner accepted `A03`, `B17`, `E08`, `E09`, `E10`, and all 28 `NOT_OBSERVABLE` rows as documented deferrals.
- Real Agnes smoke is deferred. Unit/mock/browser-fixture evidence remains explicitly offline and does not claim current real-provider health.
