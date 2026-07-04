# Rev35 Worker Output Decode Recovery

## Goal

修复并验证 T4-010 Unit B revision 35 暴露的 Windows background-process output decode failure，形成可持续部署的 runtime guard，并在 fresh `revid-frontend` Kanban smoke 显式到达 terminal transition 后才允许发布 Unit B continuation。

## Root Cause

Rev35 worker 启动的 background process 经 `tools/process_registry.py::ProcessRegistry.spawn_local()` 使用 strict UTF-8 pipe reader；Windows 子进程输出字节 `0xB4` 后，`subprocess._readerthread` 抛出 `UnicodeDecodeError`。Agent 随后退化为纯文本 `[Acknowledged]` 并 clean exit 0，未调用 `kanban_complete` 或 `kanban_block`，因此 watcher 正确写入 `WORKER_EXIT_WITHOUT_TERMINAL_TRANSITION`。

## Scope

- 让 Revid role verifier fail closed 检查 installed `tools/process_registry.py` 同时包含 `encoding="utf-8"` 与 `errors="replace"`。
- 增加真实 invalid-byte background process regression，证明 `0xB4` 被替换而非让 reader thread 崩溃。
- 发布 bounded `revid-frontend` runtime smoke，要求显式 terminal transition；不执行 T4-010 业务工作。
- Smoke PASS 后发布 fresh T4-010 Unit B continuation，继承 rev31/rev32/rev33/rev35 fingerprints。

## Non-goals

- 不修改 T4-010 业务代码。
- 不重用、unblock、claim、promote、retry 或删除 rev35 cards/keys。
- 不读取或输出 secret。
- 不把 reconciler repair 当作 worker finalization repair。

## Success Criteria

1. Invalid-byte regression PASS，输出包含 replacement character，process exit code 为 0。
2. Full project runtime suite 与 `ROLE_CONTRACTS_OK` PASS。
3. Fresh same-profile smoke 使用唯一新 card/key，在 bounded budget 内调用 `kanban_complete` 或 `kanban_block`，且 card/run/log 保留 exit 与 terminal evidence。
4. Smoke 未通过时 Unit B Queue 保持 non-executable；通过后才发布 fresh continuation。

## Progress

- [x] 从 rev35 worker log 取得原始 traceback、plain-text fallback 与 clean exit evidence。
- [x] 定位 `ProcessRegistry.spawn_local()` decode boundary。
- [x] 确认当前 Hermes baseline 已包含 `errors="replace"`，并以 `0xB4` smoke 验证 exit 0。
- [x] 增加 project verifier marker 与 invalid-byte regression。
- [x] 运行 targeted/full runtime tests 与 role verifier。
- [x] 收口未 ACK 的 T4-002 rev36，并发布 bounded frontend terminal smoke Queue。
- [ ] 验收 smoke；通过后发布 T4-010 Unit B continuation。
