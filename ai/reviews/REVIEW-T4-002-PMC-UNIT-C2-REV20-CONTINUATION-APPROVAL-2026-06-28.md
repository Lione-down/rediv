# T4-002 Unit C2 Revision 20 — PMC Continuation Approval

## Verdict

`PMC_CONTINUATION_APPROVED — REVISION 20`

Revision `phase4-wave2-unit-c2-migration-core-2026-06-28-19` 保持 terminal，旧 Coordinator `t_b493a47f` 不得复用。Hermes worker finalization remediation 已在 `REVIEW-T4-002-PMC-HERMES-WORKER-FINALIZATION-FIX-PASS-2026-06-28.md` 通过 PMC 验收，因此批准新的 bounded continuation revision：

`phase4-wave2-unit-c2-migration-core-continuation-2026-06-28-20`

## Authorization Evidence

- ADR-003 继续授权唯一 disposable database `revid_test_t4_002`，未改变 destructive boundary。
- revision `-19` card `t_b493a47f` 为 terminal blocked；其 children 为空。
- fresh read-only Kanban 查询中 `running`、`review`、`ready`、`scheduled` 均为空。
- 现存 `todo` 仅为 execution status 已列为 superseded/obsolete 的旧 cards，不构成 active chain。
- Runtime remediation 已通过 targeted tests、3 个 fresh same-profile positive cards 与 1 个 negative direct-block card。

## Approved Boundary

- Business attempt：`1 continuation`，不是 attempt 2。
- Action：`DISPATCH_ONLY`。
- Coordinator：只创建一个 `revid-backend` Executor child，验证 card ID、assignee、parent、revision 后立即 terminal。
- Executor：仅按顺序运行 Unit C2 四个 selectors；业务文件 read-only。
- Stop After：`UNIT_C2_REPORT_READY_REV20`。
- Reviewer 与 HANDOFF：本 revision 不授权，等待 PMC 核对 REPORT 后另行发布 lifecycle continuation。

## Fingerprint Inheritance

Revision `-20` 继承 T4-002 全部 business/runtime fingerprints，包括：

- `REV17_COORDINATOR_TIMEOUT`
- `REV17_COORDINATOR_RETRY_EXHAUSTED`
- `COORDINATOR_ROLE_COLLAPSE`
- `REV18_LIFECYCLE_STAGE_GAP`（已关闭但保留）
- `REV18_PREMATURE_HANDOFF_SCOPE_DRIFT`
- `REV19_COORDINATOR_CRASH`

Runtime fix 证明故障已修复，但不清零或删除历史 fingerprint。

## Hard Gates

- 只从 runtime environment 使用 `REVID_TEST_MYSQL_ADMIN_URL`，禁止读取 `.env` 或输出 credential。
- 所有 destructive/data operations 必须先证明 database name 精确为 `revid_test_t4_002`。
- 禁止访问或修改 `revid_db` 及任何其他 database。
- 禁止复用、claim、promote、unblock 或 retry 任何旧 T4-002 card。
- 未知 active chain、secret、identity、permission、test order 或 cleanup gate 失败时立即 BLOCKED。

## Human Decision

`NO`。本 continuation 不改变产品目标、schema/API contract、付费资源、secret 授权或 irreversible boundary。
