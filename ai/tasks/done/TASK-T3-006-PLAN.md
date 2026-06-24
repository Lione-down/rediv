# TASK-T3-006 Plan

## Goal

为 Agnes 视频生成补齐后端 API，完成异步任务创建、轮询完成、额度扣减/失败返还，以及生成结果落库为 video asset。

## Scope

- 新增 `backend/api/video_generate.py`
- 修改 `backend/api/router.py`
- 新增 `backend/tests/test_video_generate.py`
- 生成 `ai/reports/REPORT-T3-006.md`

## Implementation Steps

1. 参考现有 `text_generate` 与 `image_generate` 路由，确定请求模型、认证方式、quota 校验和 asset 保存模式。
2. 实现 `POST /api/video-generate`，调用 Agnes 视频任务创建接口并轮询结果，处理 completed、failed、timeout 三类结果。
3. 注册视频路由，确保不会影响现有 API 初始化。
4. 新增后端测试，覆盖成功、provider 失败、轮询失败/超时、asset 保存失败返还、quota 不足等关键路径。
5. 运行后端测试与基础检查，生成任务报告并同步进度文档。

## Success Criteria

- `/api/video-generate` 可用并受 `current_user` 保护
- 成功路径会创建 video asset 且扣减 1 次 `video_quota`
- Agnes 创建失败、轮询失败、轮询超时时不扣额度
- asset 保存失败时会返还额度
- 相关测试通过，且前端构建不受影响
