# TASK-T2-005 Plan

## Task ID

TASK-T2-005

## Objective

打通 Home 页登录、用户信息、额度展示与资产列表加载，验证前端可基于真实后端 API 完成基础联调。

## Scope

- `frontend/src/views/app/Home.vue`
- `frontend/src/App.vue`
- `frontend/src/api/request.ts`（仅在联调必须时调整）

## Steps

1. 阅读任务文档、`xq/progress.md`、`ui/design-direction.md` 与现有前端实现，确认 store/API 能力和页面约束。
2. 在 Home 页接入登录、当前用户、额度卡片和资产列表，补齐错误提示与空状态。
3. 视需要在根组件补充当前用户初始化，避免刷新后丢失登录态展示。
4. 运行 `cd frontend && npm run build` 验证构建通过。
5. 生成 `ai/reports/REPORT-T2-005.md` 并同步进度文档。

## Acceptance Criteria

- 点击“微信登录”后调用 mock 登录并持久化 token。
- 登录后展示用户昵称、角色与 text/image/video 额度。
- 登录后自动加载真实资产列表，页面至少显示前 3 条。
- 登录失败和资产加载失败都有可见提示，不出现页面崩溃。
- `npm run build` 通过。
