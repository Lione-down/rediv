# TASK-T5-053 - Selected edge semantic identity

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-052 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Make one selected Canvas connection immediately understandable in multi-node graphs without adding permanent labels or visual noise to every edge.

## Scope

- Show a contextual semantic edge label only for the selected connection.
- Identify its data role, exact source title, direction, and exact target title.
- Combine the existing midpoint insertion affordance with the selected-edge identity surface.
- Keep incompatible and readonly selected edges informative without exposing mutation.
- Preserve reroute handles, insertion, keyboard edge selection, graph history, and provenance styling.

## Non-goals

- Permanent labels on every edge, upstream content previews, editing edge metadata, new connection types, engine replacement, or changing graph persistence.

## Acceptance criteria

- Selecting an ordinary edge shows one visible identity surface with an exact accessible label.
- Prompt, media, and result edges expose distinct semantic data roles.
- Long localized source and target titles remain bounded and inspectable at 1440px and 920px.
- An insertable selected edge exposes its insertion action inside the same surface and preserves the existing atomic command.
- An incompatible selected edge shows identity but no insertion action.
- Keyboard edge selection exposes the same surface; Escape or selecting elsewhere removes it.
- 375px readonly may expose passive identity but no insertion or reroute mutation.
- Dense graphs retain no labels for unselected edges and no document mutation from identity inspection.

## Visual direction

- Visual thesis: graphite relationship chrome that appears only when one edge earns focus.
- Content plan: compact role chip, source title, directional arrow, target title, optional insertion action.
- Interaction thesis: brief opacity and scale entrance, press-scale action, immediate quiet dismissal.
