# T4-009 Plan - Real-data Space asset workspace

- Task: `T4-009`
- State: `DONE`
- Owner: Codex Project Lead Engineer
- Updated: 2026-07-11
- Source Task: `ai/tasks/todo/TASK-T4-009.md`
- Decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Objective

Refactor the authenticated Space page into a maintainable dark personal asset workspace backed by the repository's real asset, template, and quota contracts. The finished page must support filtering, pagination, accessible previews, detail and project navigation behavior, explicit loading/empty/error/boundary states, and keep `Space.vue` at no more than 500 lines.

## Scope

Allowed modifications:

- `frontend/src/views/app/Space.vue`
- existing frontend asset API, store, and types when the contract audit proves a change is necessary

Allowed additions:

- `frontend/src/views/app/components/space/**`
- `frontend/src/modules/asset/**`
- `frontend/src/modules/template/**`

Explicit non-goals:

- no backend changes;
- no Home, Workspace, or Canvas changes;
- no global design-token changes;
- no new framework, state-management pattern, or dependency;
- no paid provider call, destructive data cleanup, or secret access.

## Dependencies And Constraints

- T4-003, T4-006, and T4-007 are complete.
- Reuse the existing Vue 3, Pinia, router, Naive UI, and v3 dark-design patterns.
- Preserve current API authorization and deletion/visibility semantics; frontend behavior must follow the implemented backend contract.
- Real-data acceptance must distinguish API/MySQL evidence from mock or fixture evidence.
- The repository must remain usable after each bounded unit, and each completed verified unit must be committed locally with its durable state.

## Locked Product And Visual Direction

- User and context: authenticated creators reviewing personal media, reusable templates, and remaining generation quota across desktop, narrow desktop, and mobile.
- Visual thesis: a dark, media-first utility workspace where real previews are the visual anchor, near-black surface steps carry hierarchy, and the existing violet selection accent is used sparingly.
- Content plan: compact page orientation and status, then assets/templates/quota tabs; assets prioritize filter, total, grid, pagination, and detail; templates prioritize reuse; quota shows remaining counts only.
- Interaction thesis: controlled native view buttons and pagination, a focus-managed detail drawer, 120-200ms transform/opacity feedback, press scale, and a reduced-motion path.
- CSS strategy: existing component-scoped SCSS plus Naive UI only. Reuse the documented dark values, spacing, radius, focus, and status vocabulary without modifying global tokens.
- Benchmark intent: use Runway-style media-first scanning, Figma-style compact asset discovery, and Notion-style explicit view/filter controls as interaction references, without copying branding or inventing capabilities.
- Quiet product boundary: remove the current mock storage usage, hard-coded history/results, and unconditional availability claims. Do not show percentages, capacity, history, restore, or hide actions that the current user API cannot support.

## Delivery Units

### Unit 1 - Contract audit and implementation map - complete 2026-07-11

1. Read the complete Space page and every directly used asset, template, quota, auth, and navigation contract.
2. Trace relevant backend routes, schemas, models, and deletion/visibility behavior without modifying backend code.
3. Record the current data shapes, gaps, risk decisions, component boundaries, test targets, and the first implementation slice in PROGRESS.

Success criteria:

- no business-code edit;
- every planned frontend behavior maps to an existing source contract or an explicitly documented frontend-only decision;
- a single executable next implementation action is recorded.

### Unit 2 - Real-data domain foundation - complete 2026-07-11

Implement as independently verifiable sub-slices:

1. Asset query-state foundation - complete 2026-07-11: preserve the existing default asset cache consumed by Home/Workspace, add an independent paginated collection for Space, keep API `total/page/page_size`, deduplicate only identical queries, reject stale query/session responses, and reset both collections synchronously on token change.
2. Template read foundation - complete 2026-07-11: add `types.ts`, `api.ts`, and `store.ts` for the unpaginated newest-first list and owner-scoped detail response. Keep response-shaped list metadata and a separate latest-selected detail state; deduplicate identical list/detail requests, suppress superseded query/session settlements, and reset both flows synchronously on token change.
3. Detail and mutation clients - complete 2026-07-11: add asset detail/soft-delete and template hard-delete/use calls with exact response handling, including the template 204 body and use-result project ID. Identical template-use calls share one request; because every use creates a project and the backend has no idempotency key, a different template-use ID is rejected locally while one use is pending.

Success criteria:

- shared Home/Workspace asset behavior remains compatible and a filtered Space page never overwrites the default recent-asset cache;
- typed asset/template/quota data flows are covered by focused tests or deterministic contract checks;
- template list/detail loading, data, and error state cannot be closed or overwritten by an older detail selection or authentication session;
- error and boundary behavior is explicit;
- no page redesign is mixed into the domain change.

### Unit 3 - Space controller and local components - complete 2026-07-11

Implement as bounded slices:

1. Extract the verified asset detail/delete coordinator into `modules/asset/**` and the template delete/use state machine into `modules/template/**`. Keep the current Pinia refs and action contracts stable, retain list/detail cache invalidation in the owning stores, and return both stores to approximately 500 lines or less before adding UI behavior. The asset helper belongs to the domain layer so the global store does not depend on the Space presentation subtree. - complete 2026-07-11
2. Split list, filters, basic type-aware previews, quota/template sections, and detail UI into domain-aligned local components while keeping `Space.vue` as the page-level coordinator. Wire real asset filtering/pagination, template/quota reads, detail selection, asset project navigation, and the already-guarded template-use navigation. Keep destructive asset/template actions out of this slice so Unit 4 can add explicit confirmation and refresh semantics with the media-failure pass. - complete 2026-07-11

