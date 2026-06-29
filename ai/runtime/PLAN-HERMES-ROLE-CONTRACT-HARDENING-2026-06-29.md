# Hermes Role Contract Hardening Plan

## Goal

Eliminate the repeated class of Hermes role-boundary failures by making Queue action, coordinator profile, persisted card body, child role, runtime tool policy and allowed outputs one machine-verifiable contract.

## Root Cause

The execution path has no canonical action registry. The Supervisor prompt and project launcher hard-code `DISPATCH_ONLY`, while Queue revisions may authorize `REVIEW_DISPATCH_ONLY`; downstream profiles also rely on prompt-only role statements unless an action-specific runtime policy happens to exist. This allows a valid Queue to be silently converted into a different card contract before worker spawn.

## Scope

1. Add a canonical project role-contract registry and verifier.
2. Make `create-hermes-coordinator.py` require an explicit supported action and reject action/profile/field mismatches.
3. Add distinct canonical bodies for `DISPATCH_ONLY` and `REVIEW_DISPATCH_ONLY`.
4. Route Supervisor Queue actions through the correct launcher contract and fail closed on unsupported actions.
5. Align the Operating Model, default SOUL and five profile SOUL templates with the same matrix.
6. Add runtime action policies for Backend, Frontend and Reviewer workers; remove obsolete `DISPATCH_ONLY` ownership from `revid-pm`.
7. Ensure the worker `kanban_create` tool persists `max_retries` and validates action/profile/parent contracts.
8. Deploy profile templates/policies without reading, copying or printing credential values.

## Canonical Role Matrix

| Action | Worker profile | May create | Project writes | Terminal result |
|---|---|---|---|---|
| `DISPATCH_ONLY` | `revid-dispatcher` | one Backend or Frontend Executor | none | `DISPATCH_COMPLETE` |
| `REVIEW_DISPATCH_ONLY` | `revid-pm` | one Reviewer + one dependent `HANDOFF_ONLY` card | none | `REVIEW_DISPATCH_COMPLETE` |
| `HANDOFF_ONLY` | `revid-pm` | none | one canonical HANDOFF | `HANDOFF_READY` or BLOCKED |
| `IMPLEMENT_AND_TEST_ONLY` | `revid-backend` / `revid-frontend` | none | Task Allowed Files + PLAN/PROGRESS/REPORT | REPORT_READY or BLOCKED |
| `INDEPENDENT_REVIEW_ONLY` | `revid-reviewer` | none | one Independent REVIEW | PASS/REWORK/BLOCKED |

## Non-goals

- Do not modify Revid business code, migrations, frontend or business tests.
- Do not retry, reuse, unblock, promote, reparent or delete historical cards.
- Do not publish a continuation Queue until runtime and profile verification pass.
- Do not print or copy `.env`, API keys, tokens or credential values.

## Verification

1. RED regression proves the old launcher converts review action to dispatch action.
2. Launcher unit tests cover both supported Queue actions and all invalid action/profile combinations.
3. Role verifier checks project templates and installed profile policy names/tool sets without reading secret values.
4. Hermes runtime tests prove missing/unknown actions fail before spawn, child action/profile mismatches fail, and `max_retries` persists.
5. Full affected Hermes test suites pass.
6. Isolated smokes cover each coordinator action and negative cross-role routing without touching the Revid board.
7. `git diff --check` passes for project and installed Hermes repositories.

## Success Criteria

- A Queue `REVIEW_DISPATCH_ONLY` revision cannot produce a persisted `DISPATCH_ONLY` card.
- No profile can start a card whose Action is missing, unknown or owned by another profile.
- Executors and Reviewer do not expose worker-creation, cron, memory, delegation or unrelated browser/web capabilities.
- Child `max_runtime`, `max_retries`, assignee, parent, action and revision are persisted and read-back verified.
- The same verifier can be rerun after future profile deployment to detect drift before Queue consumption.
