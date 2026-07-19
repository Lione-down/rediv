# Revid Current Project State

Last updated: 2026-07-19

## Delivery Mode

- Mode: `CODEX_DIRECT_DELIVERY`
- Engineering owner: Codex Project Lead Engineer
- Human Owner gates: product direction, paid/real-provider calls, real secrets, and destructive or irreversible operations.
- Delivery decision: `ai/decisions/ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md`

## Product State

- Phase 4 initial version: `COMPLETE - PASS`
- Product V2 / Phase 5: active; Canvas-first acceptance.
- Database direction: MySQL-only.
- Completed V2 Tasks: T5-001 through T5-095 (`DONE - PASS`).

## Active Delivery

- Active implementation Task: none.
- State: `IDLE`.
- Last completed Task: `T5-095 - Canvas main composer attachment, Send, and Agnes capability recovery` (`ai/reports/REPORT-T5-095.md`), delivered to `origin/main` in this closure run.
- Next planned Task: `T5-096 - LibTV official Canvas three-axis 1:1 parity` (`TODO - PLANNED`); it is registered but not activated.
- Planned Task: `ai/tasks/todo/TASK-T5-096.md`.
- Planned implementation plan: `ai/tasks/doing/TASK-T5-096-PLAN.md`.
- Dependency baseline: T5-095 delivery `9871cedba00001e925497e2eadca855d6a76171e`.
- Task: `ai/tasks/todo/TASK-T5-095.md`
- Plan: `ai/tasks/doing/TASK-T5-095-PLAN.md`
- Progress: `ai/tasks/doing/TASK-T5-095-PROGRESS.md`

## Current Verified Facts

- T5-095 corrects the T5-094 main-composer acceptance error: attachment selection is composer-owned and non-mutating, while script Send uses the authenticated durable script-authoring path and yields an editable lineage result.
- Owned active public-HTTPS images may be attached as Agnes `image_url` story references. Local/private/foreign/stale/unsupported references fail before provider/task/quota work.
- Capability loading exposes loading, real model, incompatible-runtime, failure, and bounded manual-retry states in both composer and script context; internal `capability 未加载` copy is removed.
- Transient 503 does not auto-replay. The persisted source and exact brief remain available and prefilled for a user-triggered retry.
- T5-094 ledger A10 now requires attachment non-mutation, actual Send execution, exact input, lineage, and recovery evidence rather than control presence alone.
- T5-095 evidence is green: backend related `23/23`; frontend related Chromium `26/26`; build `4937 modules transformed`; composer axe serious/critical zero; manifest 28 scenarios with `R-095-COMPOSER` and one A10 scenario.
- The verified repository-owned backend on port 8000 was restarted onto current code and returns `/health` 200; unauthenticated capability access remains 401.
- No real/paid Agnes request was made, so current real-provider health, capacity, fidelity, and output quality remain unverified.
- User-owned `.codex/`, `.hermes/plans/`, and `output/` remain outside Task staging scope.

## Exact Next Action

When the Human Owner requests implementation, activate T5-096 as the only implementation Task, create its PROGRESS document, and perform the fresh official authenticated LibTV Canvas evidence audit before any business-code edit.

## Boundaries And Human Gates

- T5-095 has no active closure blocker. T5-094 documented deferrals and deferred real Agnes smoke remain unchanged.
- T5-096 planning does not reopen T5-094 delivery or claim new parity. T5-096 must newly verify visual, functional, and interaction effects from the official authenticated Canvas and preserve every Revid-only entry.
- Offline/mock evidence does not prove current real-provider success. Any future real Agnes text/image/video smoke still requires explicit authorization for exact media classes and maximum call/cost boundary.
- LibTV login-only/dynamic/private behavior remains evidence-limited and is not represented as matched.
- Alembic changes to user/runtime data, paid calls, real secrets, destructive MySQL/filesystem work, and external-account changes remain gated.

## Worktree

- T5-095 began from tracked-clean `789397fe15b443ee66431955766070918ca1b637`; scoped implementation, evidence, documentation, and REPORT are delivered by the exact closure commit to `origin/main`.
- User-owned `.codex/`, `.hermes/plans/`, and `output/` remain untracked and outside delivery scope.
