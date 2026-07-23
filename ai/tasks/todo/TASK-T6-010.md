# TASK-T6-010 - Establish one canonical card view model, geometry authority, and rename command

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 contract-first reset`
- Objective: establish one presentation-ready card model, one visible-card geometry authority, and one undoable/autosaved rename command without changing stable Canvas identities.
- Dependency: `T6-009 - DONE / PASS` at activation baseline `HEAD == origin/main == dc9696fa7a568a38f0ab8980f3b20ea78c72800a`.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-010-PLAN](../doing/TASK-T6-010-PLAN.md).
- Progress: [TASK-T6-010-PROGRESS](../doing/TASK-T6-010-PROGRESS.md).
- Report: [REPORT-T6-010](../../reports/REPORT-T6-010.md).

## Scope

- Add one canonical frontend card view model for title, body, lifecycle, media, ports, work surface, and result compatibility state.
- Add one geometry authority that resolves the visible card rectangle and derives renderer visuals, DOM surfaces, ports, edges, hit targets, title placement, and attached work surfaces from it.
- Add `rename-node` through the typed Canvas command boundary with undo/redo, autosave, reload, duplication, Canvas-switch, and stable-binding behavior.
- Add an external upper-left title editor that does not initiate drag, selection theft, or another editing gesture.
- Clamp attached work surfaces to the actual stage rectangle and insets rather than the browser window.
- Preserve legacy generation/result projection as a compatibility boundary while eliminating duplicate presentation/geometry derivation.

## Non-goals and locked boundaries

- No T6-011 text workflow, T6-012/T6-013 director/script workflow, T6-014 image lifecycle, T6-015 semantic video, or T6-016 compatibility removal.
- Do not implement new same-card generation result application or remove persisted legacy result nodes.
- No backend API, schema, provider, or migration change unless a frozen T6-010 frontend contract proves an unavoidable defect and scope is first reconciled in PLAN/PROGRESS.
- No visual redesign beyond the external title/editor and geometry convergence required by this Task.
- No real or paid provider call, secret access, user/runtime-data migration, destructive operation, or external-account change.
- Do not mutate user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, or `test-results/`.

## Acceptance criteria

1. All supported visible card families resolve through one typed card view model without changing stable node IDs or graph bindings.
2. `rename-node` is the only title mutation path and survives undo, redo, autosave, reload, duplication, and Canvas switching.
3. Duplicate display titles remain legal; bindings continue to use stable IDs and duplicate-title UI is deterministically disambiguated where referenced.
4. Title editing works for text, script, image, video, asset, legacy result-compatibility, and group presentations without starting drag or stealing another interaction.
5. Leafer visuals, DOM surfaces, ports, edge endpoints, hit targets, title placement, and attached work surfaces derive from one visible rectangle.
6. Attached work surfaces clamp against the stage rectangle/insets and remain aligned across supported zooms, panel layouts, and delayed media-aspect changes.
7. Legacy generation/result documents remain readable through an explicit compatibility projector; no T6-014/T6-016 behavior is implemented.
8. Focused TDD evidence passes before related and broad frontend regression; frontend is rebuilt before preview/browser proof.
9. Automated visual/interaction evidence is reported separately from Human visual/interaction acceptance and never substitutes for it.
10. Project-state, diff, UTF-8, protected-path, sensitive-path, exact-staging, commit, and push checks pass.
