# TASK-T6-011 - Rebuild the text card workflow with explicit model selection

- State: `DONE`
- Verification outcome: `PASS`
- Phase: `Product V3 / Phase 6 contract-first reset`
- Objective: deliver LibTV-style text empty states, direct card editing, attached model composition, explicit allowed-model selection, and safe same-card text application.
- Dependency: `T6-010 - DONE / PASS` at activation baseline `HEAD == origin/main == 11cdaaac7be485e219830ebf9a6c589996830a47`.
- Architecture: [REVID-T6-006-FULL-STACK-MODULAR-REFACTOR](../../architecture/REVID-T6-006-FULL-STACK-MODULAR-REFACTOR.md).
- Plan: [TASK-T6-011-PLAN](../doing/TASK-T6-011-PLAN.md).
- Progress: [TASK-T6-011-PROGRESS](../doing/TASK-T6-011-PROGRESS.md).

## Scope

- Provide truthful text-card empty modes for direct writing, text-to-video prompt composition, reverse prompt from image, and text-to-music only when the selected allowed model advertises that capability.
- Keep direct writing and accepted content editing inside the text card.
- Provide a selected-card attached text work surface only while composing or optimizing with a model.
- Return and render an explicit backend-authoritative allowed text-model list; require the user-selected allowed model ID and never silently reroute.
- Submit text work through the durable compact v2 job contract and resume it through the existing current-Canvas synchronization boundary.
- Apply a successful text result to the original unchanged text card through the typed Canvas command/history/autosave boundary.
- Fail stale-revision application closed without overwriting user edits, while keeping the generated result recoverable.
- Serialize canonical text result content once and preserve all legacy compatibility paths not owned by this Task.

## Non-goals and locked boundaries

- No T6-012 built-in director Skill or story-production schema.
- No T6-013 script asset/shot workflow, T6-014 image lifecycle, T6-015 semantic video, or T6-016 compatibility removal.
- Do not expose a Skill selector or silently choose another text model.
- Do not remove legacy generation/result projection, project history/admin compatibility, or unbound legacy fallback.
- No real or paid provider call, secret access, user/runtime-data migration, destructive operation, external-account change, or irreversible schema operation.
- Do not mutate user-owned `.codex/`, `.hermes/plans/`, `output/`, `storage/`, or `test-results/`.

## Acceptance criteria

1. Empty text cards expose only truthful direct and capability-gated assisted modes, with keyboard-accessible selection and no graph/history mutation from mode browsing.
2. Direct writing edits the canonical current card body and remains editable through undo, redo, autosave, reload, and Canvas switching.
3. Assisted composition uses an attached stage/inset-bounded work surface only while selected/configuring; accepted content returns to the current text card and the surface is not permanent.
4. The capability contract returns an explicit allowed text-model list with stable model IDs and per-mode support; frontend submission requires one user-selected allowed model.
5. Unknown, unavailable, incompatible, or omitted model IDs fail before job, quota, provider, Canvas, history, or autosave mutation; no silent routing occurs.
6. Compact text submit/status/result contracts remain bounded, and canonical result content is serialized exactly once.
7. Refresh and Canvas switching resume the same durable text job without cancelling it or creating another visible card.
8. Same-card result application verifies stable project/Canvas/node/job identity and the submitted content revision before one typed undoable/autosaved mutation.
9. A stale revision never overwrites newer user text; the generated result remains explicitly recoverable without fabricating a successful application.
10. Legacy text/script and result documents remain readable; no T6-012 through T6-016 behavior is implemented.
11. Focused RED/GREEN evidence passes before related and broad regression; frontend is rebuilt before preview/browser proof.
12. Automated visual/functional/interaction evidence is reported separately from Human visual/interaction acceptance.
13. Project-state, diff, UTF-8, protected-path, sensitive-path, exact-staging, commit, and push checks pass.
