# T4-003 PMC Runtime Patch Base Remediation Review

Review owner: Codex Project Master Controller

Review time: 2026-07-10T00:30:00+08:00

Related revision: `phase4-wave2-t4-003-mysql-runtime-cutover-remediation-continuation-2026-07-09-47r2`

Failure fingerprint: `SUPERVISOR_RUNTIME_PATCH_BASE_INCOMPATIBLE`

## Evidence Reviewed

- Runtime deploy remediation diagnostic: `ai/reports/DIAGNOSTIC-T4-003-REV47R2-RUNTIME-PATCH-BASE-REMEDIATION-2026-07-10.md`
- Runtime deploy remediation diagnostic SHA256: `512CC6D917AE9708460377F66E219E9CB116259EFDACDCDC318FD9131BD156F2`
- Durable patch asset: `ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64`
- Durable patch asset SHA256: `EA63E8A03506D27257F56B732316A0CD923C5AF6B0B625BE80880B0EEF2A88EA`
- Durable patch test: `ai/runtime/tests/test_deploy_hermes_runtime_contracts.py`
- Durable patch test SHA256: `D18B9D425125D9F08CC9B3DFC98A8B5D794EB63E464DD977E5B4ED2CCD6DA7F9`

## Findings

The rev47r2 dispatch blocker was caused by stale durable runtime patch packaging. The installed Hermes runtime already contained the finalization/output-capture remediation, but the project-owned patch asset did not yet encode that updated live diff. The deploy gate correctly failed closed with `HERMES_RUNTIME_PATCH_BASE_INCOMPATIBLE` before any Coordinator or Executor card was created.

The durable patch asset has now been regenerated from the current verified Hermes runtime diff. The patch asset test includes explicit markers for the rev47r1 finalization/output-capture remediation, so future patch drift will fail the project test before scheduled dispatch.

Verification passed:

- `deploy-hermes-runtime-contracts.py --apply`: `HERMES_RUNTIME_PATCH_ALREADY_APPLIED`
- `verify-hermes-role-contracts.py`: `ROLE_CONTRACTS_OK`
- `ai/runtime/tests/test_deploy_hermes_runtime_contracts.py`: `3 passed`
- Hermes `tests/cli/test_single_query_session_finalize.py`: `11 passed`
- Project scoped `git diff --check`: pass with LF/CRLF warning only

## Verdict

`PMC_CONTINUATION_RESTORED - REV47R2_DISPATCH_GATE_READY`

No new Queue revision is required. Rev47r2 remains the correct executable Queue because no Coordinator or Executor was created during the blocked attempt.

## Hermes Next Action

Hermes should re-run the rev47r2 pre-dispatch gates and continue only if both return the verified values:

```text
D:\works\codexWorks\project_revid\backend\.venv\Scripts\python.exe ai\runtime\deploy-hermes-runtime-contracts.py --apply
HERMES_RUNTIME_PATCH_ALREADY_APPLIED
```

```text
D:\works\codexWorks\project_revid\backend\.venv\Scripts\python.exe ai\runtime\verify-hermes-role-contracts.py
ROLE_CONTRACTS_OK
```

After those gates pass, Hermes may ACK rev47r2, create exactly one fresh `revid-dispatcher / DISPATCH_ONLY` Coordinator and one fresh `revid-backend / IMPLEMENT_AND_TEST_ONLY` Executor child, then stop at `T4_003_MYSQL_RUNTIME_REMEDIATION_REPORT_READY_REV47R2`.

## Forbidden Actions

- Do not create a new Queue revision just to clear `SUPERVISOR_RUNTIME_PATCH_BASE_INCOMPATIBLE`.
- Do not reuse, claim, promote, unblock, retry, reparent, delete or archive rev47r1 cards `t_50707802` / `t_dfaef3d8` or rev47 cards `t_2f055673` / `t_cef284e1`.
- Do not create Reviewer or HANDOFF in rev47r2.
- Do not start T4-004, T4-005, frontend, auth or Canvas work.
- Do not read `.env` or `.env.*`.
- Do not output, hash, copy or infer secrets.
- Do not run destructive `revid_db` actions.
- Do not claim PMC PASS or final acceptance.

## Completion Condition

Rev47r2 remains blocked only until Hermes records a fresh successful pre-dispatch gate and creates the fresh Coordinator/Executor chain. PMC must review `ai/reports/REPORT-T4-003-REV47R2.md` before any Independent REVIEW, HANDOFF, T4-004 or T4-005 action is authorized.
