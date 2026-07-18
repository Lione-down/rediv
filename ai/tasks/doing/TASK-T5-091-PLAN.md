# TASK-T5-091 Plan

- State: `DONE - PASS`
- Objective: deliver three strict Revid-owned cinematic Skills through a backward-compatible extension of the T5-090 interface, with structured Canvas references, deterministic inspectable requests, user-owned provider/model choice, explicit billing acknowledgement, and honest stale lineage.
- Baseline: `origin/main` at `c27e6f9058d15a3da3be461f816953d395f65444`; T5-090 delivery is `1aad57189497353c5e54a60ac8b87b6fa9677d7a`.

## Unit 0 - Dependency audit and contract lock

- Status: `completed`

1. Preserve T5-090 contract version 1, `revid.canvas-context.v1`, authenticated Canvas scope, and its no-execute boundary exactly.
2. Add a backward-compatible Agent/Skill capability version 2 that retains the v1 manifest and registers exactly `revid.cinema-script.v1`, `revid.cinema-image.v1`, and `revid.cinema-video.v1` as Revid-owned native handoffs. Unknown, duplicate, disabled, malformed, future, imported, remote, and arbitrary definitions remain impossible.
3. Keep discovery and preflight under existing `current_user` plus project/Canvas ownership. Do not add a generic Agent/Skill execute route. Final text/image/video submission must reuse the existing generation APIs, transaction, quota, task, provider, result, and failure authority after revalidating the exact preflight against current Canvas and capability state.
4. Use structured mention tokens, not display-text parsing. Each token carries stable node ID, explicit role, bounded instruction, captured source revision, and deterministic order. Group expansion is Canvas-local, bounded, non-recursive, and canonical.
5. Introduce one backend-owned provider/model catalog. Production initially advertises only the existing Agnes text/image/video models and their honest reference/control/billing capabilities. The frontend never hardcodes or silently changes provider/model identity.
6. Canonically serialize the optimized request once. The concise summary and collapsed exact-request view derive from the same object; submission must reject preview, capability, scope, source-revision, acknowledgement, provider, or model drift before task/quota/asset/provider/Canvas mutation.
7. Persist user-billed acknowledgement server-side by authenticated user and provider, with 24-hour default and 30-day maximum. No reusable account preference store exists; add a narrowly scoped fully commented MySQL model/migration and guarded controller/API without applying it to user/runtime data.
8. Extend task snapshots and Canvas node content backward-compatibly for Skill ID/version, mentions, source revisions, provider/model capability version, canonical request, and stale/current derivation. Historical task/result/source data remains immutable and rerun is explicit.
9. Add backend/frontend RED tests before business implementation for registry drift, malformed/cross-scope mentions, group expansion, unsupported roles, canonical request drift, model drift, acknowledgement expiry/cancel, and zero mutation.

Success gate: Task, PLAN, PROGRESS, CURRENT, and ROADMAP agree on T5-091 as the only active implementation Task; the contract needs no second runtime, scheduler, store, provider route, or hidden prompt.

## Unit 1 - Shared registry, structured mentions, and preflight

- Status: `completed`

1. Implement the versioned registry/capability catalog and strict parsers while keeping T5-090 v1 compatibility tests green.
2. Implement deterministic Canvas-local mention/reference projection for canonical node families and bounded groups.
3. Add an accessible `@` chooser to the existing authoring surface with keyboard, focus, Escape, reduced-motion, desktop/compact ownership, and 375px review-only behavior.
4. Render the concise execution summary and collapsed exact canonical request.
5. Prove preview-to-submit equality and fail-closed scope/capability/source drift through mocked native handoff.

Success gate: structured mentions and exact preflight work for ordinary generation without provider execution or unintended Canvas/history/autosave mutation.

## Unit 2 - Cinematic script Skill

- Status: `completed`

1. Extend the shot schema backward-compatibly with bounded narrative, dialogue, character, wardrobe, scene, action, camera, duration, image/video intent, and generatability fields.
2. Reuse text generation and one atomic Canvas command to create editable script plus ordered shot data only after explicit user action.
3. Preserve stable shot identity and Storyboard order; script edits mark derived shot/results stale without overwrite or automatic regeneration.
4. Cover malformed provider output, refresh/rerun, undo/redo, autosave/reload/recovery, duplication, and zero-mutation failure.

