# PROGRESS — T4-002 Revision 23 Supervisor Body Transport Fix

## Status

`COMPLETE`

## Timeline

| Time | Step | Status |
|---|---|---|
| 2026-06-29 10:30 +08:00 | Read Queue, execution status, card `t_1dea37a2`, run `#120` | DONE |
| 2026-06-29 10:32 +08:00 | Read raw cron session tool calls from Hermes state DB | DONE |
| 2026-06-29 10:33 +08:00 | Prove CLI parser and direct PowerShell argv preserve multiline body | DONE |
| 2026-06-29 10:35 +08:00 | Implement project-owned subprocess-argv launcher and forbid fallback | DONE |
| 2026-06-29 10:37 +08:00 | Run launcher/prompt regression suite | DONE — 4/4 passed |
| 2026-06-29 10:38 +08:00 | Run rev24 transport dry-run | DONE — 10 body lines preserved |
| 2026-06-29 10:39 +08:00 | Collect required business selectors | DONE — 6 collected |
| 2026-06-29 10:39 +08:00 | Close rev23 and publish rev24 Queue | DONE |
| 2026-06-29 10:39 +08:00 | Verify business diff and governance diff | DONE — business diff empty; `git diff --check` passed |

## Result

- Root cause: Bash expanded PowerShell variables, then Supervisor explicitly fell back to a task-reference-only body.
- Runtime verdict: `PMC_RUNTIME_FIX_PASS — REV23 TERMINAL, REV24 READY_FOR_CONTINUATION`.
- Active Queue: `phase4-wave2-unit-c2-ac3-stale-same-remediation-transport-fixed-2026-06-29-24`.
- Card `t_1dea37a2`: retained unchanged as terminal evidence.
- Human decision required: `NO`.
