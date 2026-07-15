# TASK-T5-025 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Direction

- Visual thesis: a compact request ledger inside the graphite-black inspector, with accent reserved for actual T/R request order.
- Content hierarchy: usage summary, exact final prompt, ordered media request, then excluded-input reasons.
- Interaction thesis: native in-place disclosure with no modal, motion, autoplay, mutation, or focus trap.
- CSS strategy: existing Vue scoped SCSS and Revid tokens only.

## Reference assessment

- ComfyUI keeps prompt and graph inputs inspectable before execution.
- Runway reviews media inputs near the generation action.
- Lightroom contact sheets make input order legible without ranking outcomes.
- Revid uses its authoritative `ResolvedGenerationContext` as one request ledger rather than creating a second composition model.

## Units

1. Derive human-readable request roles from media type and included image count.
2. Add exact prompt, ordered media, and excluded input disclosure to the existing context panel.
3. Verify image, one-image video, multi-image video, exclusions, long bilingual prompt, readonly, compact, and no-mutation behavior.
4. Run build, focused/related/full Chromium, visual review, diff, and hygiene gates.
5. Synchronize durable state, write REPORT, commit, and push.

## Risks

- A second prompt composition path could drift from the provider payload, so rendering must consume the resolver output directly.
- Excluded inputs must not accidentally receive R order or imply provider inclusion.
- Long bilingual prompt content can over-expand the inspector or overflow compact viewports.