Success gate: the script Skill independently creates editable narrative and generation-ready shot data without image/video generation.

## Unit 3 - Cinematic image Skill

- Status: `completed`

1. Build a backend-owned deterministic constraint envelope for style, identity, wardrobe, scene, product, allowed changes, and bounded negative drift.
2. Preserve explicit instruction precedence and reference order; translate only capability-supported roles for the user-selected model.
3. Reuse the existing image generation, recipe, operation, shot-control, quota/task/result/retry, and downstream branch lifecycle.
4. Prove immutable sources/results/snapshots and absence of automatic evaluation, retry, model change, or extra charge.

Success gate: each explicit image action sends one exact inspectable capability-valid request.

## Unit 4 - Cinematic video Skill

- Status: `completed`

1. Support explicit first frame, last frame, same first/last, additional identity/style/scene/action references, camera movement, action, stability, duration, and temporal intent.
2. Reject unsupported last-frame, multi-reference, audio, video-reference, or control intent before mutation; never weaken, reorder, drop, or model-switch silently.
3. Reuse the existing asynchronous video task, progress, cancellation, retry, result, lineage, and branching lifecycle.

Success gate: each explicit video action submits one exact request preserving every compatible user-bound role.

## Unit 5 - Provider/model choice, billing acknowledgement, and stale lineage

- Status: `completed`

1. Render backend-owned provider/model choices on applicable cards and persist the exact selection in node parameters and immutable task snapshots.
2. Implement server-authoritative acknowledgement create/read/cancel/expiry with user/provider isolation, 24-hour default, bounded custom duration, and 30-day maximum.
3. Derive stale/current state for script, shot, reference, generation, task, and result lineage without mutating history.
4. Prove reload, recovery, duplication, revision restore, and explicit rerun preserve exact Canvas ownership and historical lineage.

Success gate: provider/model remains user-owned; missing/expired acknowledgement and stale context fail closed.

## Unit 6 - Regression and closure

- Status: `completed`

1. Run focused backend/frontend cinematic Skill, mention, capability, billing, snapshot, and stale-lineage tests first.
2. Run related generation, quota/task, professional action, Storyboard, recipe, image operation, shot control, workflow, video, audio, autosave/recovery, duplication, auth, and security regression.
3. Run the product backend suite, production build, functional Chromium, and guarded 200-node/300-connection title without threshold changes.
4. Verify 1440x900, 1366x768, 920x900, and 375x812 review-only ownership, keyboard/focus/Escape/reduced-motion/a11y/no-overflow, and graphite/violet continuity.
5. Perform fresh acceptance, diff, UTF-8/BOM, file-growth, secret, sensitive-path, and exact-stage review. Write REPORT, close Task/PLAN/PROGRESS/CURRENT/ROADMAP, commit with `type(scope): subject`, and push to `origin/main`.

Success gate: code, tests, mock/contract/browser evidence, REPORT, durable state, commit, and `origin/main` agree on `DONE - PASS`; real provider visual fidelity remains explicitly unverified without separate authorization and Human verdict.

## Required focused commands

```powershell
backend\.venv\Scripts\python.exe -m pytest -q backend\tests\test_cinematic_skill_contract.py backend\tests\test_cinematic_skill_execution.py backend\tests\test_cinematic_skill_billing.py -x
```

```powershell
cd frontend
npm run build
npx playwright test tests/e2e/canvas-skill-mentions.spec.ts tests/e2e/canvas-cinematic-skills.spec.ts --project=chromium --timeout=60000 --reporter=line
npx playwright test --project=chromium --timeout=60000 --reporter=line
```

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q
```

## Stop rules

- Stop before `.env`/secret access, paid/real provider calls, external accounts, third-party credential storage, arbitrary/imported/remote Skill execution, user/production migration, destructive data/filesystem work, cross-Canvas relations, second Canvas/runtime/store, mobile editing, or incompatible UX.
- Do not claim provider visual quality from mock, contract, HTTP success, or generated-file existence. The `revid-visual-assets` fidelity checklist requires an authorized real-service sample and separate Human verdict.
- Preserve and never stage `.codex/`, `.hermes/plans/`, `output/`, or unrelated user changes.
