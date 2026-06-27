# T4-002 PMC Runtime Diagnostic Review — Revision -17

## Verdict

`PMC_BLOCKED — RUNTIME_DIAGNOSTIC_INCOMPLETE`

PMC 已审阅 `ai/reports/DIAGNOSTIC-T4-002-RUNTIME-OWNER-REV17-2026-06-28.md`。报告确认 revision `-16` 与 `-17` 均由 scheduler `max-runtime` 在 Executor 创建前终止，旧 chain 已 terminal，且当前没有 hidden Executor、Reviewer 或 HANDOFF chain；但证据不足以发布 continuation revision。

## Evidence Cursor

- Revision：`phase4-wave2-unit-c1-fixture-preflight-2026-06-27-17`
- Coordinator：`t_3e1f6a06` run `#101`
- Previous Coordinator：`t_aeaefef4` run `#100`
- Diagnostic hash：`41C95ADBD213BDA15AC999237E6AFF5062E9017D1A3B04A627C6879D928B2438`
- Failure fingerprint：全部继承 fingerprints + `REV17_COORDINATOR_TIMEOUT` + `REV17_COORDINATOR_RETRY_EXHAUSTED`
- Executor / PLAN / PROGRESS / REPORT / Independent REVIEW / HANDOFF：`MISSING`

## Accepted Findings

1. 两次 failure 均发生在 Coordinator claimed/spawned 之后、Executor 创建之前。
2. Timeout source 是 scheduler `max-runtime`：revision `-16` 为 300s，revision `-17` 为 120s。
3. Gateway、dispatcher 和 Kanban read operations 当前可响应，且没有 revision `-16`/`-17` hidden parallel chain。
4. 当前问题不满足 Human Owner 升级条件。

## Evidence Gaps

1. 报告明确无法确定 timeout 前最后完成的步骤，因此尚未定位 Queue parse、Task read、idempotency lookup、profile resolution 或 Executor creation 中的具体 failure point。
2. Run `#100`/`#101` 的 stdout/stderr、worker stack 与 termination 前日志仍缺失；`summary = null` 不是具体 runtime root-cause evidence。
3. 所谓 same-profile smoke 仅验证 Gateway status、board stats、card show 和 runs query，没有运行 `revid-pm` sustained pre-dispatch smoke，也没有证明 proposed dispatch path 能越过 300s 旧 failure point。
4. 报告没有给出可复现的新 dispatch mechanism、对应 timeout/resource 配置及成功证明，因此不能据此授权 budget-only retry、Unit C1a/C1b 或 revision `-18`。

## Runtime Owner Next Action

Hermes runtime owner 应在不创建 business card、不读取 secret、不访问数据库、不修改业务文件的前提下补充：

1. 可观测的 same-profile pre-dispatch probe，逐步记录 Queue parse、Task read、idempotency lookup、profile resolution 和 dry-run Executor-card construction 的开始、结束与耗时；不得实际创建 T4-002 Executor card。
2. Run `#100`/`#101` 可获得的 Gateway/dispatcher/worker 日志尾部、termination 行为、resource limits 与 timeout 配置；若历史日志不可恢复，必须明确记录缺失，并用新 probe 产生可观测证据。
3. 一个 sustained-run 证明 proposed dispatch path 能稳定越过已确认的 300s failure boundary，或一个明确定位并验证修复后的更短 deterministic probe。
4. 输出 `READY_FOR_CONTINUATION` 或 `STILL_INFRA_BLOCKED`，附 fresh evidence path；只有出现产品、付费资源、secret、不可逆操作或重大 contract 决策时才可输出 `NEEDS_HUMAN_DECISION`。

## Prohibitions

- 不发布 revision `-18`，不拆分 Unit C1a/C1b，不提高 budget 后直接 retry。
- 不创建、claim、promote、unblock、retry 或复用任何 T4-002 card。
- 不修改业务代码、migration、tests、Executor artifacts、Independent REVIEW、HANDOFF 或 `HERMES-EXECUTION-STATUS.md`。
- 不读取或输出 secret，不访问 `revid_test_t4_002`、`revid_db` 或其他数据库。

## PMC Re-enable Condition

只有 fresh runtime evidence 定位或绕过具体 pre-dispatch failure point，并证明 proposed dispatch path 可持续越过旧 boundary，PMC 才重新评估 continuation revision。新 revision 仍必须继承全部历史 failure fingerprints。
