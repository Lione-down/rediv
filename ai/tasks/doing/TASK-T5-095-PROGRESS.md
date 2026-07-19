# TASK-T5-095 Progress

- State: `DONE - PASS`
- Last updated: 2026-07-19
- Activation HEAD: `789397fe15b443ee66431955766070918ca1b637`

## Completed work

- Read required repository truth sources, T5-094 closure evidence, relevant Canvas/resource/script-authoring code, and the two Human-provided screenshots.
- Confirmed `HEAD == origin/main == 789397fe...`; tracked worktree is clean and user-owned untracked paths remain out of scope.
- Confirmed attachment reuses `insertAsset`, immediately mutates the graph, and therefore hides the composer when node count becomes non-zero.
- Confirmed the T5-094 shell test explicitly expected Send to create one local node with `generationCount === 0`.
- Confirmed generation capability loading is one-shot with no retry and the UI exposes internal `capability 未加载` text.
- Confirmed local frontend/backend were started before the T5-094 delivery; frontend HMR can be v5 while the non-reload backend remains v4, which validly parses without text capability and produces the screenshot state.
- No `.env` value, secret, real Agnes request, paid action, migration, or destructive operation was used.
- Replaced the attachment/insert contract with explicit resource intent: attach mode keeps the graph unchanged, shows a removable composer chip, limits the script path to images, and preserves ordinary Project Resources insertion behavior.
- Replaced local-only script Send with the existing authenticated script-authoring path: the canonical source is persisted first, exact brief and reference IDs are retained, one request is submitted, and success creates an editable lineage-bearing result.
- Added owned public-image reference validation before provider/task/quota work and Agnes-documented `text` plus `image_url` message blocks; local/private/foreign/stale/unsupported references fail closed.
- Added race-safe capability loading and bounded manual reload to both the main composer and script context; removed internal `capability 未加载` copy and exposed the actual model identity.
- Added recoverable 503 behavior: no automatic replay, source brief remains prefilled in the context panel, and one explicit manual retry can resume after service recovery.
- Corrected parity ledger row A10 and scenario evidence so visible controls alone no longer count as interaction parity.
- Restarted only the verified repository-owned port-8000 uvicorn process so the current v5 capability contract is live; `/health` returned 200 and unauthenticated capability access remained 401.

## Remaining work

- None.

## Exact next action

Await the next bounded Human Owner Task after this exact delivery is committed and pushed.

## Files changed

- `ai/tasks/todo/TASK-T5-095.md`
- `ai/tasks/doing/TASK-T5-095-PLAN.md`
- `ai/tasks/doing/TASK-T5-095-PROGRESS.md`
- `ai/state/CURRENT.md`
- `ai/state/ROADMAP.md`
- `ai/evidence/t5-094/libtv-canvas-parity-ledger.md`
- `ai/evidence/t5-094/libtv-canvas-scenario-manifest.json`
- `ai/reports/REPORT-T5-095.md`
- Backend script-reference contract, route, schema, and tests.
- Frontend composer/resource/capability/script-authoring components, services, and browser fixtures/tests.

## Commands run and summarized results

- Required git baseline: tracked clean; only preserved `.codex/`, `.hermes/plans/`, and `output/` untracked; HEAD and remote at `789397fe...`.
- Read-only process/HTTP audit: Vite 5173 and FastAPI 8000 healthy; backend process predates T5-094 and lacks reload; unauthenticated capability call correctly returns 401.
- Source inspection: isolated attachment/Send/capability root causes described above.
- RED browser baseline: 3/3 reported behaviors failed on resource intent, real model/Send, and capability recovery; 503 brief recovery separately failed on an empty retry field.
- Backend related matrix: `23/23` passed across script contract, capability/provider validation, and text-generation route tests, including disposable MySQL.
- Frontend related Chromium matrix: `26/26` passed across shell/composer, script authoring, Project Resources, and resource races.
- Production build: `vue-tsc -b` and Vite passed with `4937 modules transformed`.
- Accessibility: composer-scoped axe found zero serious/critical violations.
- Manifest audit: 28 scenarios, `R-095-COMPOSER` present, and exactly one A10 scenario; `git diff --check` passed.

## Blockers and release conditions

- No blocker. Real Agnes smoke remains separately Human-gated and was not used for this offline defect correction.
