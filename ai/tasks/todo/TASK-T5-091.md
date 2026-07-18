# TASK-T5-091 - Revid native cinematic skills and reference-aware generation optimization

- State: `DOING`
- Objective: add three Revid-owned, versioned cinematic Skills for script planning, image generation, and video generation that optimize user input before provider execution, preserve explicit Canvas references, and reduce avoidable regeneration caused by style, identity, wardrobe, scene, product, camera, and motion drift.
- Dependency: `T5-090 - DONE - PASS` at committed and pushed delivery `1aad57189497353c5e54a60ac8b87b6fa9677d7a`; durable state closure is `c27e6f9058d15a3da3be461f816953d395f65444` on `origin/main`.
- Activation rule: this Task must remain inactive until T5-086 through T5-090 are complete. Activation must create or refresh `ai/tasks/doing/TASK-T5-091-PLAN.md` and `ai/tasks/doing/TASK-T5-091-PROGRESS.md` from the then-current T5-090 interface before any business-code edit.

## Product direction

- Revid owns and maintains the Skills. Users cannot upload, install, edit, or execute arbitrary `SKILL.md`, Python, shell, or remote code.
- The first Skill suite targets professional film and episodic-video creation rather than generic one-shot media generation.
- The suite improves generation inputs before execution. It does not automatically score outputs, regenerate results, or incur an additional provider charge without an explicit user action.
- The suite consists of three independently versioned built-in Skills delivered inside this single Task:
  - `revid.cinema-script.v1`
  - `revid.cinema-image.v1`
  - `revid.cinema-video.v1`
- Reuse the exact T5-090 Agent/Skill registration, preflight, execution, auth, project, Canvas, generation, quota, task, result, and capability boundaries. Do not introduce a parallel Skill API or runtime.
- Preserve Revid's graphite-black/violet UI, Leafer Canvas, typed ports, forward/reverse connections, reroute, groups, Storyboard projection, immutable source assets, downstream result branches, history, autosave, recovery, and responsive ownership.
- Reproduce only publicly observable capability and interaction patterns. Do not copy LibTV private source, prompts, schemas, brand, icons, copy, model routing, or visual assets.

## User problem

Users currently need to repeat image or video generation when provider output drifts from their intended references. The priority drift classes are:

1. visual style;
2. character identity and facial appearance;
3. wardrobe;
4. scene appearance and layout;
5. product appearance;
6. character and style continuity in video;
7. camera movement and action stability.

The Skills must reduce preventable drift by turning the user's prompt, explicit `@` references, generation controls, and selected provider/model into one deterministic, inspectable provider request. Provider visual quality remains capability-dependent and must not be overstated.

## Locked interaction model

### Skill selection

- The user does not need to learn Skill names before creating content.
- Revid recommends the relevant built-in Skill from the current card and media context, shows the selected Skill and version, and allows the user to change or disable that recommendation before execution.
- The Skill never selects a provider or model for the user. Provider/model selection remains visible on the generation card and is user-owned.

### Structured `@` references

- Typing `@` in the applicable script/image/video composer opens an accessible list of eligible nodes from the current Canvas.
- A mention displays the node title but persists an exact stable node ID. Renaming the node must not break the binding.
- The user assigns meaning through natural-language instructions immediately associated with each mention, for example:
  - `@角色参考 保持脸型、发型和服装`
  - `@画风参考 只参考色彩和绘画风格`
  - `@场景参考 保持空间布局，但改为夜景`
  - `@参考图1 作为视频首帧`
  - `@参考图2 作为视频尾帧`
  - `@动作视频 只参考人物动作节奏`
