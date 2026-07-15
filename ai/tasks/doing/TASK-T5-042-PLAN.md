# TASK-T5-042 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Generation inspector displays authoritative text/media sources, and result inspector displays the canonical origin generation, but all source identities are static text.
- Stage already exposes panel-safe `revealNode`, and Workspace already owns post-drawer-leave action handoffs.
- Compact selection normally opens context automatically; a locate action needs a one-shot suppression owned beside that watcher, not a timing race in Workspace.

## Direction

- Interaction thesis: source identity is a quiet text-row action, not another prominent button family.
- Desktop: select, reveal minimally, and let the inspector naturally synchronize.
- Compact/readonly: close the modal context first, select without reopening it once, then reveal the exact node.
- Styling: reuse V2 surfaces and focus-visible behavior; keep reorder actions independent and available only when editable.

## Units

1. Add inspector emits and accessible source-row/origin controls.
2. Add a one-shot compact context suppression path beside the existing selection watcher.
3. Wire desktop direct locate and compact post-leave locate/reveal.
4. Add browser coverage for T/R/G, excluded input, keyboard, readonly, ordinary selection, viewport, and mutation boundaries.
5. Build, inspect evidence, synchronize state/report, review hygiene, commit, and push.

## Risks

- Selecting before the drawer leaves can move a hidden Canvas and immediately reopen the modal.
- Reusing ordinary close clears selection and destroys the target handoff.
- Wrapping reorder buttons inside a source button would create invalid nested interactive content.
- Missing or stale node IDs must fail safely without changing selection.
