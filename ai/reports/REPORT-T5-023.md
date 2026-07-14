# REPORT-T5-023 - Result Lineage And Sibling Variant Inspection

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `ac69f70382dcf40f6bd08f8e3054bbe4f493cb53`
- Scope: typed result ancestry, sibling variants, and stable media state

## Delivered outcome

Selecting a canonical image or video result now reconstructs one trustworthy lineage from persisted graph facts. The Canvas marks the origin generation with G, reuses its ordered T/R input provenance, labels every active typed sibling result V1 through Vn, and emphasizes the selected result branch. Sibling order follows persisted connection order rather than layout position.

The result detail panel reports the same origin title and variant position plus the result's own persisted source task and model when available. The resolver returns no lineage for compatibility nodes, missing or inactive edges, multiple valid parents, invalid ports, or conflicting task identity.

Media state identity now follows kind plus URL. Selecting another node no longer resets already decoded images/videos or broken media to a loading state that cached resources cannot resolve again. Native video remains user-controlled and unavailable media remains an honest placeholder.

## Verification evidence

- Pure lineage plus focused context/provenance browser coverage: PASS, 10/10.
- Related media, generation, multi-scenario, LibTV visual, reroute, and insertion regression: PASS, 48/48.
- Full current-source Chromium: PASS, 186/186.
- Frontend build: PASS, 4,794 modules transformed.
- Media evidence: decoded 320x180 image, playable 16:9 video with finite duration, explicit unavailable placeholder, persistent broken-media alert.
- Visual evidence: `output/playwright/t5-023-result-lineage/image-lineage-1440x900.png` and `result-lineage-readonly-375x812.png`, manually reviewed.
- Hygiene: strict UTF-8 PASS, changed implementation files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Visual assessment

G/T/R/V markers make one source, its inputs, and six output variants readable without adding a permanent history surface. The selected variant uses the established violet intent color; siblings and their branch edges stay quieter. The result panel remains a compact factual inspector rather than becoming a modal gallery.

## Safety and contract notes

- No graph mutation, provider request, backend, database, migration, quota, secret, paid API, autoplay, or destructive operation changed.
- Automatic ranking, pixel diff, batch result actions, recursive historical task reconstruction, and Canvas engine changes remain explicit non-goals.
- The user-owned retired-Hermes plan and local QA/reference output remain unstaged.