- Mention parsing must use a structured editor/token contract. Do not recover node identity by parsing display text or by regex concatenation.
- All canonical node families may appear in the mention chooser when they have a meaningful projection: script, text, note, image, video, audio, asset, generation, result, Storyboard group, and other canonical groups introduced by completed dependencies.
- "Supported by the mention system" does not mean every provider can consume every referenced medium. Unsupported roles or media must fail closed during preflight with a specific reason; they must never be silently ignored or converted into a weaker request.
- References must belong to the authenticated user, current project, and current Canvas. Cross-Canvas references are invalid.
- Groups expand into bounded, deterministic, ordered child references. Deleted, stale, malformed, inaccessible, cross-project, duplicate, recursive, or over-limit references are invalid.

### Instruction precedence

Conflicts resolve in this exact order:

1. the user's explicit current instruction;
2. the instruction bound to an individual `@` reference;
3. current editable script, shot, and generation-node parameters;
4. the selected Skill's consistency policy;
5. provider/model defaults.

The Skill must never silently override an explicit user request in order to preserve a reference's original style or content.

### Preflight visibility

- The default card view shows a concise execution summary rather than the complete optimized prompt.
- The summary includes Skill ID/version, referenced nodes and interpreted roles, preserved attributes, allowed changes, provider/model, capability conflicts, and whether user-billed execution acknowledgement is required.
- Preserve the existing T5-025 audit contract: an accessible collapsed disclosure must reveal the exact optimized prompt, reference order, and parameters that will be sent to the provider.
- Preview and provider request must remain byte-for-byte equivalent after canonical serialization. The backend may not secretly add a second prompt that the user cannot inspect.

## Built-in Skill contracts

### `revid.cinema-script.v1`

The script Skill must optimize for story structure, character-setting consistency, shot decomposition, requested shot count, and downstream image/video generatability.

- Produce an editable script text node as the user's narrative source.
- Produce a related strict shot document rather than relying on prose parsing at generation time.
- Evolve the completed shot-schema contract backward-compatibly so each ordered shot can carry bounded title, narrative, dialogue, characters, wardrobe, scene, action, framing/camera intent, duration intent, image prompt intent, video prompt intent, and generatability status/reason.
- Preserve stable shot identity and independent Storyboard order.
- Script text remains freely editable. When the source script changes, an existing derived shot document and downstream results remain visible but become explicitly stale against the new source revision.
- Never overwrite or automatically regenerate the shot document, images, or videos after a script edit.
- Creating or refreshing the shot document is one explicit user action and one atomic Canvas command/history/autosave boundary.

### `revid.cinema-image.v1`

The image Skill must create a strict pre-generation constraint envelope from user instructions, structured references, current shot intent, selected model capability, and existing generation parameters.

The envelope covers:

- style lock;
- character identity lock;
- wardrobe lock;
- scene lock;
- product appearance lock;
- attributes explicitly allowed to change;
- bounded negative drift constraints;
- deterministic reference order and provider-specific reference mapping.

Additional rules:

- Preserve the user's raw instruction and reference-bound instructions as authoritative inputs.
- Reuse existing image ratio, shot-control, image-operation, recipe, capability, task snapshot, quota, retry, and downstream branch contracts.
- Never mutate or replace a source node, source asset, or previous result.
- Do not automatically evaluate the output, retry it, change model, or submit an additional request.
- Same Skill version, source revision, user instruction, reference bindings, generation parameters, and provider capability document must resolve to the same canonical preflight request.

### `revid.cinema-video.v1`

The video Skill must extend the same style, identity, wardrobe, scene, and product continuity envelope with video-specific intent:

- first-frame reference;
- last-frame reference;
- same-image first-and-last-frame reference;
- additional identity/style/scene/action references;
- camera movement;
- character action and motion intent;
- action-stability constraints;
- duration, frame, reference-mode, and temporal controls delivered by earlier Tasks.

Additional rules:

