# Task: 资产上传 + 列表功能完善

## Task ID
T1-005

## Phase
Phase 1

## Objective
完善资产系统的上传和列表能力，使其满足 xq/05_asset_system.md 中定义的 MVP 需求：支持图片/视频上传、项目筛选、分页、权限校验。

## Scope

### 修改的文件
- `backend/api/assets.py` — 完善上传接口（multipart 文件上传）、列表接口（项目筛选 + 分页）、新增生成结果入库接口
- `backend/schemas/asset.py` — 补充 AssetListItem、AssetListResponse、AssetFromGeneration 等 schema
- `backend/models/asset.py` — 如需补充字段则更新
- `backend/tests/test_asset_upload.py` — 新建资产上传与列表端到端测试

### 不涉及的文件
- 前端代码
- 后端其他模块（auth、quota、admin 等不改动）
- 文件存储服务（先用本地 storage/ 目录占位，不接 OSS/S3）

## Background

当前后端已有资产系统 MVP：
- `models/asset.py` — 完整的 Asset SQLAlchemy 模型，包含 source/source_model/source_task_id/status 等字段
- `controllers/store.py` — InMemoryStore 和 DatabaseStore 均有 `create_asset()` 和 `assets` 字典
- `api/assets.py` — 仅有 `GET /assets`（支持按类型筛选）和 `POST /assets/upload`（基于 URL 创建资产）

**缺失能力**：
1. 列表不支持按项目筛选（xq/05 要求支持按项目筛选）
2. 列表不支持分页（资产量大时需要）
3. 上传接口仅接受 URL，不支持 multipart 文件上传
4. 缺少 `POST /assets/from-generation` 接口（生成结果入库）
5. 缺少资产 URL 访问接口 + 权限校验
6. 缺少 Admin 隐藏/删除资产的能力

## Constraints
- 仅涉及后端 Python 代码
- 文件存储使用本地 `storage/uploads/` 目录（不接 OSS/S3）
- 上传接口使用 multipart/form-data
- 列表接口支持 `page`、`page_size`、`asset_type`、`project_id` 查询参数
- 新增接口必须要求正式登录用户权限（`Depends(current_user)`），游客不可上传
- 用户只能访问自己的资产
- Admin 可隐藏/删除任意资产
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 不修改任何现有业务逻辑（仅增强现有接口 + 新增接口）

## Acceptance Criteria
- [ ] `GET /assets` 支持 `asset_type` 和 `project_id` 筛选
- [ ] `GET /assets` 支持 `page`（默认 1）和 `page_size`（默认 20）分页，返回 `{items, total, page, page_size}`
- [ ] `POST /assets/upload` 支持 multipart/form-data 文件上传，文件保存到 `storage/uploads/`，返回资产的 url 为相对路径
- [ ] `POST /assets/upload` 支持传入 `type`（prompt/image/video）、`project_id`、`content_text`
- [ ] `POST /assets/from_generation` 接收 `{asset_type, url, content_text, source_model, source_task_id, canvas_node_id}` 创建生成类资产
- [ ] `GET /assets/{asset_id}` 返回单个资产详情，用户只能访问自己的资产（非自己的返回 403）
- [ ] `DELETE /assets/{asset_id}` 将资产 status 改为 `deleted`（软删除），用户只能删除自己的资产
- [ ] Admin 可隐藏资产：`PATCH /admin/assets/{asset_id}/hide`，将 status 改为 `hidden`
- [ ] `python -m compileall .` 通过
- [ ] 测试全部通过

## Deliverables
- `backend/api/assets.py`（增强）
- `backend/api/admin.py`（新增 admin hide 接口）
- `backend/schemas/asset.py`（补充 schema）
- `backend/tests/test_asset_upload.py`（新建）

## Codex Prompt
你是 Revid 项目的 Codex Executor。

请执行以下任务：

### 任务：资产上传 + 列表功能完善

#### 步骤 1：完善 schema

在 `backend/schemas/asset.py` 中补充以下 schema：

