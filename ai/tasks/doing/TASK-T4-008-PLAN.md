# T4-008 Plan - Real-Data Home Project And Asset Dashboard

Last updated: 2026-07-11

## Objective

Replace the current marketing-oriented Home with an authenticated personal project dashboard backed by the existing project, asset, and quota contracts, while keeping Home maintainable and responsive.

## Scope

- Modify `frontend/src/views/app/Home.vue` and the related Home route entry only as required by the Task.
- Add `frontend/src/views/app/components/home/**` for Home-local presentation components.
- Add `frontend/src/modules/project/api.ts`, `types.ts`, and `store.ts` for the project domain.
- Minimally harden `frontend/src/api/assets.ts`, `store/assets.ts`, and `types/asset.ts` when required to remove fabricated state and make real-data loading/session behavior deterministic.
- Reuse the auth-store quota state after verifying its actual contract.
- Align frontend paths with existing backend `/projects` and `/assets` endpoints only when necessary.

## Non-Goals

- No backend, database, migration, Space, Workspace, Canvas, global design-token, or new UI-library changes.
- No implicit demo project or fabricated project, asset, quota, or status values.
- No paid provider calls, real secret access, destructive database operations, or automatic push.
- No unrelated redesign of protected application pages.

## Dependencies And Known Baseline

- T4-003, T4-006, and T4-007 are complete.
- `Home.vue` is currently 951 lines and contains fabricated `quickStarts` content alongside real auth quota and asset-store reads.
- Existing frontend asset files are `api/assets.ts`, `store/assets.ts`, and `types/asset.ts`.
- Existing authenticated backend project endpoints provide create/list/get/delete under `/projects`; asset endpoints are under `/assets`.
- Slice A confirmed the project response is exactly `id`, `user_id`, `name`, and `created_at`; list returns `{ items, total }` newest-first, and create returns `201 Project`.
- The root Home route remains public to preserve the accepted T4-007 guest/auth entry contract. Authenticated project navigation must use `/app/workspace?project_id=<Project.id>`.
- The existing asset store starts with fabricated items and lacks request deduplication, error state, and session invalidation; it must be hardened before Home can claim real or partial asset data.

## Implementation Slices

### Slice A - Contract audit and project-domain foundation

Status: completed and verified on 2026-07-11.

1. Read the complete current Home, router, asset API/store/types, backend project API/schema/store methods, and Workspace project-ID consumption path.
2. Lock the project list/create types and request paths to the existing backend contract.
3. Add the minimal project API and Pinia store with deterministic loading, error, refresh, create, and duplicate-request behavior.
4. Do not edit Home presentation until the domain foundation typechecks and builds.

Success requires a focused typecheck, production build, fresh diff review, updated durable state, and one scoped local commit.

### Slice B - Real-data source hardening and Home decomposition

#### Slice B1 - Asset-domain state hardening

1. Confirm the complete backend asset list response, filters, ordering, and field optionality.
2. Remove fabricated asset-store initial items and add deterministic initial load, refresh error, duplicate-request, and session-reset behavior.
3. Preserve successful same-session data on refresh failure while preventing stale cross-session response writes.
4. Keep the changes limited to the existing asset API/store/types and do not edit Home in this bounded unit.

Success requires a focused runtime adapter harness, typecheck/build, fresh diff review, updated durable state, and one scoped local commit.

#### Slice B2 - Home presentation and real-data states

1. Replace fabricated quick starts and status values with real project, asset, and quota summaries.
2. Split Home-local sections into single-purpose components and reduce `Home.vue` to at most 500 lines.
3. Implement loading, empty, error, partial-data, zero-quota, create-project, refresh, and enter-Workspace states.
4. Reset project and asset state on auth-session changes, and carry the selected project ID explicitly into the existing Workspace query contract.

Success requires typecheck/build plus mocked or local-backend browser behavior for the state matrix.

### Slice C - Real-data acceptance and closure

1. Run the authenticated local-backend matrix with project creation, list refresh, persistence, recent assets, quotas, and API-failure states.
2. Cross-check the created project ID, name, and timestamp against authorized local MySQL evidence without opening or printing secrets.
3. Capture 1440x900, 920px, and 375px screenshots; check console, keyboard access, copy fit, and horizontal overflow.
4. Perform the final diff review, write REPORT, and close T4-008 only after every non-deferred criterion passes.

## Acceptance Mapping

| Acceptance focus | Planned evidence |
|---|---|
| Projects/assets match persistent data | Real local-backend API and authorized MySQL cross-check |
| Project creation updates immediately and survives refresh | Project store behavior plus browser refresh |
| Empty, error, partial, and zero-quota states | Focused browser scenarios |
| Maintainability | `Home.vue` at most 500 lines and domain-aligned local components |
| Build | Focused typecheck and `npm run build` |
| Responsive UI | 1440x900, 920px, and 375px screenshots and overflow checks |

## Risks And Locked Decisions

- Keep the root route public so T4-007 guest entry remains usable; Home exposes authenticated dashboard data only when `authStore.isLoggedIn` is true.
- Workspace already consumes a scalar `route.query.project_id`; T4-008 must pass the backend `Project.id` through that query and must not modify Workspace.
- Asset and project requests can partially fail; the page must preserve successful sections and expose scoped retry actions.
- Both domain stores must reset on auth-session changes so one account cannot see another account's cached data or stale responses.
- Real MySQL acceptance must use credentials already supplied to an authorized runtime and must never read `.env` files or expose credential material.

## Human Gates

None for the planned frontend and normal local-data work. A product-direction conflict about the root route, a required real secret/external account, a destructive data action, or a major contract change must be escalated before implementation.