- First/last/reference meaning comes from the user's instruction bound to each `@` mention, not from list position alone.
- Provider/model capability truth is authoritative. A model without exact first-frame, last-frame, multi-reference, audio, or video-reference support must reject that request before task, quota, asset, or provider mutation.
- The Skill must not silently remove a last frame, collapse multiple references, convert keyframes to image-to-video, or switch models.
- Reuse existing asynchronous task creation, polling, progress, cancellation, retry, result persistence, lineage, and downstream branching.

## Provider and model boundary

- Agnes remains the built-in provider.
- T5-091 must consume a backend-owned provider/model capability catalog and render the available model selector on the generation card. Do not hardcode model options in the frontend.
- The selected Skill optimizes and translates input for the model selected by the user; it does not perform automatic model routing.
- Provider/model capability documents must declare accepted reference media and roles, reference-count bounds, supported generation controls, billing responsibility, and whether cost acknowledgement is required.
- Malformed, stale, future, overclaiming, or internally inconsistent capabilities fail closed.
- Future user-configured providers must be able to reuse the same Skill contracts through stable provider/model identity. T5-091 does not implement API-key entry, encrypted credential storage, provider-account management, or third-party account onboarding.

## User-billed execution acknowledgement

- Define a generic acknowledgement boundary for a future provider whose capability declares that token cost is borne by the user.
- Before such a request, show a reminder modal with the selected provider/model and the fact that the user's own quota or balance will be consumed.
- The default suppression duration is 24 hours. The user may choose a shorter or longer duration, bounded to a maximum of 30 days.
- Acknowledgement is isolated by authenticated user and provider. Expiry restores the reminder automatically.
- Cancellation or expiry must prevent task creation, quota reservation, asset mutation, and provider execution.
- Production Agnes behavior follows its backend capability. Mock capabilities must verify both acknowledgement-required and acknowledgement-not-required paths.
- The activation audit must choose an account-scoped server persistence mechanism consistent with the then-current auth/profile model. It may add a narrowly scoped, commented MySQL table and migration if no reusable preference store exists; local storage alone is insufficient authority for bypassing a cost warning.

## Source revision and stale-result rules

- Every Skill request snapshot records Skill ID/version, source node revisions, structured mention bindings, provider/model, capability version, generation parameters, and canonical optimized request.
- Editing a referenced node, source script, shot document, or relevant generation parameter after a run does not mutate previous tasks or results.
- Existing downstream nodes remain available and are labeled as based on an older source revision.
- Re-running is always explicit and creates a new task/result lineage.
- Reload, autosave recovery, Canvas duplication, and revision restore must preserve exact reference bindings and stale/current classification without crossing Canvas identity.

## Scope

- Register the three strict built-in cinematic Skill definitions through the completed T5-090 interface.
- Add strict structured mention/reference contracts and an accessible mention composer for script/image/video authoring cards.
- Add deterministic reference projection for every compatible canonical node family and bounded group expansion.
- Add backend-authoritative prompt optimization, canonical serialization, exact preflight, request snapshot, and provider capability validation.
- Deliver editable script plus backward-compatible structured shot planning and stale-source behavior.
- Deliver image consistency and video continuity optimization without automatic post-generation evaluation or retry.
- Deliver card-level provider/model choice and a capability-driven user-billed acknowledgement contract.
- Reuse existing generation, quota, task, result, history, autosave, recovery, duplication, Storyboard, lineage, and responsive boundaries.

## Implementation plan

### Unit 0 - Dependency audit and contract lock

1. Confirm T5-086 through T5-090 are `DONE - PASS`, committed, and pushed; stop if T5-090 does not expose one strict registration/preflight/execution boundary that can host the three Skills.
2. Re-read the active source of truth and audit the delivered T5-090 Skill manifest, executor, auth, and API contracts together with T5-025 preflight, T5-075 through T5-086 generation contracts, T5-083/T5-084 shot/recipe contracts, T5-087 workflow execution, T5-088 video processing, and T5-089 audio capabilities.
3. Create or refresh the active Task PLAN/PROGRESS and lock exact versioned manifest, mention, optimized-request, shot-schema evolution, capability, stale-source, acknowledgement, and request-snapshot contracts before business-code edits.
4. Write the first backend/frontend RED tests for unknown Skill IDs/versions, malformed mentions, cross-scope references, preview/request drift, and unsupported provider roles.

