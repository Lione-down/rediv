# TASK-T6-006 - Full-stack modular refactor architecture and execution baseline

- State: `DOING`
- Verification outcome: `PENDING`
- Phase: `Product V3 / Phase 6 architecture reset`
- Objective: redesign Revid's product workflows and frontend/backend architecture together, reduce orchestration and persistence concentration, separate product behavior from infrastructure, and decompose later implementation into independently mergeable Tasks after the Human Owner supplies the replacement workflow logic.
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
- Decompose approved implementation into small Tasks that each preserve a usable application.

## Non-goals and locked boundaries

- No frontend/backend business-code change, schema migration, provider contract change, visual implementation, or removal/reuse of T6-005 code before the Human Owner supplies and approves the replacement workflow logic.
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
