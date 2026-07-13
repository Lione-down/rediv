# TASK-T5-004 Plan

- State: `DOING`
- Completed unit: Unit A - single-source V2 Canvas token foundation (`COMPLETE - PASS`)
- Next unit: Unit B - Canvas metadata client/store and canonical route resolution
- Updated: 2026-07-13

## Objective

Deliver the explicit multi-canvas frontend in independently mergeable units while keeping every non-Canvas page on its current Phase 4 visual contract until the Canvas milestone is accepted.

## Direction Lock

- Visual thesis: dense premium graphite-black creative workspace with quiet violet interaction accents and depth expressed through surface lightness, not glass or decorative gradients.
- Content plan: orient with project and Canvas identity, expose Canvas navigation and save state, then leave the graph/media workflow as the dominant surface.
- Interaction thesis: 100-180 ms transform/opacity transitions, interruptible 0.96 press scale, contextual surfaces translated by at most 8 px, and reduced-motion parity.
- CSS strategy: existing global/scoped SCSS only; Naive UI consumes the same Canvas CSS variables through a route-local theme bridge.
- Benchmarks already approved by the V2 source documents: Figma for contextual creative-tool chrome, Miro for spatial navigation and viewport continuity, and Linear for compact state feedback and keyboard legibility.

## Unit A - Single-source V2 Canvas tokens

### Scope

1. Add one SCSS source for all approved V2 Canvas semantic values: surfaces, text, accent/status, borders, spacing, radii, typography, elevation, motion, grid, focus, and responsive thresholds.
2. Expose the variables only through a Canvas theme scope so current Home, Space, auth, and Admin pages do not receive a premature V2 redesign.
3. Add a Canvas-local Naive UI override object whose values reference the scoped CSS variables rather than duplicating color or radius literals.
4. Keep the new bridge unused until the canonical shell lands in Unit C; Unit A must not alter rendered routes or application behavior.

### Non-goals

- router, API, store, component, or runtime theme-provider changes;
- Phase 4 token cleanup or global page redesign;
- Canvas navigation, viewport persistence, browser screenshot acceptance, or backend changes.

### Success criteria

- Every approved V2 Canvas value is declared once in the SCSS token source.
- The Naive bridge contains no duplicated color/radius value literals and TypeScript accepts it.
- Existing frontend build output remains successful and no rendered route is changed by this unit.
- Fresh diff review, `git diff --check`, exact staging, UTF-8, sensitive-path, secret-candidate, and tracked database-artifact gates pass.

## Later Units

- Unit B: Canvas metadata API/store, optimistic order revision, canonical route, and legacy first-active resolution.
- Unit C: route-local V2 provider, full-screen shell, identity/navigation chrome, responsive review boundary, and browser visual evidence.
- Unit D: explicit Canvas graph scope and normalized debounced viewport persistence.
- Unit E: focused and regression browser evidence, accessibility/reduced-motion checks, documentation, REPORT, and closure reconciliation.

## Unit A Outcome

- The scoped SCSS source defines 61 V2 Canvas tokens and reduced-motion substitutions under `.v2-canvas-theme`.
- The Canvas-local Naive UI bridge references 27 semantic variables with zero duplicated color literals and zero unresolved token names.
- Global SCSS compiles the dormant theme class, but no route, provider, component, or unrelated page applies it before Unit C.
- Frontend production build and focused static token/forbidden-pattern checks pass.

## Verification Order

1. Inspect the exact changed SCSS and TypeScript token contracts.
2. Run `npm run build` from `frontend`.
3. Run focused static scans for duplicated literals and forbidden V2 visual patterns in the new files.
4. Run fresh diff review and `git diff --check`.
5. Precisely stage owned paths, run staged UTF-8/sensitive-path/secret/database-artifact checks, commit, and push.