Success gate: the activated Task, PLAN, PROGRESS, CURRENT, and ROADMAP agree on T5-091 as the only active implementation Task; no parallel Skill or generation runtime is required.

### Unit 1 - Shared Skill registry, mentions, and preflight

1. Add the three exact built-in Skill definitions to the T5-090 registry and reject duplicate, unknown, disabled, malformed, or future definitions.
2. Implement structured mention tokens, stable node-ID binding, deterministic reference projection, group expansion, source revision capture, exact scope ownership, and fail-closed capability filtering.
3. Add the accessible `@` chooser and keyboard/focus/Escape behavior to the existing authoring surface without adding a parallel modal or Canvas store.
4. Add the concise execution summary and retain T5-025's collapsed exact request disclosure.
5. Prove deterministic canonical serialization and exact preview-to-provider equality through mock execution.

Success gate: existing ordinary generation can consume structured mentions safely even before the three specialized Skill executors are complete.

### Unit 2 - Cinematic script Skill

1. Add RED tests for story/character/shot-count/generatability output, strict schema evolution, stable shot identity, source revision drift, malformed provider text, and zero Canvas mutation on failure.
2. Implement the script optimizer through the existing text generation/task lifecycle and T5-090 executor.
3. Create editable script text and the related structured shot document through one atomic Canvas command.
4. Add per-shot editing, stale-source presentation, explicit refresh, undo/redo, autosave/reload/recovery, Storyboard order, and Canvas duplication coverage.

Success gate: the script Skill is independently usable and creates editable narrative plus generation-ready, versioned shot data without triggering image or video generation.

### Unit 3 - Cinematic image Skill

1. Add RED tests for style, identity, wardrobe, scene, and product constraints; explicit-change allowances; reference order; user-instruction precedence; provider capability drift; and deterministic request snapshots.
2. Implement the backend-owned image optimizer and provider-specific reference mapping without changing the user's selected model.
3. Reuse the existing image card, generation parameters, quota/task/result lifecycle, downstream branching, failure, and explicit retry behavior.
4. Prove source/result immutability and that no post-generation evaluator or automatic retry path exists.

Success gate: the image Skill is independently usable and sends one exact, inspectable, capability-valid request for each explicit user action.

### Unit 4 - Cinematic video Skill

1. Add RED tests for first frame, last frame, same first/last frame, extra identity/style/action references, camera movement, action stability, and media-role incompatibility.
2. Implement the backend-owned video optimizer and exact provider reference translation through the existing asynchronous video lifecycle.
3. Reuse duration, keyframe/image-to-video, shot-control, temporal, audio, task progress, cancellation, retry, result, and lineage contracts delivered by dependencies.
4. Prove unsupported last-frame, multi-reference, audio, and video-reference requests fail before task/quota/provider mutation and never silently degrade.

Success gate: the video Skill is independently usable and produces one exact request that preserves every compatible user-bound role.

### Unit 5 - Model choice, billing acknowledgement, and stale lineage

1. Render the backend capability model catalog on each applicable card and persist the exact user-selected provider/model in node parameters and task snapshots.
2. Implement the generic user-billed acknowledgement policy, 24-hour default, bounded custom suppression, expiry, cancellation, and user/provider isolation through the approved account-scoped persistence boundary.
3. Add stale/current derivation classification for script, shot, reference, generation, task, and result lineage without mutating historical nodes.
4. Prove reload, recovery, duplication, revision restore, and explicit rerun preserve exact ownership and never cross Canvas scope.

Success gate: provider/model choice remains user-owned, billing acknowledgement is fail closed, and old results remain usable but truthfully classified.

