# TASK-T5-024 - In-canvas sibling result comparison tray

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 maintenance
- Dependency: T5-023 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Let users compare sibling image, video, unavailable, and broken results from one generation directly over the Canvas without entering multi-select or leaving the graph context.

## Scope

- Offer comparison only when selected result lineage contains at least two canonical variants.
- Present variants in persisted V1..Vn order in a horizontally scrollable Canvas-local tray.
- Reuse canonical node media presentation for decoded images, user-controlled video, placeholders, and errors.
- Keep the selected variant visually distinct and allow choosing another variant from the tray.
- Avoid desktop side panels and support the 375px readonly review boundary.
- Close deterministically on Escape, explicit close, Canvas change, or variant choice.

## Non-goals

- Pixel diff, automatic ranking, mutation, deletion, generation calls, autoplay, recursive history, backend schema changes, or Canvas engine replacement.

## Acceptance criteria

- Result detail exposes an accessible compare action only for two or more sibling variants.
- The tray shows all active typed variants in stable order with V marker, title, state, and canonical media.
- Choosing a variant updates selection without PATCH/autosave or provider traffic.
- Desktop geometry avoids open resource and context panels; compact/mobile opening dismisses only the context drawer and preserves selection.
- Readonly image, video, unavailable, broken, Escape, responsive, build, focused/relevant/full Chromium, UTF-8, file-size, diff, and sensitive-path gates pass.
