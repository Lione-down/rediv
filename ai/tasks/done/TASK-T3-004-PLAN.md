# TASK-T3-004 Plan

## Goal

为后端新增 Agnes 文本生成接口，完成脚本/prompt/分镜文本生成、额度扣减和 prompt 资产入库闭环，不改动前端。

## Scope

- 新增 `backend/api/text_generate.py`
- 修改 `backend/api/router.py`
- 补充后端测试验证文本生成、额度扣减与失败返还
- 生成 `ai/reports/REPORT-T3-004.md`

## Assumptions

- 以 `TASK-T3-004.md` 为最高优先级，额度策略按“Agnes 成功后扣减，asset 保存失败时返还”实现。
- `project_id` 和 `node_id` 都需要校验归属，避免跨项目写入资产。
- `prompt` 直接作为 Agnes chat 的 user message content 发送。

## Implementation Steps

1. 阅读现有 `assets`、`canvas_nodes`、`agnes_provider`、`store` 实现，复用现有认证与存储模式。
2. 实现 `/api/text-generate` 路由，请求校验、项目/节点归属校验、额度不足校验、Agnes 调用与结果解析。
3. 在 Agnes 成功后扣减 `text` 额度，创建 `prompt` 类型 generation asset；若 asset 入库失败则返还额度。
4. 注册新路由并补充后端测试，覆盖成功、Agnes 失败、asset 保存失败等关键路径。
5. 运行 `python -m compileall .`、相关单测和 `frontend/npm run build`，记录结果并生成报告。

## Success Criteria

- `POST /api/text-generate` 可用并需要认证。
- 成功路径返回 Agnes 文本结果与生成资产。
- Agnes 失败时不扣额度。
- asset 入库失败时自动返还已扣额度。
- 后端检查和前端构建通过。