### Unit 6 - Regression, visual verification, and closure

1. Run focused backend/frontend Skill, mention, shot, image, video, capability, billing, and stale-lineage tests first.
2. Run related generation, task, quota, professional action, Storyboard, autosave, recovery, duplication, and security regression.
3. Run product backend, frontend production build, and functional Chromium.
4. Verify 1440x900, 1366x768, 920x900, and 375x812 review-only ownership; keyboard, focus, Escape, reduced motion, accessible names, no horizontal overflow, and graphite/violet continuity.
5. Run the guarded 200-node/300-connection performance boundary without threshold weakening and verify the mention/summary UI adds no active-frame graph mutation.
6. Perform a fresh acceptance/diff/UTF-8/BOM/file-growth/secret/sensitive-path review, write REPORT, close durable state, exact-stage owned files, commit, and push.

Success gate: code, tests, evidence, REPORT, CURRENT, ROADMAP, commit, and `origin/main` agree on `DONE - PASS`; any real-provider visual-quality claim remains explicitly deferred unless separately authorized and evidenced.

## Acceptance criteria

1. T5-091 activates only after T5-090 is complete and does not rewrite or weaken any T5-086 through T5-090 contract.
2. Exactly three Revid-owned cinematic Skill IDs and version-1 definitions exist; arbitrary user or remote Skill execution is impossible.
3. Skill selection is recommended from context, visible, changeable, and never silently forces a Skill.
4. Provider/model selection is visible and user-owned; the Skill cannot automatically route to a different model.
5. Structured `@` mentions bind stable node IDs, survive rename, and preserve exact per-reference instructions.
6. Every compatible canonical node family can project a bounded reference; unsupported provider roles fail with a specific preflight reason and are never silently dropped.
7. Deleted, stale, duplicate, recursive, inaccessible, cross-user, cross-project, cross-Canvas, malformed, or over-limit references fail before mutation.
8. Conflict resolution exactly follows user instruction, per-reference instruction, current node data, Skill policy, then provider defaults.
9. The default UI shows a concise execution summary; the collapsed full preflight remains accessible and exactly matches the canonical provider request.
10. The script Skill produces editable narrative plus strict ordered shot data covering story structure, character consistency, shot count, and generatability without triggering image/video generation.
11. Script edits preserve existing shot/results but mark them stale; refresh and rerun are explicit and create new history/lineage.
12. The image Skill carries exact style, identity, wardrobe, scene, and product constraints plus explicitly allowed changes into one provider request.
13. The video Skill carries exact first/last/additional reference roles, continuity, camera movement, action, stability, duration, and temporal intent into one provider request.
14. Same versioned inputs and capability document produce a deterministic canonical preflight request and immutable task snapshot.
15. No Skill automatically evaluates output, retries, changes model, spends additional quota, or overwrites a source/previous result.
16. Capability/context drift between preflight and submission yields zero task, quota, asset, Canvas, or provider mutation.
17. User-billed provider execution requires an unexpired user/provider acknowledgement; the default suppression is 24 hours and the maximum is 30 days.
18. Cancelling or letting the acknowledgement expire prevents execution without changing the Canvas or quota.
19. Existing ordinary generation, image operations, shot controls, recipes, Storyboard, workflow execution, video editing, audio, auth, project, Canvas, quota, task, result, history, recovery, and duplication remain backward compatible.
20. Focused tests pass before related regression; product backend, production build, functional Chromium, responsive/a11y/manual visual review, hygiene, and guarded performance evidence pass without threshold weakening.
21. No real/paid call, `.env` or secret access, external account, third-party API-key storage, destructive operation, cross-Canvas relation, second Canvas engine/store, mobile editing, or incompatible UI redesign occurs without a separately authorized Task scope.
22. T5-091 does not claim LibTV-equivalent visual quality from mock or contract evidence. Real visual fidelity remains an explicitly classified manual/provider-dependent boundary.

