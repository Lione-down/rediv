# Task: 模板系统（后端）

## Task ID
T1-008

## Phase
Phase 1

## Objective
实现画布模板后端 CRUD：保存模板（从项目节点快照）、列出模板、使用模板创建新项目。

## Scope

### 新增的文件
- `backend/models/template.py` — SQLAlchemy 模型 Template
- `backend/schemas/template.py` — Pydantic schemas
- `backend/api/templates.py` — FastAPI 路由

### 修改的文件
- `backend/controllers/store.py` — 在 InMemoryStore 和 DatabaseStore 中添加模板 CRUD 方法
- `backend/api/router.py` — 挂载 templates 路由
- `backend/models/__init__.py` — 注册 Template 模型导入

### 不涉及的文件
- 前端代码
- 后端其他模块（auth、quota、admin、assets、projects、canvas_nodes 等业务逻辑不改动）

## Background
当前后端已有用户、项目、资产、画布节点等完整的数据模型和 API，但缺少模板（Template）能力。模板是对项目节点快照的复用机制，允许用户将一组画布节点保存为模板，后续基于模板快速创建新项目。模板系统是 Phase 3 画布真实化的重要前置能力。

需求文档见 `xq/06_template_system.md`。

## Constraints
- 仅涉及后端 Python 代码
- 使用 SQLite 持久化（DatabaseStore）和内存存储（InMemoryStore）双实现
- 所有接口要求正式登录用户权限（`Depends(current_user)`）
- 用户只能查看和操作自己的模板
- 使用模板创建项目时，自动复制模板中的节点到新项目
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 不修改任何现有业务逻辑（仅新增模块）
- 参考 T1-006（项目 CRUD）和 T1-007（画布节点 CRUD）的代码风格和实现模式

## Acceptance Criteria
- [ ] `POST /templates` 保存模板（从指定项目的节点快照），返回 `{id, name, user_id, node_count, created_at}`
- [ ] `GET /templates` 列出当前用户的模板（按创建时间倒序）
- [ ] `GET /templates/{template_id}` 获取模板详情（仅所属用户可访问，否则 403）
- [ ] `DELETE /templates/{template_id}` 删除模板（仅所属用户可操作）
- [ ] `POST /templates/{template_id}/use` 使用模板创建新项目（自动复制节点），返回新项目和模板信息
- [ ] 模板数据在 SQLite 和内存模式下均可持久化
- [ ] `python -m compileall .` 通过
- [ ] 测试全部通过

## Deliverables
- `backend/models/template.py`（新建）
- `backend/schemas/template.py`（新建）
- `backend/api/templates.py`（新建）
- `backend/controllers/store.py`（增强）
- `backend/api/router.py`（修改）
- `backend/models/__init__.py`（修改）
- `backend/tests/test_template_system.py`（新建）

## Codex Prompt
你是 Revid 项目的 Codex Executor。

请执行以下任务：

### 步骤 1：创建 SQLAlchemy 模型

在 `backend/models/template.py` 中创建 Template 模型：

```python
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    node_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)  # 节点快照列表
    node_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
```

说明：
- `user_id`：模板所属用户
- `name`：模板名称
- `node_data`：JSON 列，存储从项目导出的节点列表（每个节点包含 id, node_type, content, position_x, position_y, width, height 等字段）
- `node_count`：节点数量（冗余字段，方便列表展示）

### 步骤 2：创建 Pydantic Schemas

在 `backend/schemas/template.py` 中创建：

```python
from pydantic import BaseModel, Field


class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    project_id: str = Field(..., min_length=1)  # 从哪个项目保存模板


class TemplateResponse(BaseModel):
    id: str
    name: str
    user_id: str
    node_count: int
    created_at: str


class TemplateListResponse(BaseModel):
    items: list[TemplateResponse]
    total: int


class TemplateUseResponse(BaseModel):
    template: TemplateResponse
    project_id: str
    project_name: str
    nodes_created: int
```

### 步骤 3：增强 store.py

在 `InMemoryStore` 中添加以下方法：

```python
# 模板 CRUD
def create_template(self, user_id: str, name: str, node_data: list) -> dict
def list_templates(self, user_id: str) -> list[dict]
def get_template(self, template_id: str) -> dict | None
def delete_template(self, template_id: str, user_id: str) -> dict | None
def use_template(self, template_id: str, user_id: str, project_name: str) -> dict
```

在 `DatabaseStore` 中同样实现上述方法。

注意：
- `create_template` 需要验证项目存在且属于当前用户
- `use_template` 需要先创建项目，再将模板中的节点逐个创建到新项目中（需要重新生成节点 ID）
- 所有方法都需要权限校验

### 步骤 4：创建 API 路由

在 `backend/api/templates.py` 中实现：

```python
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(tags=["templates"])

@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreateRequest, user=Depends(current_user))

@router.get("", response_model=TemplateListResponse)
def list_templates(user=Depends(current_user))

@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: str, user=Depends(current_user))

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: str, user=Depends(current_user))

@router.post("/{template_id}/use", response_model=TemplateUseResponse)
def use_template(template_id: str, user=Depends(current_user))
```

### 步骤 5：挂载路由

在 `backend/api/router.py` 中：
```python
from api import admin, assets, auth, canvas_nodes, health, projects, templates
...
app.include_router(templates.router)
```

### 步骤 6：注册模型

在 `backend/models/__init__.py` 中添加 Template 导入和导出。

### 步骤 7：创建测试

在 `backend/tests/test_template_system.py` 中覆盖：

1. **test_create_template** — 从项目保存模板
2. **test_create_template_wrong_project** — 从别人的项目保存模板返回 403
3. **test_list_templates** — 列出当前用户模板
4. **test_get_template** — 获取模板详情
5. **test_get_template_forbidden** — 获取别人的模板返回 403
6. **test_delete_template** — 删除模板
7. **test_use_template** — 使用模板创建新项目（验证项目创建 + 节点复制）
8. **test_template_persistence** — 验证 SQLite 持久化

### 步骤 8：编译和测试
- `cd backend && python -m compileall .`
- `cd backend && python tests/test_template_system.py`

### 注意事项
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 参考 `backend/tests/test_canvas_node_crud.py` 和 `backend/tests/test_project_crud.py` 的测试结构
- 不要修改任何现有业务逻辑，只新增模块
- `use_template` 时节点需要重新生成 ID，不能复用原 ID
- 节点数据存储在 `node_data` JSON 列中，不需要关联查询 canvas_nodes 表
- 确保用户只能操作自己的模板
- 参考 T1-006/T1-007 的代码风格（MappedColumn、ForeignKey、utc_now 工具函数等）
