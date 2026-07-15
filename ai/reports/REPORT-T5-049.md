# REPORT-T5-049 - Captured-frame provenance and repeat capture loop

## Result

`DONE - PASS`

Captured video frames now retain an honest, inspectable origin. The frame inspector names the exact source video and capture time, can navigate back through the established responsive locate path, and gives the source one restrained Canvas emphasis without inventing graph lineage.

The return-to-source loop is browser-proven with a seekable dynamic fixture: captures at 0.20s and 1.50s produced independent asset URLs, PNG byte payloads, Canvas nodes, and provenance. Both frames then remained ordered inputs for image and video composition.

## Verification

- Production build: PASS, 4,811 modules transformed.
- Focused Playwright: PASS, 6/6.
- Related provenance, lineage, selection composition, and frame-capture Playwright: PASS, 35/35.
- Fixture inspection: PASS, H.264, 2.000 seconds, 20 frames.
- Visual evidence: PASS at 1440x900, 920x760, and readonly 375x812, plus a two-frame repeat-capture view.
- Graph integrity: source navigation and derived emphasis create no persisted connection or history mutation.

## Retained evidence

- `output/playwright/t5-049-captured-frame-provenance/desktop-frame-source-1440x900.png`
- `output/playwright/t5-049-captured-frame-provenance/compact-source-located-920x760.png`
- `output/playwright/t5-049-captured-frame-provenance/readonly-source-located-375x812.png`
- `output/playwright/t5-049-captured-frame-provenance/repeat-capture-two-frames-1440x900.png`

## Deferred

Persistent frame strips, batch extraction, synthetic graph edges, backend frame processing, paid provider calls, and mobile editing remain outside T5-049.
