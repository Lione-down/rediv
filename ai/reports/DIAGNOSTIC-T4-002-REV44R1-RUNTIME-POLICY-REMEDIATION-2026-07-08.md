# T4-002 Runtime Policy Remediation Evidence - Revision 44r1

> Generated: 2026-07-08T15:36:35+08:00
> Revision: phase4-wave2-unit-c3-rev44-review-dispatch-2026-07-08-44r1
> Fingerprint: REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED

## Verdict

`READY_FOR_CONTINUATION`

The installed Hermes runtime/profile policy now proves the bounded `revid-pm / REVIEW_DISPATCH_ONLY` and `HANDOFF_ONLY` lifecycle path without granting unrestricted `terminal`.

This does not create project rev44 Reviewer or HANDOFF artifacts and does not authorize PMC PASS. It only provides fresh runtime evidence for Codex PMC to consider a future lifecycle continuation revision.

## Root Cause

Run `#192` failed because the worker path did not have a usable bounded Kanban lifecycle tool surface for `revid-pm / REVIEW_DISPATCH_ONLY`; without `kanban_create/complete/block` available in the worker tool schema, the lifecycle coordinator attempted a forbidden `terminal` path and was correctly blocked by the strict worker allowlist.

## Current Installed Policy Evidence

- `revid-pm / REVIEW_DISPATCH_ONLY` deployed allowlist includes:
  - `read_file`
  - `search_files`
  - `kanban_show`
  - `kanban_create`
  - `kanban_link`
  - `kanban_complete`
  - `kanban_block`
  - `kanban_comment`
  - `kanban_heartbeat`
- `revid-pm / HANDOFF_ONLY` deployed allowlist includes:
  - `read_file`
  - `search_files`
  - `file_sha256`
  - `write_file`
  - `kanban_show`
  - `kanban_complete`
  - `kanban_block`
  - `kanban_comment`
  - `kanban_heartbeat`
- Neither action exposes unrestricted `terminal`.

## Verification

| Check | Result |
|---|---|
| `python ai\runtime\verify-hermes-role-contracts.py` | `ROLE_CONTRACTS_OK` |
| `python -m pytest ai\runtime\tests\test_verify_hermes_role_contracts.py -q` | `10 passed` |
| Installed `revid-pm / REVIEW_DISPATCH_ONLY` schema smoke | required `read_file/search_files/kanban_*` present; forbidden `terminal/process/write_file/browser_*` absent |
| Installed `revid-pm / HANDOFF_ONLY` schema smoke | required `read_file/search_files/file_sha256/write_file/kanban lifecycle` present; forbidden `terminal/process/browser/kanban_create/kanban_link` absent |
| `C:\Users\mkd\AppData\Local\hermes\hermes-agent\.venv\Scripts\python.exe -m pytest tests\hermes_cli\test_kanban_worker_spawn_toolsets.py -q` | `7 passed` |
| `C:\Users\mkd\AppData\Local\hermes\hermes-agent\.venv\Scripts\python.exe -m pytest tests\tools\test_kanban_tools.py -q` | `107 passed` |
| `test_review_dispatch_only_allows_reviewer_and_handoff_contracts` + `test_worker_lifecycle_through_tools` | `2 passed` |

## Safety Boundaries

- No project Reviewer or HANDOFF artifact was created.
- No rev44r1, rev44, rev43, rev42 or historical card was retried, claimed, promoted, unblocked, reparented, archived, deleted or reused.
- No backend/frontend/business code was modified.
- No database was accessed.
- No `.env` or secret file was read for this remediation.
- No credential material is included in this report.

## Resume Condition

Codex PMC may consider a fresh lifecycle continuation only if it uses fresh cards and inherits fingerprint `REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED`. The continuation must still create a real Independent REVIEW and canonical HANDOFF before any PMC final acceptance.
