# REPORT-T2-005

## Status

DONE

## Task ID

TASK-T2-005

## Summary

完成 Home 页前端基础联调改造，接入 mock 微信登录、当前用户/额度展示、资产列表加载与错误提示；同时补充根组件登录态恢复初始化。

## Files Changed

- `frontend/src/views/app/Home.vue`
- `frontend/src/App.vue`
- `ai/tasks/doing/TASK-T2-005-PLAN.md`
- `ai/tasks/doing/TASK-T2-005-PROGRESS.md`
- `ai/reports/REPORT-T2-005.md`

## Tests Run

- `cd frontend && npm run build`
- `Invoke-WebRequest http://localhost:8000/health`

## Test Result

PASS

## Risks

- 本机 `localhost:8000` 当前不可达，真实后端在线联调路径未在本轮自动化中完成最终运行验证。

## Notes

- Home 页登录按钮现调用 `authStore.loginWithMockWechat()`，成功后继续拉取 `GET /me` 并触发资产加载。
- 资产区域默认显示前 3 条真实资产，失败时展示内联错误并提供重试按钮。
- 根组件在存在 token 且未加载 user 时会尝试恢复当前用户信息，401 仍交由请求层清理登录态。

## Need Hermes Review

YES
