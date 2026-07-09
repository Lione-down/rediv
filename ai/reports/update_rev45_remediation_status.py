from pathlib import Path
path = Path('ai/automation/HERMES-EXECUTION-STATUS.md')
s = path.read_text(encoding='utf-8')
repls = {
'> Last updated: 2026-07-09T09:16:16+08:00': '> Last updated: 2026-07-09T11:47:50+08:00',
'| Last Transition | `2026-07-09T03:18:34+08:00` |': '| Last Transition | `2026-07-09T11:47:50+08:00` |',
'| Runtime Diagnostic Path | `ai/reports/DIAGNOSTIC-T4-002-REV45-DISPATCHER-LIST-FILES-BOUNDARY-2026-07-09.md` |': '| Runtime Diagnostic Path | `ai/reports/DIAGNOSTIC-T4-002-REV45-DISPATCHER-LIST-FILES-BOUNDARY-REMEDIATION-2026-07-09.md` |',
'| Runtime Diagnostic SHA256 | `1080E926AFFF7026D886F3BA664C26DC8C3FBA491048CB2E3AE706C397CF5E75` |': '| Runtime Diagnostic SHA256 | `0F83CC3E51F0103BCBAE653C08FEFC7EBC7FA324582E68A04503A884375DDB5F` |',
'| PMC Action Reason | `Rev45 Dispatcher Coordinator t_d6f567bb blocked before Executor creation: ROLE_BOUNDARY_VIOLATION on tool list_files for revid-dispatcher Kanban task. This is runtime/tool-policy infrastructure, not business REWORK.` |': '| PMC Action Reason | `Rev45 Dispatcher path remediation deployed: revid-dispatcher SOUL now forbids list_files/search_files discovery and requires exact Task Path read_file; ROLE_CONTRACTS_OK and launcher dry-run passed, but same-profile worker completion proof is still missing, so rev45 remains STILL_INFRA_BLOCKED.` |',
'| PMC Evidence Paths | `ai/automation/HERMES-EXECUTION-STATUS.md`; Coordinator `t_d6f567bb`; run `#201`; failure fingerprint `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION` |': '| PMC Evidence Paths | `ai/automation/HERMES-EXECUTION-STATUS.md`; `ai/reports/DIAGNOSTIC-T4-002-REV45-DISPATCHER-LIST-FILES-BOUNDARY-REMEDIATION-2026-07-09.md`; Coordinator `t_d6f567bb`; run `#201`; failure fingerprint `REV45_DISPATCHER_LIST_FILES_TOOL_BOUNDARY_VIOLATION` |',
}
for old, new in repls.items():
    if old not in s:
        raise SystemExit(f'MISSING expected text: {old}')
    s = s.replace(old, new, 1)
insert = '''\n- **rev45 runtime remediation diagnostic** (2026-07-09T11:47:50+08:00): deployed `revid-dispatcher` SOUL remediation in `ai/prompts/hermes-revid-dispatcher-soul.md` and `C:/Users/mkd/AppData/Local/hermes/profiles/revid-dispatcher/SOUL.md`; added explicit ban on `list_files`/`search_files` discovery and required exact `Task Path` via `read_file`. `verify-hermes-role-contracts.py` returned `ROLE_CONTRACTS_OK`; synthetic launcher `--dry-run` succeeded without card creation. Fresh diagnostic `ai/reports/DIAGNOSTIC-T4-002-REV45-DISPATCHER-LIST-FILES-BOUNDARY-REMEDIATION-2026-07-09.md` SHA256 `0F83CC3E51F0103BCBAE653C08FEFC7EBC7FA324582E68A04503A884375DDB5F`, verdict `STILL_INFRA_BLOCKED` because same-profile worker completion proof is still missing.\n'''
marker = '\n## Updated: 2026-07-08T20:00:00+08:00\n'
if insert.strip() not in s:
    if marker not in s:
        raise SystemExit('MISSING insertion marker')
    s = s.replace(marker, insert + marker, 1)
path.write_text(s, encoding='utf-8')
print('updated')
