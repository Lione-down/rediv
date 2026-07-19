# REPORT-T5-095 - Canvas main composer attachment, Send, and Agnes capability recovery

- Status: `DONE - PASS`
- Baseline: T5-094 delivery `789397fe15b443ee66431955766070918ca1b637`
- Date: 2026-07-19
- Scope: user-acceptance repair for main-composer attachment, script Send, capability state/retry, bounded 503 recovery, and A10 interaction evidence.

## Delivered

- Split Project Resources into explicit `attach` and `insert` intent. Selecting an attachment now keeps the empty composer visible and changes no Canvas node or revision; selected images appear as accessible removable chips.
- Script-mode Send now persists one canonical script source and invokes the existing authenticated, quota-aware, idempotent script-authoring path. Success creates a separate editable lineage-bearing script result instead of leaving only an inert local node.
- Selected owned image IDs are retained on the source and submitted as structured references. Backend ownership/project/status/type checks run before provider/task/quota work and produce Agnes-supported `text` plus public `image_url` blocks. Local, private, foreign, stale, and unsupported references fail closed with actionable copy.
- Capability loading is race-safe and manually reloadable. Both composer and context show loading, actual `Agnes 2.0 Flash`, incompatible-runtime, or unavailable states without exposing internal `capability` jargon.
- A transient provider failure is never automatically replayed. The exact source brief remains selected and prefilled for one explicit manual retry, preventing duplicate requests while avoiding the former dead-end panel.
- Restarted the verified repository-owned uvicorn process on port 8000 so the current capability v5 contract replaced the stale pre-T5-094 runtime; health is 200 and auth remains enforced.
- Corrected ledger A10 and its manifest evidence: interaction semantics, attachment non-mutation, actual Send execution, lineage, recovery, and exact-input retention are now required.

## Verification

- Backend related matrix: `23/23` passed across `test_script_authoring_contract`, `test_generation_provider_validation`, and `test_text_generate`; the latter used disposable MySQL.
- Frontend related Chromium matrix: `26/26` passed across shell/composer, script authoring, Project Resources generation, and resource-race suites.
- Production build passed `vue-tsc -b` and Vite with `4937 modules transformed`.
- Composer-scoped axe check found zero serious or critical violations.
- Runtime `/health` returned 200 after the scoped backend restart; unauthenticated `/api/generation-capabilities` remained 401.
- Manifest JSON parsed with 28 scenarios, `R-095-COMPOSER` present, and one A10 scenario. `git diff --check` passed.

## Boundaries

- No `.env` value, secret, real/paid Agnes call, migration, destructive data operation, private LibTV access, copied asset, or performance-threshold change was used.
- Browser and provider fixtures prove Revid behavior, not current real Agnes capacity or output quality.
- Agnes documents image understanding through public `image_url` blocks. Revid therefore rejects non-public script image attachments before provider work instead of pretending they were consumed.
- HTTP 503 cannot be eliminated client-side. This delivery minimizes impact with input preservation, idempotency/admission reuse, typed transient errors, and bounded manual retry; automatic replay of an ambiguous creation request remains intentionally disabled.