```python
from pydantic import BaseModel, Field

class AssetListItem(BaseModel):
    id: str
    user_id: str
    project_id: str | None
    canvas_node_id: str | None
    type: str
    url: str | None
    content_text: str | None
    source: str
    source_model: str | None
    source_task_id: str | None
    status: str
    created_at: str
    updated_at: str

class AssetListResponse(BaseModel):
    items: list[AssetListItem]
    total: int
    page: int
    page_size: int

class AssetCreateRequest(BaseModel):
    """兼容现有 URL 上传"""
    type: str = Field(pattern="^(prompt|image|video)$")
    url: str | None = None
    content_text: str | None = None
    project_id: str | None = None

class AssetFromGenerationRequest(BaseModel):
    """生成结果入库"""
    asset_type: str = Field(pattern="^(prompt|image|video)$", alias="type")
    url: str | None = None
    content_text: str | None = None
    source_model: str | None = None
    source_task_id: str | None = None
    canvas_node_id: str | None = None
    project_id: str | None = None

class AssetHideRequest(BaseModel):
    asset_id: str
```

#### 步骤 2：增强 store 方法

在 `controllers/store.py` 的 `InMemoryStore` 和 `DatabaseStore` 中补充：

1. `list_assets(user_id, asset_type=None, project_id=None, page=1, page_size=20)` — 返回列表 + 总数
2. `get_asset(asset_id)` — 按 ID 查资产
3. `delete_asset(asset_id, user_id)` — 软删除（status=deleted），校验 ownership
4. `hide_asset(asset_id)` — Admin 用，status=hidden

对于 DatabaseStore，需要写对应的 SQLAlchemy 查询。

#### 步骤 3：完善 assets.py 接口

在 `backend/api/assets.py` 中：

```python
# GET /assets — 增强
@router.get("")
def list_assets(
    asset_type: str | None = None,
    project_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
    user=Depends(current_user),
):
    """获取当前用户资产列表，支持类型和项目筛选 + 分页"""

# POST /assets/upload — 支持 multipart 文件上传
@router.post("/upload")
async def upload_asset(
    file: UploadFile | None = None,
    type: str = Form(...),
    content_text: str | None = Form(None),
    project_id: str | None = Form(None),
    user=Depends(current_user),
):
    """上传资产（支持 multipart 文件和 URL 两种方式）
    - 有 file：保存到 storage/uploads/，返回相对路径
    - 无 file 但有 url：沿用现有逻辑
    """

# POST /assets/from_generation — 生成结果入库
@router.post("/from_generation")
def from_generation(payload: AssetFromGenerationRequest, user=Depends(current_user)):
    """AI 生成结果自动入库"""

# GET /assets/{asset_id} — 单个资产详情 + 权限校验
@router.get("/{asset_id}")
def get_asset(asset_id: str, user=Depends(current_user)):
    """获取单个资产，用户只能访问自己的资产"""

# DELETE /assets/{asset_id} — 软删除
@router.delete("/{asset_id}")
def delete_asset(asset_id: str, user=Depends(current_user)):
    """软删除资产，用户只能删除自己的"""
```

注意：
- 文件上传保存到 `storage/uploads/` 目录（如不存在则创建）
- 文件名使用 `{user_id}/{uuid}.{ext}` 格式组织
- 返回的 url 为相对路径，如 `/uploads/{user_id}/{uuid}.{ext}`

#### 步骤 4：新增 admin hide 接口

在 `backend/api/admin.py` 末尾新增：

```python
@router.patch("/assets/{asset_id}/hide")
def hide_asset(asset_id: str, _admin=Depends(current_admin)):
    """Admin 隐藏资产（status=hidden）"""
```

#### 步骤 5：新建测试文件

创建 `backend/tests/test_asset_upload.py`，覆盖：

1. **test_list_assets_basic** — 列出当前用户资产
2. **test_list_assets_filter_by_type** — 按类型筛选
3. **test_list_assets_filter_by_project** — 按项目筛选
4. **test_list_assets_pagination** — 分页正确
5. **test_upload_url_asset** — URL 上传（兼容旧接口）
6. **test_upload_multipart_file** — multipart 文件上传
7. **test_from_generation** — 生成结果入库
8. **test_get_asset_own** — 访问自己的资产
9. **test_get_asset_other** — 访问他人资产返回 403
10. **test_delete_asset_own** — 软删除自己的资产
11. **test_delete_asset_other** — 删除他人资产返回 403
12. **test_admin_hide_asset** — Admin 隐藏任意资产
13. **test_guest_cannot_upload** — 游客不能上传

#### 步骤 6：编译和测试
- `cd backend && python -m compileall .`
- `cd backend && python tests/test_asset_upload.py`

#### 注意事项
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 参考 `backend/tests/test_quota_flow.py` 的测试结构
- 文件上传测试可使用 `io.BytesIO` 模拟文件内容
- 不要修改任何现有业务逻辑，只增强和新增
- 确保 `storage/uploads/` 目录在上传时自动创建
