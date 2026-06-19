# REVIEW-T1-007

## Task ID
T1-007 — 画布节点 CRUD

## Review Date
2026-06-24

## Verdict
**PASS** ✅

---

## 验收标准逐项核对

| # | 验收标准 | 状态 |
|---|---------|------|
| 1 | `POST /projects/{project_id}/nodes` 创建节点，返回正确字段 | ✅ 通过 — `test_create_node` 验证 201 + 字段正确 |
| 2 | `GET /projects/{project_id}/nodes` 列表按 position_x 排序 | ✅ 通过 — `test_list_nodes` 验证排序和过滤 |
| 3 | `GET /projects/{project_id}/nodes/{node_id}` 非本项目返回 403 | ✅ 通过 — `test_get_node_wrong_project` 验证 |
| 4 | `PUT /projects/{project_id}/nodes/{node_id}` 更新节点 | ✅ 通过 — `test_update_node` 验证全字段更新 |
| 5 | `DELETE /projects/{project_id}/nodes/{node_id}` 删除节点 | ✅ 通过 — `test_delete_node` 验证软删除 + 204 |
| 6 | SQLite 持久化 | ✅ 通过 — `test_node_persistence` 验证 |
| 7 | 内存模式 CRUD | ✅ 通过 — `test_inmemory_node_crud` 验证 |
| 8 | `compileall` 通过 | ✅ 通过 — 退出码 0 |
| 9 | 测试全部通过 | ✅ 通过 — 9/9 OK |

---

## 代码质量审查

### 模型层 (`backend/models/canvas_node.py`)
- ✅ 字段定义与 TASK 中的 spec 完全一致
- ✅ 使用 `MappedColumn` + `ForeignKey` 风格，与现有模型保持一致
- ✅ `updated_at` 字段正确定义（虽然 InMemoryStore 中用 `now_iso()` 字符串存储，DatabaseStore 中用 `utc_now` datetime，两者风格略有差异但不影响功能）

### Schema 层 (`backend/schemas/canvas_node.py`)
- ✅ Create/Update/Response/ListResponse 四类 schema 完整
- ✅ UpdateRequest 使用 `Optional` + `exclude_none` 实现部分更新
- ✅ 字段约束合理（min_length, max_length, ge）

### API 层 (`backend/api/canvas_nodes.py`)
- ✅ 统一的 `_verify_project_ownership` 前置校验
- ✅ 节点归属校验 `_get_project_node_or_error` 正确处理 403
- ✅ 错误码规范（404/403/201/204）
- ✅ 代码简洁，无冗余逻辑

### Store 层 (`backend/controllers/store.py`)
- ✅ InMemoryStore 和 DatabaseStore 双实现
- ✅ 列表查询过滤 `status != "deleted"`（软删除语义正确）
- ✅ 排序按 `position_x` 升序
- ✅ 权限校验在 store 层也有二次保护（`PermissionError`）

### 测试 (`backend/tests/test_canvas_node_crud.py`)
- ✅ 9 个用例覆盖：创建、列表排序、详情、更新、删除、跨项目 403、SQLite 持久化、内存模式
- ✅ 使用 `TemporaryDirectory` 隔离数据库
- ✅ 两个用户 + 两个项目的场景设计合理

---

## 风险提示

1. **软删除策略**：当前删除采用 `status=deleted` 而非物理删除。Report 中已说明，后续如需恢复或级联清理资产需明确策略。当前阶段可接受。
2. **`updated_at` 时间格式差异**：InMemoryStore 使用 `now_iso()`（字符串），DatabaseStore 使用 `utc_now`（datetime）。不影响功能但建议在后续统一。
3. **`models/__init__.py` 修改**：Report 说明这是最小必要配套改动，已确认。

---

## 与需求文档对照

- `xq/03_canvas_node_system.md`：需求极简（"实现画布核心数据结构：节点系统（Node CRUD）"），当前实现完全满足。
- `xq/04_canvas_frontend.md`：前端需求为"从后端加载 nodes"，后端接口已就绪，前端可在 Phase 3 对接。
- `ROADMAP.md` 1.6 画布节点 CRUD：当前实现覆盖该阶段目标。

---

## 结论

**T1-007 通过审查。** 代码质量良好，测试覆盖充分，与需求和架构一致。可以合并入主线并更新项目状态。