## Expected implementation surface at activation

The activation audit must reuse the exact T5-090 files delivered by the dependency. Existing integration authorities expected to remain relevant include:

- `backend/core/generation_provider.py`
- `backend/core/generation_parameter_contract.py`
- `backend/api/text_generate.py`
- `backend/api/image_generate.py`
- `backend/api/video_generate.py`
- `backend/schemas/generation.py`
- `backend/schemas/shot_schema.py`
- `backend/controllers/generation_transactions.py`
- `backend/models/generation_task.py`
- `frontend/src/modules/canvas/professional-action-registry.ts`
- `frontend/src/modules/canvas/generation-context.ts`
- `frontend/src/modules/canvas/generation-parameters.ts`
- `frontend/src/modules/canvas/generation-service.ts`
- `frontend/src/modules/canvas/shot-schema.ts`
- `frontend/src/components/canvas/CanvasContextPanel.vue`
- `frontend/src/components/canvas/CanvasGenerationParameterControls.vue`
- `frontend/src/views/app/CanvasWorkspace.vue`
- focused backend tests under `backend/tests/`
- focused Chromium tests under `frontend/tests/e2e/`

Do not pre-create a parallel module tree before the T5-090 as-built interface is available. At activation, split new modules by manifest/contract, mention binding, script optimization, image optimization, video optimization, and billing acknowledgement responsibilities so no new file grows beyond the project's normal size boundary.

## Verification commands at activation

Run focused selectors first, then the complete gates from their canonical working directories:

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

The active PLAN must retain these focused test responsibilities and may split a named file only when the T5-090 as-built module boundary requires a smaller test module. Real-provider calls are not part of the default verification plan.

## Non-goals

- No user-authored, marketplace, imported, or remotely executed Skills.
- No arbitrary Python, shell, package installation, or external Skill runtime.
- No LibTV API bridge or dependency on LibTV service availability.
- No copied private prompts, schemas, model routing, or provider internals.
- No post-generation similarity scoring, face recognition, automatic quality judgment, or automatic regeneration.
- No automatic provider/model selection.
- No third-party API-key entry, encrypted credential vault, provider-account CRUD, or account onboarding in this Task.
- No source/result replacement, destructive editing, hidden request mutation, or automatic paid execution.
- No cross-Canvas references, real-time collaboration, second Canvas engine/store, or mobile graph editing.
- No claim that contract/mock evidence proves visual parity with LibTV.

## Risks and controls

- Provider capability is the load-bearing quality boundary. Prompt optimization cannot guarantee identity or style continuity when the selected model lacks the required reference controls; unsupported intent therefore fails closed.
- Prompt secrecy conflicts with existing exact-request auditability. The full request remains available through a collapsed disclosure while the default card stays concise.
- Supporting every node family can cause ambiguous or oversized inputs. Structured mention roles, bounded group expansion, deterministic ordering, and provider limits prevent silent context explosion.
- Script text and structured shots can drift. Source revision snapshots and explicit stale classification preserve both without pretending they remain synchronized.
- A user-cost warning cannot rely only on browser storage. Server-authoritative, time-bounded acknowledgement prevents client bypass while keeping the eventual credential vault out of scope.
- T5-091 crosses more than eight backend/frontend/test files. Focused modules, one existing runtime, phase-independent units, and no new service limit blast radius.
- If T5-090 does not provide a reusable strict registration/preflight/execution boundary, T5-091 must stop at Unit 0 and re-plan rather than add a parallel interface.

## Human gates

- Any real or paid provider call, provider-specific visual-quality smoke, external account, real API key, credential migration, destructive edit, database operation against user/runtime data, or incompatible UX requires explicit Human Owner authorization.
- A new provider credential vault or user provider-account management capability requires a separate future Task and security design; this document only preserves compatible provider/model identities and billing acknowledgement behavior.
