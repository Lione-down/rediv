# REVIEW-T4-010-PMC-AUTHORIZATION

## Verdict

`PMC_APPROVED — DISPATCH_ONLY`

T4-002 revision `-30` 的 terminal reconciliation 已由 Hermes 确认，`PMC Action Required = NO`，没有 active worker 或 executable T4-002 Queue。T4-010 是 ROADMAP 中唯一 dependency 已满足的 P0 Task；当前 worktree 的已知修改均为 PMC/Hermes 治理文件，不触及其 frontend Allowed Files。

## Evidence

- T4-006 dependency：`ai/reviews/REVIEW-T4-006-PMC-2026-06-24.md`，verdict `PASS`。
- T4-010 Task：`ai/tasks/todo/TASK-T4-010.md`。
- Design source：`ui/design-system.md`。
- Current implementation：`frontend/src/views/app/Workspace.vue`，925 行。
- Canvas boundary：`frontend/src/components/canvas/CanvasStage.vue` 与 `frontend/src/store/canvas.ts` 保持 read-only。
- Git HEAD：`8a0ee2198dfa3a4dd0f0f992e3186d66d8969411`。

## Scope Decision

现有 Task 中 “project ID must come from route” 被收敛为现有 `/app/workspace` route 的 `project_id` query，不修改 router 或 API contract。固定 `PROJECT_NAME` 必须移除；缺失 ID 时显示明确的无项目状态。PromptComposer 与 AppTopBar 不需要为本 Task 修改，改为 read-only，避免把 Workspace shell 拆分扩展成 Home 或全局 navigation 重构。

76px Tool Rail、320px Inspector、Prompt Dock 和 920px drawer 以 Task 为本 revision 的布局 contract。视觉实现必须复用现有 design tokens，并遵守 app-shell surface hierarchy、统一 radius、pressed state、keyboard 与 reduced-motion 约束。

## Queue Authorization

- Revision: `phase4-wave3-workspace-shell-2026-07-02-31`
- Action: `DISPATCH_ONLY`
- Executor Profile: `revid-frontend`
- Review Profile: `revid-reviewer`
- Parallel Group: `serial-phase4-wave3-t4-010`
- Previous Failure Fingerprint: `NONE — initial T4-010 attempt`
- Stop After: `T4_010_WORKSPACE_SHELL_REPORT_READY_REV31`

Executor 只实现并验证 Task，不创建 Independent REVIEW 或 HANDOFF。REPORT_READY 后由 PMC 进行 source/diff/browser evidence 审计，再决定是否发布 `REVIEW_DISPATCH_ONLY` continuation。

Launcher `--dry-run` exit `0`，输出 exact standalone `Action: DISPATCH_ONLY`、revision、Task path、`revid-frontend`、fresh idempotency key、`120s`、`max-retries=2` 与 `--json` create command；未创建 card。

## Human Decision

`Human Decision Required = NO`

本授权不改变产品目标、API/schema contract、付费资源、secret 或不可逆操作。
