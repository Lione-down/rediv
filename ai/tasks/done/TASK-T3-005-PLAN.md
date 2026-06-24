# TASK-T3-005 Plan

## Goal

为后端新增 Agnes 图片生成接口，完成文生图/图生图调用、`image` quota 扣减与失败退款、生成图片 asset 入库闭环，不修改前端代码。

## Scope

- 新增 `backend/api/image_generate.py`
- 修改 `backend/api/router.py`
- 补充后端测试，验证图片生成、quota 扣减与退款路径
- 生成 `ai/reports/REPORT-T3-005.md`

## Assumptions

- 以 `TASK-T3-005.md` 为最高优先级，接口只接收任务文档明确要求的 `prompt` 和可选 `image_ids`
- 图片生成不绑定 project/node，上游任务文档没有要求做归属校验，因此 asset 仅按当前用户保存
- Agnes 成功返回后再扣减 `image` quota；若 asset 保存失败则立即退款，保持额度一致

## Implementation Steps

1. 阅读现有 `backend/api/text_generate.py`、`backend/core/agnes_provider.py`、`backend/controllers/store.py` 与测试模式，复用现有鉴权、provider 获取和 asset 持久化风格。
2. 实现 `/api/image-generate` 路由，请求体校验、`image` quota 校验、Agnes 图片生成调用、URL 提取与错误处理。
3. 在 Agnes 成功后扣减 `image` quota，创建 `image` 类型 generation asset；若 asset 入库失败则执行退款。
4. 注册新路由并补充后端测试，覆盖成功、provider 失败、asset 保存失败和 quota 不足等关键路径。
5. 运行 `python -m unittest tests.test_image_generate`、`python -m compileall .`、`npm run build`，记录结果并生成报告。

## Success Criteria

- `POST /api/image-generate` 可用并需要认证
- 支持仅 `prompt` 的文生图，以及带 `image_ids` 的图生图调用
- 成功路径返回生成图片 URL 与新建 asset
- Agnes 失败时不扣减 `image` quota
- asset 入库失败时自动退回已扣减 quota
- 后端检查和前端构建通过
