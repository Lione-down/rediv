# Rev41r1 revid-pm search_files Policy Remediation Plan

## Objective

Allow `revid-pm` workers executing `REVIEW_DISPATCH_ONLY` to perform bounded project evidence discovery with `search_files`, without broadening any write, terminal, browser, web, secret or business-execution capability.

## Root Cause

The canonical and deployed `revid-pm.REVIEW_DISPATCH_ONLY` `worker_tool_policies` list omits `search_files`. Runtime correctly resolves that exact allowlist and blocks run #169 with `ROLE_BOUNDARY_VIOLATION` when the lifecycle coordinator tries to discover bounded Task/REPORT/review paths.

## Scope

- `ai/runtime/verify-hermes-role-contracts.py`
- `ai/runtime/tests/test_verify_hermes_role_contracts.py`
- `ai/prompts/hermes-revid-pm-soul.md`
- deployed `revid-pm` profile policy only
- this plan/progress and final runtime evidence

## Non-goals

- No changes to business code, Queue revision, Kanban cards, execution status or existing artifacts.
- No retry/reuse of rev41r1 cards or runs.
- No `search_files` grant to `HANDOFF_ONLY`.
- No `terminal`, `process`, `write_file`, browser, web, memory, delegation or unrestricted fallback grant to `REVIEW_DISPATCH_ONLY`.

## Success Criteria

1. A regression test fails before the canonical policy change and passes after it.
2. Canonical and deployed `REVIEW_DISPATCH_ONLY` policies contain exactly one `search_files`; `HANDOFF_ONLY` does not.
3. `verify-hermes-role-contracts.py` returns `ROLE_CONTRACTS_OK`.
4. Relevant runtime tests pass and `git diff --check` passes.
5. A fresh non-destructive same-profile policy smoke proves `search_files` resolves as allowed without touching the Revid board, business data or secrets.

## Deployment Constraint

Gateway/profile reload is required before a new worker can use the changed policy. Existing terminal card `t_08bb42c8` remains immutable; any continuation requires fresh PMC authorization after runtime evidence.
