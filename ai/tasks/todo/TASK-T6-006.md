# TASK-T6-006 - Full-stack modular refactor architecture and execution baseline

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 architecture reset`
- Objective: redesign Revid's product workflows and frontend/backend architecture together around the Human-approved LibTV-style card work model, built-in director Skill, truthful semantic multi-image video, durable generation jobs, and compact APIs; reduce orchestration and persistence concentration, separate product behavior from infrastructure, and decompose later implementation into independently mergeable Tasks.
- Dependency: `T6-004 - DONE / PASS`. T6-005 is `BLOCKED / FAIL` and is evidence, not a dependency or implementation baseline.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-006-PLAN](../doing/TASK-T6-006-PLAN.md).
- Progress: [TASK-T6-006-PROGRESS](../doing/TASK-T6-006-PROGRESS.md).

## Objective and outcome

T6-006 is a design and decomposition Task. T6-005's visual design, interaction logic, business flow, and information architecture are all rejected. T6-006 must produce a replacement product workflow, an aligned target architecture, a measured migration sequence, and exact verification/rollback contracts. It does not authorize business-code implementation.

## Scope

- Record the complete T6-005 rejection and preserve its committed code only as an audit/reference snapshot, not as an accepted behavior baseline.
- Inventory current frontend routes, Pinia stores, Canvas orchestration, commands, rendering, API clients, backend routers, application services, repositories, database transactions, and test authorities.
- Define frontend presentation, feature-orchestration, domain-state, command, renderer, and API boundaries.
- Define backend HTTP, application-service, transaction, repository, model, schema, and provider boundaries.
- Define typed cross-layer contracts, compatibility rules, observability, test ownership, migration slices, rollback, and completion gates.
- Define user-editable stable node naming, same-card generation lifecycle, script asset/shot ownership, and semantic `@` reference behavior.
- Define durable browser-independent text/script/image/video jobs and compact submit/status/result/delta responses.
- Define a project-owned, non-selectable director Skill that converts story text into roles, scenes, props, shots, asset prompts, and one video prompt per shot.
- Define truthful semantic multi-image video references with per-image role and instruction instead of coercing all multi-image input to keyframes.
- Decompose approved implementation into small Tasks that each preserve a usable application.

## Non-goals and locked boundaries

- No frontend/backend business-code change, schema migration, provider contract change, visual implementation, or removal/reuse of T6-005 code before the Human Owner approves this replacement workflow and explicitly requests implementation.
- No framework replacement, second Canvas engine, second database, microservice split, new runtime language, Tailwind, or new UI library.
- Preserve Vue 3, TypeScript, Pinia, Naive UI, Leafer UI, SCSS, FastAPI, Pydantic, SQLAlchemy, MySQL, Alembic, multi-canvas ownership, Canvas history, persistence, accessibility, and review-only mobile unless a new Human-approved ADR explicitly changes one.
- No real or paid provider call, secret access, destructive data/filesystem action, irreversible migration, or external-account change.

## Acceptance criteria

1. T6-005 is durably recorded as `BLOCKED / FAIL`, with no REPORT or false completion claim.
2. The current system map and hotspot inventory are backed by live repository measurements.
3. The replacement product workflow covers visual hierarchy, interaction logic, business flow, and information architecture, and the Human Owner approves it.
4. The target frontend/backend boundaries assign one owner to each state transition and avoid circular authority.
5. Public API, Canvas document, generation, history, persistence, and MySQL contracts identify compatibility and migration rules.
6. Every implementation slice is independently mergeable, has focused and regression proof, and has a rollback path that does not require data loss.
7. The plan covers happy paths, failures, conflicts, reload/restart, accessibility, performance, security, and sensitive-path hygiene.
8. The Human Owner explicitly approves the replacement workflow and architecture before any business-code implementation Task activates.
9. Text, script, image, and video generation contracts are browser-independent and do not return full task history, `request_parameters`, provider raw responses, duplicated result bodies, or base64 media in ordinary polling.
10. Semantic multi-image video preserves every stable reference ID, role, instruction, and order, and fails closed when the selected provider cannot truthfully consume them.

## Completion decision

- On 2026-07-23, the Human Owner explicitly approved completion and continuation by directing Codex to complete T6-006 and start the next T6 Task in a new goal-mode session.
- This approval accepts the replacement workflow, modular-monolith strangler architecture, T6-005 rejected-code disposition, and dependency-ordered T6-007 through T6-016 implementation sequence.
- T6-006 authorizes no business-code change of its own. T6-007 is the first implementation Task and begins with replacement RED contract tests.
