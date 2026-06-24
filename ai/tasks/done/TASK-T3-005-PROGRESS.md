# TASK-T3-005 Progress

## Status

DONE

## Checklist

- [x] 领取任务并阅读 `CURRENT.md`、`ROADMAP.md`、任务文件
- [x] 阅读相关后端现有实现
- [x] 编写本任务计划文档
- [x] 实现 Agnes 图片生成路由
- [x] 注册路由
- [x] 补充后端测试
- [x] 运行后端检查与相关测试
- [x] 运行前端构建验证
- [x] 生成 REPORT-T3-005

## Notes

- 任务限定在 backend 范围，前端仅做 `npm run build` 回归验证。
- 当前按 `text_generate` 的既有模式实现：成功后扣减 quota，asset 保存失败时退款。
- 已新增 `/api/image-generate`，支持文生图和基于当前用户 image asset 的图生图输入。
- 已使用专项单测、`compileall` 和前端构建完成验收。
