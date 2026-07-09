from pathlib import Path
p=Path('ai/automation/HERMES-EXECUTION-STATUS.md')
s=p.read_text(encoding='utf-8')
repls={
'| Action | `REVIEW_DISPATCH_ONLY` |':'| Action | `NONE — terminal evidence only` |',
'| Previous Failure Fingerprint | `REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED; REV44R2_COORDINATOR_CREATED_WRONG_TASK_ID` |':'| Previous Failure Fingerprint | `REV44R3_PYDANTIC_CORE_EXTENSION_BROKEN; REV44R2_COORDINATOR_CREATED_WRONG_TASK_ID; REV44R1_REVID_PM_ROLE_BOUNDARY_TERMINAL_TOOL_NOT_ALLOWED` |',
'| Task SHA256 | `D1362DE7B74617EA3A530487683F61A6D45855A2556D51C3EB87BB59353BCFA3` |':'| Task SHA256 | `EC3F923C1906277FCEB582C5F07081ADEBBDE9E6F75703B82E4F0A5F18A62704` |',
'| Queue SHA256 | `9741513E6D3658CF802D9E1A0D5D814F48C60F689FBA6EE42A16381DA1D375F7` |':'| Queue SHA256 | `8913F5EF07E873B7E604F56B7CE7F65E88FEF4CAFDA335E20A96D6AAA1228882` |',
'| Last Transition | `2026-07-08T18:15:00+08:00` |':'| Last Transition | `2026-07-08T23:07:22+08:00` |',
'| Current Failure Fingerprint | `NONE` |':'| Current Failure Fingerprint | `REV44R3_PYDANTIC_CORE_EXTENSION_BROKEN` |',
'| Queue Status | `BLOCKED — NOT EXECUTABLE / TERMINAL RECONCILIATION COMPLETE` |':'| Queue Status | `BLOCKED — NOT EXECUTABLE / RUNTIME_DIAGNOSTIC_REQUIRED` |',
'| Rev44r3 Reconciliation | `INFRASTRUCTURE_BLOCKED — Coordinator t_65bf10da done (run #196, 116s), Reviewer t_4a67b642 blocked (run #197, 483s, pydantic_core extension broken), HANDOFF t_387d4c1b todo` |':'| Rev44r3 Reconciliation | `ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC — DIAGNOSTIC_READY; diagnostic ai/reports/DIAGNOSTIC-T4-002-REV44R3-PYDANTIC-CORE-RUNTIME-2026-07-08.md SHA256 5EF4CD860F400F468135502F92CC584E6B80D3EC511A14445A343BC42B66F998 verdict READY_FOR_CONTINUATION` |',
}
for a,b in repls.items(): s=s.replace(a,b,1)
# normalize only rev44r3 runtime advisory data rows from triple to single
start=s.index('## Runtime Advisory — Revision 44r3')
end=s.index('## Runtime Advisory — Revision 44r1')
block=s[start:end].replace('||| Runtime','| Runtime').replace('||| PMC','| PMC')
s=s[:start]+block+s[end:]
s=s.replace("| PMC Action Reason | `rev44r3 Coordinator t_65bf10da completed (run #196, 116s). Reviewer child t_4a67b642 blocked (run #197, 483s) due to backend/.venv pydantic_core extension broken (ModuleNotFoundError: no module named 'pydantic_core._pydantic_core'). Static analysis checks passed; runtime checks 3 and 4 blocked. HANDOFF child t_387d4c1b still todo. Infrastructure issue — Reviewer cannot proceed without fixed venv. rev44r2 Coordinator t_33629e6a and children remain terminal historical evidence with wrong-task fingerprint.` |","| PMC Action Reason | `rev44r3 terminal runtime diagnostic is ready: backend/.venv imports pydantic_core._pydantic_core successfully, py_compile passes, no database/secret access performed. Await Codex PMC decision for any fresh continuation revision.` |",1)
s=s.replace('| PMC Evidence Paths | `HERMES-NEXT-CRON-CONTRACT.md`, `REVIEW-T4-002-PMC-REV44R2-STATE-CONFLICT-2026-07-08.md`, `t_33629e6a`, `t_9a7e0e88`, `t_2ea6037c` |','| PMC Evidence Paths | `ai/reports/DIAGNOSTIC-T4-002-REV44R3-PYDANTIC-CORE-RUNTIME-2026-07-08.md`, `ai/reports/rev44r3_pydantic_probe_output.txt`, `ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV44R3-2026-07-08.md`, `t_4a67b642` |',1)
p.write_text(s,encoding='utf-8')
