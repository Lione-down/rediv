# Rev44r1 revid-pm Lifecycle Policy Fix Plan / Progress

## Context

Human Owner explicitly handed the Hermes `revid-pm` fix to Codex on 2026-07-08.

Rev44 business execution is already `REPORT_READY`, but rev44r1 review lifecycle is blocked because Coordinator `t_a2509036` failed before creating Reviewer/HANDOFF children with fingerprint `REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED`.

## Root Cause Hypothesis

The failure is caused by the worker runtime not exposing the bounded Kanban lifecycle tool surface to `revid-pm / REVIEW_DISPATCH_ONLY` at the time of run `#192`; without `kanban_create/complete/block` in the model schema, the worker attempted a forbidden `terminal` path and was correctly blocked by the strict `HERMES_KANBAN_ALLOWED_TOOLS` guard.

## Scope

- Inspect current installed Hermes profile/runtime policy for `revid-pm / REVIEW_DISPATCH_ONLY` and `HANDOFF_ONLY`.
- Verify the actual spawned-worker tool schema contains bounded Kanban lifecycle tools and excludes unrestricted `terminal`.
- Run existing role-contract and targeted Hermes tests for worker toolset/policy behavior.
- If current installed code is missing the fix, patch only Hermes-owned runtime/profile policy code.
- Write fresh runtime remediation evidence for PMC.

## Non-goals

- Do not create project rev44 Reviewer or HANDOFF artifacts.
- Do not publish lifecycle continuation or new Queue revision.
- Do not modify backend, frontend, migration, tests under business scope, `.env`, database, or secrets.
- Do not retry, unblock, claim, promote, reparent, archive, delete, or reuse historical cards.

## Verification

- `ai/runtime/verify-hermes-role-contracts.py`
- Local schema smoke for `revid-pm / REVIEW_DISPATCH_ONLY` proving required `kanban_*` tools present and forbidden tools absent.
- Targeted Hermes tests covering worker spawn toolsets and Kanban lifecycle contract.
- `git diff --check` for modified project evidence files.

## Progress

- [x] Read rev44r1 runtime advisory, diagnostic, Queue, status, current profile config, SOUL, verifier, and relevant Hermes runtime code.
- [x] Confirmed deployed `revid-pm` config includes bounded Kanban lifecycle tools for `REVIEW_DISPATCH_ONLY` and `HANDOFF_ONLY`.
- [x] Confirmed `ai/runtime/verify-hermes-role-contracts.py` returns `ROLE_CONTRACTS_OK`.
- [x] Ran local schema smoke: `REVIEW_DISPATCH_ONLY` exposes `read_file`, `search_files`, and bounded `kanban_*`; forbidden `terminal`, `process`, `write_file`, and browser tools are absent.
- [x] Ran `C:\Users\mkd\AppData\Local\hermes\hermes-agent\.venv\Scripts\python.exe -m pytest tests\hermes_cli\test_kanban_worker_spawn_toolsets.py -q`: 7 passed.
- [x] Ran `C:\Users\mkd\AppData\Local\hermes\hermes-agent\.venv\Scripts\python.exe -m pytest tests\tools\test_kanban_tools.py -q`: 107 passed.
- [x] Ran exact regression selectors `test_review_dispatch_only_allows_reviewer_and_handoff_contracts` and `test_worker_lifecycle_through_tools`: 2 passed.
- [x] Ran `HANDOFF_ONLY` local schema smoke: required tools present, forbidden tools absent.
- [x] Wrote runtime remediation evidence report `ai/reports/DIAGNOSTIC-T4-002-REV44R1-RUNTIME-POLICY-REMEDIATION-2026-07-08.md`, SHA256 `DC36583BCABBF9180F1615C5CCCB7B85F2E95F2D7EC492542DF5E64CF1742182`, verdict `READY_FOR_CONTINUATION`.
- [x] Updated Hermes execution status with the fresh diagnostic cursor and `PMC Action Required = YES / QUEUE_DECISION`.
- [x] Updated CURRENT, ROADMAP, and next-cron contract to say runtime remediation is ready and only PMC can authorize a fresh lifecycle continuation.
