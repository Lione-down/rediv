# Hermes Retirement Notice

Effective: 2026-07-10

Hermes is retired from active Revid delivery by Human Owner decision. The former Queue, execution status, next-cron contract, multi-agent operating model, cards, profiles, REVIEW, and HANDOFF chains are historical evidence only.

Automation state:

- `revid-codex-pmc-advisor`: `PAUSED`
- `revid-codex-direct-delivery-controller`: `ACTIVE`

Rules:

- Do not dispatch, claim, promote, unblock, retry, reparent, or create Hermes cards.
- Do not publish new Queue revisions.
- Do not wait for Hermes reconciliation or runtime diagnostics.
- Do not interpret stale Hermes state as a blocker for Codex direct delivery.
- Do not delete or rewrite historical evidence.

Frozen copies captured at transition:

- `ai/automation/archive/hermes-retired-2026-07-10/REVID-MULTI-AGENT-OPERATING-MODEL.md`
- `ai/automation/archive/hermes-retired-2026-07-10/HERMES-AUTO-QUEUE.md`
- `ai/automation/archive/hermes-retired-2026-07-10/HERMES-EXECUTION-STATUS.md`
- `ai/automation/archive/hermes-retired-2026-07-10/HERMES-NEXT-CRON-CONTRACT.md`
- `ai/automation/archive/hermes-retired-2026-07-10/AGENTS-PMC.md`

The active operating model is `ai/automation/REVID-CODEX-DIRECT-OPERATING-MODEL.md`.
