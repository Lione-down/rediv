# T4-002 PMC Review — Dispatch Blocked

## Review Context

- Task：T4-002 — SQLite → MySQL 数据迁移工具
- Human-approved execution revision：`phase4-wave2-manual-rework-2026-06-24-01`
- Scheduler evidence：`ai/reports/SCHEDULED-REPORT-2026-06-24.md`
- Review time：2026-06-24 09:00 +08:00

## PMC Verdict

**BLOCKED — 未进入 Executor attempt**

Human User 对一次人工 REWORK 的授权仍然有效，但该 revision 未成功派发 Backend Executor，也没有生成属于本 revision 的 PLAN、PROGRESS、REPORT、Independent REVIEW 或 HANDOFF。旧 attempt 的证据不得复用。

## Blocking Evidence

1. Hermes 调度报告确认 Coordinator `t_64d6db92` 错误地把新 revision 判为冗余并完成，导致 Executor 卡未创建；相同 idempotency key 无法再次创建协调卡。
2. Hermes 调度报告确认运行时未设置 `REVID_TEST_MYSQL_ADMIN_URL`。按 ADR-003，缺少该 secret 时禁止 credential fallback、替代数据库和 destructive verification。
3. `ai/tasks/doing` 为空；当前 revision 不存在新的执行证据链。

## Impact

- 当前 revision 不能继续 DISPATCH，也不能判定为 running、PASS 或 done。
- T4-002 未完成，T4-003 继续 blocked。
- 本次人工 REWORK 未实际进入 Executor attempt，不计为新的重复 failure fingerprint。

## Release Conditions

1. Human User 或 Hermes runtime owner 完成 `REVID_TEST_MYSQL_ADMIN_URL` 的 secret/environment 注入；只需由 Hermes 报告变量已设置及权限/identity gate 可检查，禁止记录 secret 值或完整 URL。
2. Codex PMC 在上述证据出现后发布全新的 APPROVED Queue revision，使用新的 revision-based idempotency key；不得复用 `t_64d6db92` 或旧 revision。
3. 新 Executor attempt 必须按 `ai/reviews/REVIEW-T4-002-PMC-2026-06-24.md` 和 ADR-003 生成全新的 PLAN、PROGRESS、REPORT、Independent REVIEW 与 HANDOFF。

## Responsibility

- Secret 注入：Human User / Hermes runtime owner
- 新 Queue revision：Codex PMC（仅在 secret readiness 证据出现后）
- Executor/Reviewer 派发：Hermes Scheduled Supervisor

## Recommendation

`BLOCKED`
