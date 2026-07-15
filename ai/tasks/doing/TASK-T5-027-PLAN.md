# TASK-T5-027 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: a compact film log inside the graphite-black inspector, with status dots and run numbers rather than stacked decorative cards.
- Content hierarchy: current status, total history count, then newest runs with identity, timing, and bounded failure detail.
- Interaction thesis: native in-place disclosure with no mutation, polling change, animation, or focus trap.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- Runway keeps prior generations close to the working intent.
- ComfyUI separates queue/history state without implying every run produced output.
- Linear activity logs prioritize chronology and compact status identity.
- Revid filters durable project tasks by generation node and keeps the current status surface primary.

## Units

1. Add a pure deterministic generation-run resolver.
2. Add the compact history disclosure to the existing context panel.
3. Verify all statuses, repeated runs, stable order, cap/total, filtering, long errors, empty state, compact, readonly, and no-mutation behavior.
4. Run build, focused/related/full Chromium, visual review, diff, and hygiene gates.
5. Synchronize durable state, write REPORT, commit, and push.

## Risks

- Project tasks span Canvases and nodes, so filtering must use durable node identity rather than recency alone.
- Equal timestamps require stable tie behavior.
- Failure messages and provider IDs can be unbounded visual content.
- History must not be mistaken for a retry or cancellation control surface.
