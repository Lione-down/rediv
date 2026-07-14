# REPORT-T5-017 - Connected Generation Context

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `674cec4fdd7d918eb35df327addcf5f44a3a1277`
- Scope: connected Canvas inputs become real image/video generation context

## Delivered outcome

Revid's converging graph is now functional rather than decorative. Active typed connections into a generation node are resolved in graph order. The generation node's local prompt remains first, connected scripts are appended with visible source titles, the final prompt is clipped deterministically at 4,000 characters, and connected image assets/results contribute deduplicated owned asset IDs up to the backend limit of eight.

The inspector shows exactly which scripts and images will be used, which references are empty, unsupported, duplicated, missing, or over limit, and the final prompt length. It never exposes raw media URLs. Disconnecting a source updates the inspector and the next request without reload.

Image generation forwards every validated reference URL through the existing image-to-image path. Video generation now accepts the same strictly scoped image IDs: one validated image maps to `img2vid`; multiple ordered images map to `keyframes`. Requests without references retain the original provider call shape. No provider call was made during verification.

## Verification evidence

- Pure resolver and multi-scenario browser: PASS, 8/8; final screenshot rerun PASS, 5/5.
- Focused generation/resource Chromium: PASS, 24/24.
- Full Chromium: PASS, 155/155 across 31 files.
- Guarded MySQL generation/security suites: PASS, 21/21 plus video API 8/8.
- Frontend build: PASS, 4,779 modules transformed.
- Screenshots: `output/playwright/t5-017-connected-context/`, including `connected-generation-context-1440x900.png` and 920x900 detail evidence.
- Hygiene: strict UTF-8 PASS, changed source files <=500 lines PASS, `git diff --check` PASS, no sensitive path in the delivery diff.

## Full-backend verifier note

Repository-wide backend discovery was attempted twice. Existing upload process tests fail before validation logic when AnyIO initializes a Windows Python 3.13 process worker: `ImportError: attempted relative import with no known parent package`, surfaced as `BrokenWorkerProcess`. The same error reproduces in one package-qualified upload-only test and is outside the T5-017 diff. The release condition for that independent verifier is repairing the upload process-worker import/runtime harness and rerunning full backend. All generation code changed by T5-017 has direct guarded MySQL regression evidence.

## Design assessment

The aesthetic direction remains a media-first graphite workbench. Connected context is a compact provenance layer inside the existing inspector, not a new modal or card field on every node. Purple is reserved for typed reference icons and the primary action; quiet stepped surfaces preserve the graph and media as the dominant visual anchor.

Placeholder SVGs and the local video remain test-only evidence. Real project content replaces them naturally through existing asset insertion; no UI copy, URL, or test asset is embedded into production generation context.

## Safety and contract notes

- Foreign-project, missing, non-image, duplicate, inactive, wrong-port, and more-than-eight references cannot enter provider input silently.
- Existing quota reservation, no-charge-on-failure, task lifecycle, result reconciliation, autosave, and mobile review-only contracts remain intact.
- No paid call, secret access, migration, destructive data operation, external asset copy, or Canvas engine change occurred.
- The user-owned retired-Hermes plan and ignored QA output remain unstaged.
