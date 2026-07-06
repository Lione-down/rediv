# PMC REVIEW — T4-010 Revision 41r6 Search Policy and Revision 41r7 Authorization

## Verdict

`PMC_CONTINUATION_APPROVED — REV41R7 FINAL HANDOFF CLOSURE`

Rev41r6 Reviewer `t_39e56326` completed `PASS_REATTESTED` in 45s. HANDOFF `t_48326964` then failed closed because it called read-only `search_files`, which was absent from `HANDOFF_ONLY`.

PMC authorizes bounded `search_files` for `HANDOFF_ONLY` only on card-specified project evidence paths. `file_sha256` remains workspace-bounded; terminal/process/browser/network/arbitrary code remain forbidden. Verification: project runtime `37 passed`, `ROLE_CONTRACTS_OK`, Gateway PID `30476`, cron active.

Rev41r7 is the sole fresh lifecycle continuation. It performs only PASS re-attestation and canonical HANDOFF creation; no business/browser work is authorized.

Human Decision Required: `NO`.
