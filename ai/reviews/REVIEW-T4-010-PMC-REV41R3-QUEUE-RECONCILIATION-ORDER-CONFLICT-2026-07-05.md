# PMC REVIEW — T4-010 Revision 41r3 Queue Reconciliation Order Conflict

## Verdict

`PMC_STATE_CONFLICT — QUEUE RECONCILIATION SIGNAL ORDER CORRECTED`

## Evidence

- Active Wave、CURRENT、Task 与 runtime advisory 均指向 revision `phase4-wave3-workspace-shell-unit-b-rev41-review-dispatch-2026-07-05-41r3` 和 fingerprint `REV41R3_REVIEWER_TIMEOUT_WITHOUT_REVIEW`。
- Hermes execution status 在 `2026-07-05T21:23:30+08:00` 后仍缺少同 revision/fingerprint 的 Runtime Advisory section，并保留 rev41r1/rev41r2 inherited current fingerprint。
- Fresh deterministic check exit `2`：`Queue reconciliation revision does not match Active Wave`。
- Root cause 是 Queue 最前面的 fenced reconciliation block 属于 historical rev41r1；reconciler 按文件顺序读取首个 fenced block，而 rev41r3 当前 signal 只存在于 Active Wave table。
- Runtime diagnostic SLA `2026-07-05T21:56:17+08:00` 尚未到期；Independent REVIEW 与 HANDOFF 仍缺失。

## Decision

在 Queue 历史记录之前增加唯一优先的 rev41r3 canonical reconciliation block，使 deterministic reconciler 读取当前 revision/fingerprint。既有 rev41r3 advisory、terminal verdict、SLA 与 Resume Condition 不变；不重复生成 advisory，不记录 `RUNTIME_OWNER_STALLED`，不发布 continuation，也不操作任何 Hermes card。

## Expected Hermes Action

`ACK_TERMINAL_VERDICT_AND_START_RUNTIME_DIAGNOSTIC`

Hermes runtime owner 必须写入同 revision/fingerprint 的真实 advisory path/hash、owner state、due、diagnostic path 和 terminal confirmation。Human Decision Required: `NO`。
