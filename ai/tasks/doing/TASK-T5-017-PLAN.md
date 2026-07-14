# T5-017 Connected Generation Context Plan

- State: `DONE - PASS`
- Updated: 2026-07-15
- Visual thesis: graph-first creative context where every visible upstream connection has an inspectable generation effect.
- CSS strategy: existing Vue SFC, Leafer UI, Naive UI drawers, and shared SCSS tokens only.

## Unit 0: context resolver contract - complete

Add a pure graph resolver that orders active incoming connections, composes local and connected text under 4,000 characters, deduplicates up to eight image asset IDs, and records unusable media sources for UI feedback.

## Unit 1: inspector and frontend request - complete

Expose the resolved context in the selected generation inspector. Make generation eligibility and request payload use the resolved prompt and image IDs while preserving local prompt editing and existing lifecycle behavior.

## Unit 2: backend video reference support - complete

Extend the strict video request schema with bounded image IDs. Reuse the existing ownership/scope validation, then map one validated URL to `img2vid` and multiple URLs to ordered keyframes. Keep provider calls mocked in tests.

## Unit 3: browser and integration evidence - complete

Prove two scripts plus two images alter the exact outgoing request; prove disconnect updates it; verify inspector hierarchy at 1440x900 and 920x900; run focused backend/frontend regression.

## Unit 4: closure - complete

Run full Chromium, relevant backend regression, build, diff, UTF-8, file-size, and sensitive-path audits. Synchronize REPORT, CURRENT, ROADMAP, and Task state only after every acceptance criterion has evidence.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Graph looks connected but a source is unusable | Silent false context | Surface unusable references and exclude them from payload |
| Prompt composition exceeds provider/UI bounds | Request rejection | Deterministic 4,000-character composition with local prompt priority |
| Foreign asset IDs cross project scope | Security defect | Reuse transactional ownership checks before provider invocation |
| Video reference semantics are ambiguous | Wrong provider mode | One image means img2vid; multiple ordered images mean keyframes |
| Context UI becomes panel-heavy | Visual regression | Compact provenance rows, no raw URL, no new modal |
