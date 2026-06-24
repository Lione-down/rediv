# Git ignore 清理进度

## 对应计划

`ai/tasks/PLAN-GITIGNORE-CLEANUP-2026-06-24.md`

## 进度

- [x] 审计根目录与 backend 的现有 `.gitignore`。
- [x] 盘点当前全部 untracked 文件并完成分类。
- [x] 添加精确、anchored 的 ignore 规则。
- [x] 保留 `backend/tests/` 正式测试的版本管理边界。
- [x] 同步记录到 `pitfalls.md`。
- [x] 使用 `git check-ignore` 验证每类文件的命中规则。
- [x] 使用 `git status --short -uall` 完成最终检查。
