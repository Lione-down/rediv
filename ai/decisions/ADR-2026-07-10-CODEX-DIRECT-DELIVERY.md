# ADR - Replace Hermes Multi-Agent Delivery With Codex Direct Delivery

- Status: Accepted
- Date: 2026-07-10
- Decision owner: Human Owner

## Context

Revid used Codex PMC for planning and final acceptance while Hermes scheduled, dispatched, coordinated, and reviewed specialized workers. T4-002 and T4-003 produced repeated dispatcher, worker-finalization, action-injection, status-reconciliation, and evidence-handoff failures. The governance chain consumed substantial work while business progress frequently stopped before implementation or REPORT creation.

The Human Owner decided that all engineering work should be performed directly by Codex and that durable project documents, rather than inter-agent messages, must carry context between scheduled runs.

## Decision

Adopt `CODEX_DIRECT_DELIVERY`.

Codex becomes the single Project Lead Engineer responsible for:

- project planning and architecture;
- Task definition and sequencing;
- backend, frontend, migrations, tests, and documentation;
- browser, integration, and manual acceptance where authorized;
- fresh diff review and final Task acceptance;
- CURRENT, ROADMAP, PLAN, PROGRESS, and REPORT maintenance.

Hermes Queue revisions, cards, profiles, Reviewer, HANDOFF, and runtime reconciliation are retired. Existing Hermes files remain immutable historical evidence and are excluded from normal automation context.

The Human Owner retains decisions involving product direction, paid calls, real secrets, external accounts, destructive operations, irreversible migrations, and major long-term contracts.

## Durable Context Model

Every run reconstructs state from:

1. `AGENTS.md`
2. `ai/automation/REVID-CODEX-DIRECT-OPERATING-MODEL.md`
3. `ai/state/CURRENT.md`
4. `ai/state/ROADMAP.md`
5. CURRENT's active Task, PLAN, and PROGRESS
6. linked ADRs and relevant source code

CURRENT is a concise rolling snapshot. PLAN records the intended implementation. PROGRESS records completed work, remaining work, exact next action, changed files, tests, and blockers. REPORT is written only after completion.

## Consequences

Benefits:

- no dispatcher or handoff latency;
- one owner for facts, implementation, and acceptance;
- lower repeated-context and token cost;
- direct recovery from partial work;
- fewer state-conflict documents.

Tradeoffs:

- review is not organizationally independent;
- Codex must perform a separate fresh diff-and-test review pass;
- deterministic tests, browser evidence, and concise reports carry more weight;
- only one implementation Task runs at a time to control scope and context.

## Migration

- Keep the former `Revid Codex PMC Controller` automation paused.
- Create a new Codex direct-delivery automation. Cadence, model, and reasoning effort are operational configuration: the installed automation is authoritative for execution and `CURRENT.md` mirrors its current values.
- Archive the old CURRENT, T4-003 contracts, and Hermes operating files.
- Replace active AGENTS, CURRENT, ROADMAP, and T4-003 documents with the direct-delivery versions.
- Do not delete or rewrite historical Hermes evidence.

## Reversal

This decision can be reversed by a new Human Owner ADR. Historical Hermes artifacts are retained, but they must not be reactivated implicitly.
