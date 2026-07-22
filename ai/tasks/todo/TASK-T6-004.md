# TASK-T6-004 - Node workflow productionization

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6`
- Objective: productionize direct text replacement, script-created asset groups, image batch generation, structured video reference roles, partial retry, and the accepted floating connection behavior as one coherent Revid Canvas workflow.
- Dependency: `T6-003 - DONE / PASS` at activation baseline `HEAD == origin/main == 4b5c028ef5ae93052c5de09f116db9ed9a2dd1a5`.
- Plan: [TASK-T6-004-PLAN](../doing/TASK-T6-004-PLAN.md).
- Progress: [TASK-T6-004-PROGRESS](../doing/TASK-T6-004-PROGRESS.md).
- Planning source: preserved user-owned `.hermes/plans/2026-07-22_180324-t6-004-node-workflow-productionization.md` with SHA-256 `9833CAF0849C56763784068F68F9C06685B8789278205ACBE6D083369CD8338D`; it remains untracked and excluded from delivery.

## Approved product rules

1. Image batch slot 1 materializes on the initiating image card; slots 2 through N create sibling image cards.
2. AI draft/refine output directly replaces the current text card through the normal atomic Canvas command. No sibling script node, AI version list, or AI-result history UI is added; standard Canvas undo/autosave/recovery remains authoritative.
3. Script-to-shot execution creates a visible asset group whose children are canonical image-generation cards. Each child can generate independently and the group exposes one generate-all action.
4. Generated assets remain project resources. The asset group is an existing storyboard/group projection, and standard ungroup preserves independently usable child cards.
5. Video reference bindings share one hard nine-entry budget across first-frame, last-frame, and ordinary-reference roles. The same image may occupy different roles.
6. The T6-003 floating output control remains transient feedback: it follows pointer X/Y only inside its existing acquisition range and radial clamp, while logical ports, drag origins, and persisted edge endpoints stay fixed.
7. Batch and group runs preserve every successful result. Failed cards remain individually retryable without regenerating successful siblings.
8. Frontend and backend contracts move together. Automated verification uses mock provider routes and makes no real or paid provider call.

## Scope

- Capability contract v6 for capability-driven image output counts and structured video reference roles.
- Optional immutable image batch snapshots with `batch_id`, `slot_index`, and `slot_count` on existing single-result generation tasks.
- Ordered video bindings with source node, asset, role, and stable order; legacy persisted references remain readable.
- Direct script overwrite with stale-context protection.
- Script-created asset-group presentation, per-card generation, bounded generate-all, partial failure, individual retry, project-resource reconciliation, and standard ungroup.
- Image batch slot creation, deterministic placement, independent idempotency, lifecycle projection, reload reconciliation, and card-local retry.
- Functional, visual, interaction, persistence, accessibility, backend-contract, build, performance, security, and Human acceptance gates.

## Locked boundaries and non-goals

- Preserve Vue 3, TypeScript, Leafer UI, Pinia, FastAPI, Pydantic, SQLAlchemy, MySQL-only runtime, and the existing graph, command, history, autosave, recovery, generation-task, project-resource, quota, admission, provider/model, and billing authorities.
- Do not add a second Canvas renderer, workflow store, asset database, generation-task table, batch-result table, or AI version-history system.
- Do not redesign T6-003 card geometry, semantic colors, toolbar, composer, logical ports, hit targets, or persisted edge routing.
- Do not remove Canvas undo/history, Graph Access, review-only behavior, accessibility, Storyboard, cinematic Skills, or other Revid-only capabilities.
- Do not introduce a real/paid provider call, secret access, user/runtime migration, destructive operation, external-account change, or incompatible provider contract without explicit Human authorization.

## Acceptance criteria

### Functional

1. Direct draft/refine replaces the selected text card, creates no sibling/version UI, and refuses to overwrite newer user text after context drift.
2. Capability-approved image counts initially support `1, 2, 3, 4`, default `1`; slot 1 stays on the original card and later slots become deterministic siblings.
3. Every batch slot owns one secure client request ID, one existing generation task, and at most one asset. Mixed outcomes preserve successes, and retry affects only the failed card.
4. Script-to-shot creates a visible ordered asset group of canonical image-generation cards; individual generation, bounded generate-all, failure continuation, and standard ungroup preserve identity and actions.
5. Video bindings preserve roles and order, accept exactly nine total entries, reject a tenth, enforce at most one first-frame and last-frame, reject same-role duplicates, and retain valid cross-role reuse of one asset.

### Backend contract

6. Strict capability v6, batch snapshot, and video binding schemas forbid unknown fields, include immutable request fingerprints/snapshots, preserve existing single-result responses, and keep legacy references readable.
7. Asset authorization may deduplicate database reads, but provider URL reconstruction preserves binding order and valid cross-role duplicate assets.
8. Existing idempotency, quota, admission, lifecycle, completion, and project-resource ownership remain authoritative per slot.

### Visual and interaction

9. New controls fit the existing T6-003 attached-card and group surfaces without displacing Revid semantic colors, toolbar/composer geometry, materialized-card projection, or typed graph behavior.
10. The floating output control retains its accepted approximately `80 CSS px` acquisition surface, approximately `30 CSS px` radial X/Y follow clamp, centered glyph, deterministic reset, and fixed logical path/drag anchors.
11. Generate-all, count selection, role assignment, retry, and ungroup provide deterministic pointer and keyboard interaction, focus restoration, honest progress/error states, and no hidden mutation from disclosure-only actions.

### Persistence and accessibility

12. Save/reload preserves output count, role bindings, group order, batch slots, results, project asset identity, and retry scope without eager whole-document rewrites.
13. Keyboard, focus, ARIA status/labels, reduced motion, desktop/compact overflow, readonly, and 375x812 review-only behavior pass with no mutation path in review-only mode.

### Verification and Human gate

14. Focused backend/frontend suites pass before broader regression; production build, locked full backend, full unexcluded Chromium, unchanged headed performance, audit, state, diff, UTF-8, sensitive-path, and secret-signature gates pass without weakening thresholds.
15. Human side-by-side visual and interaction acceptance is recorded before `DONE / PASS`, REPORT creation, staging, commit, or push.
