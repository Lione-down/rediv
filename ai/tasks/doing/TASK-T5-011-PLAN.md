# TASK-T5-011 Plan

- State: `DOING`
- Updated: 2026-07-14

## Unit A — full automated regression

- Run the full backend suite, frontend build, and full Chromium suite with the owned CI runner.

## Unit B — runtime, security, and hygiene audit

- Confirm retained T5-008 live MySQL evidence, cleanup, schema ownership, and redaction.
- Run diff check, compile check, sensitive-name scan, BOM/encoding scan, and scoped file-size audit.

## Unit C — durable release closure

- Fresh diff review against T5-011 acceptance.
- Update PROGRESS, REPORT, CURRENT, ROADMAP and mark the project complete only after evidence agrees.
