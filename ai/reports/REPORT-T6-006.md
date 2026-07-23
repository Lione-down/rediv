# REPORT-T6-006 - Full-stack modular refactor architecture and execution baseline

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-23`
- Activation baseline: `6ae71ef00127c141c6a4a7fed9f85521a33e303f`
- Planning audit baseline: `082f01f238b896b2baac5afa35445f0fd4d8a0f7`
- Human decision: replacement workflow, architecture, rejected-code disposition, and T6-007 through T6-016 sequence explicitly approved for continuation

## Delivered

- Durably retained T6-005 as `BLOCKED / FAIL`; its visual design, interaction logic, business flow, and information architecture remain rejected, with no REPORT or reuse presumption.
- Measured the current frontend/backend surface and identified the main orchestration and persistence concentration points without changing business code.
- Accepted a contract-first modular-monolith strangler architecture that preserves Vue 3, Pinia, Leafer UI, FastAPI, SQLAlchemy, MySQL-only runtime, multi-canvas ownership, graph/history/autosave, accessibility, and review-only mobile.
- Defined one stable user-visible card identity, one visible geometry authority, editable external node titles, same-card results, compatibility-only legacy result projection, and image-batch sibling behavior.
- Defined durable browser-independent text/script/image/video jobs, compact versioned submit/status/result/delta APIs, MySQL lease/idempotency ownership, and current-Canvas cursor synchronization.
- Defined the project-owned non-selectable `revid.story-director` Skill and versioned `revid.story-production` document with editable and lockable roles, scenes, props, shots, asset prompts, and one video prompt per shot.
- Defined semantic multi-image video references with stable node/asset IDs, source revision, role, independent instruction, exclusions, and deterministic order; unsupported provider capabilities fail closed.
- Decomposed implementation into dependency-ordered Tasks T6-007 through T6-016, beginning with replacement RED contracts and ending with compatibility retirement plus explicit three-axis Human acceptance.

## Verification

- Repository source measurements, hotspot inventory, current API/polling/provider/result behavior, and missing durable-worker/rename/director/semantic-reference contracts were audited read-only at `082f01f2`.
- Task, PLAN, PROGRESS, accepted architecture, CURRENT, ROADMAP, and this REPORT agree on T6-006 `DONE / PASS`.
- The Human Owner approved completion and continuation on 2026-07-23 by explicitly directing Codex to complete T6-006 and start the next T6 Task in a new goal-mode session.
- Project-state validation, UTF-8/no-BOM checks, diff checks, link checks, and scoped-path review pass. Staged sensitive-path hygiene is performed immediately before commit.

## Boundaries

- T6-006 changed planning/state documentation only. It made no business-code edit, schema migration, provider call, secret access, database mutation, destructive action, framework replacement, external-account change, or paid request.
- The public MIT `Emily2040/seedance-2.0` commit `57d01dc66f93ecb03c2475be5f22dc416d9b701d` remains research evidence only; it was not installed, executed, or adopted as a runtime dependency.
- Real/paid provider proof, runtime schema application, destructive legacy conversion, incompatible contracts, and final visual/functional/interaction acceptance remain explicit Human gates.
- User-owned untracked `.codex/`, `.hermes/plans/`, `output/`, `storage/`, and `test-results/` remain excluded from delivery.

## Delivery

- T6-006 is complete.
- T6-007 is the sole active Task and owns replacement RED contract tests only.
- Later T6 Tasks remain dependency-blocked and must be activated one at a time in new goal-mode sessions after the preceding Task is completed, committed, pushed, and durably reconciled.
