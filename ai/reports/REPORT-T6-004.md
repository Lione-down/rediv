# REPORT-T6-004 - Node workflow productionization

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-22`
- Activation baseline: `4b5c028ef5ae93052c5de09f116db9ed9a2dd1a5`
- Human decision: visual and interaction evidence explicitly accepted for T6-004 closure

## Delivered

- Added backend-owned capability contract v6 with image output counts `1, 2, 3, 4`, strict immutable image-batch snapshots, ordered structured video-reference roles, one universal nine-entry budget, legacy reference normalization, and duplicate-preserving provider URL reconstruction.
- Kept every image batch slot on the existing single-result generation authority: slot 1 remains on the initiating card, later slots are deterministic siblings, each slot owns independent idempotency/task/asset lifecycle, mixed successes survive, and retry is card-local.
- Changed AI script draft/refine to stale-safe direct replacement through normal Canvas history. No sibling script, version list, or parallel AI history authority was introduced.
- Added script-created `分镜资产组` projection through existing storyboard/group semantics with canonical child generation cards, bounded sequential generate-all, honest completed/failed/skipped status, failure continuation, local retry, project-resource ownership, and identity-preserving standard ungroup.
- Added ordered `first-frame`, `last-frame`, and `reference` bindings with cross-role source reuse, accessible reorder controls, exact request serialization, reload persistence, and readonly review presentation.
- Preserved T6-003 card, toolbar, composer, materialized-card, typed-port, path, hit-target, and floating-output behavior. One invalid direct-button `list` role found by Axe was corrected to `group` without visual or geometry changes.

## Verification

- Focused backend capability, schema, transaction, idempotency, admission, and provider-order proof passed `32/32`; adjacent image/video API and cinematic handoff regression passed `31/31`.
- Focused frontend direct-script, generation-parameter v6, image-batch, asset-group, video-role, service, persistence, readonly, and compatibility proof passed; the final post-split owner suite passed `27/27` in `36s`.
- Locked full backend through `backend/.venv-ci-check/Scripts/python.exe scripts/run-backend-tests.py` passed `583/583` in `478.553s`.
- Exact-current-source full unexcluded Chromium through `npm run test:e2e:ci` passed `610/610` in `671.6s`, exit `0`.
- Production build passed with `4,976` modules transformed. Unchanged headed 200-node/300-connection performance passed `2/2`; dependency audit reported zero vulnerabilities.
- Geometry, materialized-card, fixed logical anchors, floating X/Y clamp/reset, accessibility, reduced motion, desktop/compact, 375x812 readonly, persistence, and no-hidden-mutation coverage passed without weakening thresholds.
- Human-accepted visual evidence remains under ignored `output/playwright/t6-004/`: image batch SHA-256 `741D93DE7E5C217054ECC3102D9ACBC994662B9C15DC55EE9A570A8122901C21`, mixed asset group `E84E4C0FC656BE1390ED8FD91F1FC1C3087E4F16A8AF81A3AA4F6F9E9F6689B4`, desktop video roles `EC4F7639FCB54B3D8E2717200DF5AB84C3123C301E7DBA799B89D5703566E825`, and readonly video roles `50F42B894525E2BEABBF9889C6DD764DAACA6EE2D2E0E00675F2A6A64ED0B2E4`.
- Project-state, diff, UTF-8/BOM, sensitive-path, secret-signature, database-artifact, conflict-marker, current-state budget, owned-path, staged-path, and scoped-file checks pass.

## Boundaries

- No real or paid provider request, real secret, `.env` content, user/runtime database mutation, migration, destructive action, external account, new task/asset/batch table, second renderer/store, or incompatible public contract was used or added.
- Existing Vue 3, TypeScript, Pinia, Leafer UI, FastAPI, Pydantic, SQLAlchemy, MySQL-only runtime, graph/history/autosave/recovery, provider/model, quota, admission, billing, accessibility, Storyboard, and review-only authorities remain intact.
- User-owned untracked `.codex/`, `.hermes/plans/`, `output/`, and `storage/` paths remain excluded from delivery.

## Delivery

- Task, PLAN, PROGRESS, evidence, implementation, tests, REPORT, CURRENT, and ROADMAP agree on `DONE / PASS`.
- T6-004 is complete and no later implementation Task is activated.
