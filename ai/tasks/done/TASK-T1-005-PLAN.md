# TASK-T1-005 开发计划

## 目标

补齐后端资产系统 MVP 缺失能力：用户资产列表筛选与分页、multipart 文件上传、生成结果入库、单资产详情与软删除、Admin 隐藏资产，以及对应端到端测试。

## 范围

- 更新 `backend/schemas/asset.py`
- 更新 `backend/controllers/store.py`
- 更新 `backend/api/assets.py`
- 更新 `backend/api/admin.py`
- 新增 `backend/tests/test_asset_upload.py`
- 生成 `ai/reports/REPORT-T1-005.md`

## 实施步骤

1. 阅读任务、状态文档、`xq/05_asset_system.md`、相关后端实现和现有测试，确认接口语义、权限边界与测试模式。
2. 在 `backend/schemas/asset.py` 补齐资产列表、生成入库、隐藏资产等 schema，兼容原有 URL 上传请求。
3. 在 `backend/controllers/store.py` 为 `InMemoryStore` 和 `DatabaseStore` 增强资产创建、列表查询、单条查询、软删除和隐藏能力，保持现有数据结构与持久化方式。
4. 在 `backend/api/assets.py` 实现列表筛选/分页、multipart 上传、生成结果入库、详情查询和软删除接口；在 `backend/api/admin.py` 新增 Admin 隐藏资产接口。
5. 参考现有 `unittest + TemporaryDirectory` 模式，新建 `backend/tests/test_asset_upload.py`，覆盖任务要求的核心场景与权限校验。
6. 运行 `cd backend && python -m compileall .` 与相关测试命令，记录结果后生成任务报告。

## 验收标准

- `GET /assets` 支持 `asset_type`、`project_id`、`page`、`page_size`，返回 `{items, total, page, page_size}`。
- `POST /assets/upload` 支持 multipart 文件上传并保存到 `storage/uploads/`，同时兼容 URL 上传。
- `POST /assets/from_generation` 可创建生成类资产。
- `GET /assets/{asset_id}`、`DELETE /assets/{asset_id}` 正确执行 ownership 校验。
- `PATCH /admin/assets/{asset_id}/hide` 仅 Admin 可访问并将资产状态置为 `hidden`。
- `cd backend && python -m compileall .` 通过。
- 资产专项测试通过；如环境限制导致无法完整运行，报告中需说明原因。
