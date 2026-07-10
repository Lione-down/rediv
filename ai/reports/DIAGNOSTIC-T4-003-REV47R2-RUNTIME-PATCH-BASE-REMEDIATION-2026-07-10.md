# T4-003 Rev47r2 Runtime Patch Base Remediation Diagnostic

Diagnostic owner: Codex PMC runtime owner

Diagnostic time: 2026-07-10T00:28:00+08:00

Related revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2`

Failure fingerprint: `SUPERVISOR_RUNTIME_PATCH_BASE_INCOMPATIBLE`

Verdict: `READY_FOR_CONTINUATION`

## Blocking Fact

Hermes scheduled supervisor blocked rev47r2 before ACK and before Coordinator creation because the mandatory gate:

```text
python ai/runtime/deploy-hermes-runtime-contracts.py --apply
```

returned:

```text
HERMES_RUNTIME_PATCH_BASE_INCOMPATIBLE
```

The role verifier still returned `ROLE_CONTRACTS_OK`, so this was a durable patch asset / deployment classifier failure, not a role policy failure and not a T4-003 business failure.

## Root Cause

`ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64` was stale after the installed Hermes runtime was remediated for the rev47r1 finalization/output-capture defect. The live Hermes checkout contained the verified finalization fix in `cli.py` and the new regression in `tests/cli/test_single_query_session_finalize.py`, but the project-owned durable patch asset still represented the older runtime patch. `git apply --reverse --check` therefore failed on those two files, and `git apply --check` also failed because the older patch was neither cleanly applicable nor exactly reversible against the installed runtime.

The exact failing reverse-check evidence was:

```text
error: patch failed: tests/cli/test_single_query_session_finalize.py:268
error: tests/cli/test_single_query_session_finalize.py: patch does not apply
error: patch failed: cli.py:1218
error: cli.py: patch does not apply
```

## Remediation Applied

Regenerated the project-owned durable patch asset from the current verified Hermes runtime diff using a temporary Git index, including the three untracked runtime regression files without mutating the real Hermes index.

Updated project files:

- `ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64`
- `ai/runtime/tests/test_deploy_hermes_runtime_contracts.py`

The patch asset test now also requires these markers so the finalization/output-capture fix cannot silently fall out of the durable patch again:

- `fallback_prior_turn_content`
- `turn_exit_reason=`
- `response_previewed=`

## Verification

All commands below were non-secret and non-destructive.

```text
D:\works\codexWorks\project_revid\backend\.venv\Scripts\python.exe ai\runtime\deploy-hermes-runtime-contracts.py --apply
HERMES_RUNTIME_PATCH_ALREADY_APPLIED
```

```text
D:\works\codexWorks\project_revid\backend\.venv\Scripts\python.exe ai\runtime\verify-hermes-role-contracts.py
ROLE_CONTRACTS_OK
```

```text
D:\works\codexWorks\project_revid\backend\.venv\Scripts\python.exe -m pytest ai\runtime\tests\test_deploy_hermes_runtime_contracts.py -q
3 passed in 1.08s
```

```text
C:\Users\mkd\AppData\Local\hermes\hermes-agent\.venv\Scripts\python.exe -m pytest tests\cli\test_single_query_session_finalize.py -q
11 passed in 0.78s
```

```text
git diff --check -- ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64 ai/runtime/tests/test_deploy_hermes_runtime_contracts.py
PASS with LF/CRLF warning only
```

## Evidence Hashes

- `ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64` SHA256 `EA63E8A03506D27257F56B732316A0CD923C5AF6B0B625BE80880B0EEF2A88EA`
- `ai/runtime/tests/test_deploy_hermes_runtime_contracts.py` SHA256 `D18B9D425125D9F08CC9B3DFC98A8B5D794EB63E464DD977E5B4ED2CCD6DA7F9`
- `ai/automation/HERMES-AUTO-QUEUE.md` SHA256 `6BED79926A30CA5CE47946F2A66242A840550B032CE181B77CE1B0283D5DD90F`
- `ai/automation/HERMES-NEXT-CRON-CONTRACT.md` SHA256 `82545B7756F8B46B06811B47CA89022CC1D3A5C42235F0D1E24073A695D964DD`

## Safety Boundaries

No Revid business code, migrations, frontend files, database data, `.env`, secrets, Executor artifacts, Independent REVIEW, HANDOFF, Hermes execution status or Kanban cards were modified by this remediation.

## Continuation Signal

The pre-dispatch runtime deploy gate now passes. Rev47r2 remains the correct fresh executable continuation. Hermes may retry the ACK/dispatch preflight for the same rev47r2 Queue without changing the Task contract or reusing old cards.
