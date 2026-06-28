# T4-002 Unit C2 Revision 19 — PMC Runtime Advisory

## Verdict

`PMC_RUNTIME_ADVISORY — STILL_INFRA_BLOCKED`

Revision `phase4-wave2-unit-c2-migration-core-2026-06-28-19` 不可继续执行，也不发布新的 continuation revision。当前失败发生在 Executor dispatch 前，属于 Hermes runtime/process incident，不是业务实现失败。

## Blocking Evidence

| Field | Evidence |
|---|---|
| Revision | `phase4-wave2-unit-c2-migration-core-2026-06-28-19` |
| Coordinator card | `t_b493a47f` |
| Run | `#113` |
| Execution state | `INFRASTRUCTURE_BLOCKED` |
| Failure fingerprint | `REV19_COORDINATOR_CRASH: pid 30648 not alive at 60s; process retry 1/1 exhausted` |
| Missing evidence | Executor card、PLAN、PROGRESS、REPORT、Independent REVIEW、HANDOFF 均不存在 |
| Related runtime signal | thin-dispatcher smoke card `t_20945c04` 也出现 `pid not alive` crash；当前证据不足以证明 `revid-pm` worker 稳定 |

业务文件没有获得 revision 19 写入授权；本轮只读审计未发现 revision 19 的业务产物。现有 evidence 不能支持 PMC final acceptance，也不能把 process crash 分类为业务 REWORK。

## Prohibited Actions

- 不重派 revision 19，不复用、claim、promote、unblock 或 retry `t_b493a47f` 及任何旧 card。
- 不通过新 revision 清零或替换 `REV19_COORDINATOR_CRASH` 及继承 fingerprints。
- 不修改业务代码、migration、tests、Executor artifacts 或 `HERMES-EXECUTION-STATUS.md`。
- 不运行未授权 destructive tests，不访问 `revid_db`，不读取、输出或猜测 secret。

## Runtime Owner Diagnostics Required

Hermes runtime owner 应针对 card `t_b493a47f` / run `#113` 收集并写入新的诊断证据：

1. 实际 process exit code、termination reason、stdout/stderr 尾部，且不得包含 credential。
2. worker stack 或 crash trace，以及 Gateway/dispatcher 在同一时间窗口的日志。
3. 进程、memory、CPU、handle、job-object 或其他资源限制证据。
4. 生效的 worker timeout、heartbeat、process retry 配置，以及 retry exhausted 的判定依据。
5. run `#113` 在 crash 前的最后一个已完成步骤和耗时，确认是否已进入 `kanban_create`。
6. 说明为何 exact `DISPATCH_ONLY` policy 已通过既有 smoke 后仍出现 `pid not alive`，并区分 policy failure 与 process failure。

可选执行同 profile、同 exact tool policy 的非破坏性 sustained-run/smoke；不得触碰业务数据库、业务文件或 secret。诊断不得通过复用 revision 19 card 完成。

## Expected Runtime Owner Output

诊断结论必须是以下之一，并附新鲜 evidence path：

- `READY_FOR_CONTINUATION`
- `STILL_INFRA_BLOCKED`
- `NEEDS_HUMAN_DECISION`

普通 worker/process 故障不满足 Human Owner 升级条件。只有诊断证明需要付费资源、真实 secret、不可逆操作或重大 contract 变化时，才可提出 `NEEDS_HUMAN_DECISION`。

## PMC Unblock Condition

PMC 仅在看到上述新鲜 runtime health evidence，且证明确切 failure cause 已消除、没有 active duplicate chain 后，才考虑 continuation revision。新 revision 必须继承全部历史 fingerprints；本 advisory 本身不授权任何 Hermes action。
