# TASK-T5-090 - Revid native Agent/Skill interface

- State: `DONE - PASS`
- Objective: deliver the smallest reusable Revid-owned Agent/Skill registration, preflight, and execution interface that composes Revid's existing authenticated project, Canvas, generation capability, quota, task, and result contracts without copying LibTV source or creating an external Skill runtime.
- Dependency: `T5-089 - DONE - PASS` at pushed baseline `dc576fb72473c56dacbf16323730ce9d6c77b29e`.

## Product direction

- Reproduce only publicly observable professional Agent/Skill interaction capabilities. Do not copy LibTV private source, manifest/schema text, prompts, brands, icons, visual assets, or model routing.
- A Skill is a Revid-built, versioned manifest and typed executor registered in application code. Users cannot upload, install, edit, import, or execute arbitrary `SKILL.md`, Python, shell, packages, remote tools, or marketplace content.
- Reuse existing auth, user/project/canvas ownership, canonical node/edge model, generation capability, quota, task, output asset, history/autosave, and 375px review-only boundaries. No parallel auth, project, Canvas, generation, billing, task, result, or store is allowed.
- No Skill can silently create a paid/provider job, provider account, task, quota reservation, asset, or Canvas mutation. Missing execution authority, capability, acknowledgement, or native contract must fail closed and be inspectable.

## Scope

1. Audit the current native API and frontend contract surfaces and lock one strict versioned manifest/registration/preflight/execution model before business-code edits.
2. Add only Revid-owned built-in registration and typed contract surfaces necessary to enumerate a Skill, bind it to one authenticated current project and Canvas, resolve deterministic preflight, and hand an explicitly authorized native execution request back to existing generation/task authority.
3. Preserve exact current-generation semantics: Skill preflight must be inspectable and must not modify graph/history/autosave, quota, task, result, asset, provider, or model selection unless an existing native execution action separately accepts the exact request.
4. Provide mock/contract proof for authentication, project/canvas scope, unknown/disabled/version drift, capability drift, quota/task/provider non-mutation, 375px review-only, keyboard/accessibility, and ordinary Canvas/generation regression.

## Locked v1 boundary

- Existing `/api/text-generate`, `/api/image-generate`, and `/api/video-generate` immediately enter durable generation task/provider flows. They are not a generic dry-run or acknowledgement-aware executor and must not be wrapped as one.
- T5-090 v1 therefore registers exactly one Revid-built `revid.canvas-context.v1` Skill. It resolves only authenticated, current-project, current-Canvas canonical selection into a deterministic context summary; its executor is `mock-only`, non-durable, and has no provider/quota/task/asset/Canvas authority.
- The versioned executor interface also models `unavailable` truthfully. Future built-in Skills may register through this exact interface, but a real native generation handoff requires a future Task to supply an explicit user acknowledgement and reuse the existing generation request/task semantics without a second authority.
- Discovery and preflight must be server-authenticated through the existing `current_user` and `canvases.get_canvas` ownership boundary. The frontend may display the preflight only through the existing desktop Palette/overlay pattern; 375px stays review-only.

## Acceptance criteria

1. Registration and manifest contracts are versioned, strict, deterministic, Revid-owned, and reject unknown, duplicate, disabled, malformed, future, arbitrary, imported, external, or cross-scope Skill definitions.
2. Discovery and preflight are authenticated and enforce current user/project/Canvas ownership; cross-project or cross-Canvas data is rejected before any mutation.
3. Preflight exposes exact Skill ID/version, source/request roles, native capability constraints, required acknowledgement, and executable/unavailable state without fabricating provider/task/quota/result success.
4. Execution reuses existing native generation/task authority or fails closed; it may not introduce a second scheduler, task store, quota ledger, provider route, credential vault, or hidden prompt/request mutation.
5. Existing Canvas commands/history/autosave/recovery, typed ports, bidirectional connections, groups, result branches, Storyboard, video/audio boundaries, responsive layout, reduced motion, keyboard ownership, accessibility, and 375px review-only behavior remain non-regressive.
6. Focused tests precede relevant backend/frontend regression, build, browser/visual/accessibility, hygiene, and classified 200/300 evidence without weakening thresholds.
7. T5-091 may add cinematic Skills only through this exact delivered interface and without a parallel manifest/preflight/execution runtime.

## Non-goals

- No user-authored, marketplace, imported, remote, arbitrary-code, or third-party Skill execution.
- No external account, paid/provider call, real secret, provider credential storage, model auto-selection, hidden prompt mutation, destructive operation, migration, new worker/scheduler, cross-Canvas edge/reference, second Canvas engine/store, or mobile graph editing.
- No cinematic script/image/video optimization, mention editor, billing acknowledgement, or new provider behavior; those are T5-091 scope after this interface closes.

## Human gates

- Paid/provider calls, external accounts, real secrets, credential vault/account management, destructive operations, user/runtime data migration, worker/storage deployment, and incompatible product/UX choices require explicit Human Owner authorization.

## Completion evidence

- `ai/reports/REPORT-T5-090.md` records the closed v1 manifest, authenticated Canvas scope, fail-closed source validation, no-execute boundary, Palette evidence, and final regression results.
- T5-091 remains inactive. It may reuse only this Revid-owned contract and must obtain a future Task-owned acknowledgement/native handoff before any durable generation execution.