Success criteria:

- `Space.vue` is at most 500 lines;
- the asset and template stores remain within the project's approximate 500-line maintainability boundary without changing their public contracts;
- assets/templates/quota are backed by real APIs;
- type filtering, pagination, detail, project navigation, loading, empty, error, and boundary states work coherently.

### Unit 4 - Accessibility and failure semantics - complete 2026-07-11

Complete real prompt/image/video URL rendering and load fallbacks, deletion confirmation and hidden/deleted refresh behavior, plus the remaining responsive failure edges.

Implement as one bounded, independently verified slice:

1. Accept only absolute HTTPS media URLs with no URL userinfo whose backend source is `generation`. Treat user-supplied upload URLs, missing, malformed, URL-userinfo-bearing, unsupported-scheme, and relative `/uploads/...` values as unavailable without guessing an API origin or automatically requesting owner-supplied arbitrary URLs. Keep image referrers suppressed, preserve provider media that is embeddable without an ACAO contract, and reset load-error state whenever the asset identity or URL changes.
2. Keep compact cards free of nested interactive controls; render image/video media as non-interactive previews there, and expose video controls only in the detail drawer. Preserve differentiated prompt content and stable labelled fallbacks for every media failure state.
3. Expose asset soft-delete and template hard-delete only from detail context, behind explicit focus-managed confirmation. Keep mutation failures owned by the exact asset/template, close detail only after confirmed success, correct an asset page that becomes out of range, and force-refresh templates after hard delete without reclassifying a successful delete as failed when refresh alone fails.
4. Verify URL policy/load fallback, confirmation keyboard behavior, failure ownership, deletion refresh/boundary semantics, TypeScript, production build, and responsive browser rendering before committing the unit.

Success criteria:

- prompt/image/video each have an accessible differentiated preview;
- broken or unavailable media has a stable fallback;
- mutation and refresh behavior matches the backend contract.

### Unit 5 - Real-data and browser acceptance closure - complete 2026-07-11

Run focused regression, a production build, authorized local real API/MySQL comparisons, and browser QA at 1440x900, 920px, and 375px. Perform a fresh diff review, write REPORT only after all non-deferred acceptance criteria pass, and reconcile Task/ROADMAP/CURRENT.

Success criteria:

- asset/template rows, filters, and totals agree across UI, API, and parameterized MySQL evidence;
- detail and deletion/hidden behavior survive refresh as specified by the API;
- production build passes;
- browser evidence covers all required widths and relevant keyboard/console/network checks;
- REPORT, Task, ROADMAP, PROGRESS, CURRENT, code, and tests agree.

Closure evidence: real FastAPI/local MySQL/API/UI comparisons passed before and after asset/template mutations; real HTTPS image/video plus Prompt/fallback behavior passed; 1440x900, 920x900, and 375x900 Chromium geometry and screenshots passed with zero unexpected console errors/warnings; focused backend tests passed 22/22; production build transformed 4,693 modules; `Space.vue` is 497 lines; and the Deep fresh review returned CLEAN.

## Acceptance Matrix

| Requirement | Planned evidence |
|---|---|
| Real asset/template/quota data | authenticated API response plus parameterized local MySQL comparison where applicable |
| Type filter and pagination | focused deterministic checks plus browser boundary exercise |
| Detail and project navigation | router contract check plus browser navigation/back behavior |
| Delete/hidden semantics | backend contract trace, focused test, and real refresh behavior |
| Prompt/image/video previews | component checks plus browser keyboard and fallback exercise |
| Loading/empty/error states | deterministic state coverage plus browser or controlled outage evidence |
| Responsive layout | Chromium screenshots and interaction checks at 1440x900, 920px, and 375px |
| Maintainability | line count, component boundaries, fresh diff review |
| Build regression | `npm run build` |
| Secret and scope safety | exact staged-path review, redacted credential-pattern scan, and `git diff --cached --check` |

## Risks And Mitigations

- Existing Space behavior may be prototype-only or backed by incompatible payloads: trace source-to-route contracts before choosing component APIs.
- Templates may lack a dedicated frontend module or may expose pagination differently from assets: keep adapters domain-local and do not invent backend behavior.
- Media URLs may be missing, expired, or unsupported by the browser: model unavailable and load-error states separately.
- Deletion may be hard delete, soft delete, or visibility filtering: derive UI refresh behavior from implemented route/model semantics.
- Uploaded relative media URLs are not currently served by the backend: treat them as unavailable media and keep a stable fallback instead of constructing or guessing a URL.
- Asset project references are nullable and not protected by a database foreign key: navigation is available only for a non-empty reference, and missing project metadata must degrade neutrally.
- The existing global asset store feeds Home and Workspace: keep Space pagination state independent so filters and page changes cannot contaminate those consumers.
- The frontend has no unit-test framework: do not add a dependency for this Task. Use the production build, focused temporary-SQLite backend contracts, and mocked browser/runtime probes in proportion to each slice.
- Dirty-worktree overlap or concurrent automation drift: preserve the starting baseline and stop staging/commit on unexplained branch/HEAD/index changes.
- MySQL asset timestamps can tie within one second and the existing backend has no stable secondary ordering key. Real pagination fixtures must use distinct timestamps; a future backend Task should add a deterministic tie-breaker without reopening this frontend Task.

## Completion Rule

Satisfied 2026-07-11: every non-deferred acceptance criterion has fresh evidence, `Space.vue` is 497 lines, required real-data and browser acceptance passed, and `ai/reports/REPORT-T4-009.md` is complete.
