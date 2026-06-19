# Task: 画布节点 CRUD

## Task ID
T1-007

## Phase
Phase 1

## Objective
实现画布节点（CanvasNode）后端 CRUD，满足 xq/03_canvas_node_system.md 和 xq/04_canvas_frontend.md 定义的需求：节点属于项目，支持创建、列表、详情、更新、删除。

## Scope

### 新增的文件
- `backend/models/canvas_node.py` — SQLAlchemy 模型
- `backend/schemas/canvas_node.py` — Pydantic schemas
- `backend/api/canvas_nodes.py` — FastAPI 路由

### 修改的文件
- `backend/controllers/store.py` — 在 InMemoryStore 和 DatabaseStore 中添加画布节点 CRUD 方法
- `backend/api/router.py` — 挂载 canvas_nodes 路由
- `backend/models/__init__.py` — 注册 CanvasNode 模型导入
- `backend/tests/test_canvas_node_crud.py` — 新建专项测试

### 不涉及的文件
- 前端代码
- 后端其他模块（auth、quota、admin、assets、projects 等不改动）

## Background
当前后端已有用户、项目、资产、额度等完整的数据模型和 API，但缺少画布节点（CanvasNode）这一核心概念。画布节点是 AI 视频创作工作流的基本单元（文本节点、图像节点等），隶属于项目，是 Phase 3 画布真实化的前置依赖。

## Constraints
- 仅涉及后端 Python 代码
- 使用 SQLite 持久化（DatabaseStore）和内存存储（InMemoryStore）双实现
- 所有接口要求正式登录用户权限（`Depends(current_user)`）
- 用户只能操作自己项目下的节点
- 节点归属校验：先验证项目存在且属于当前用户，再操作节点
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 不修改任何现有业务逻辑（仅新增模块）
- 参考 T1-006（项目 CRUD）的代码风格和实现模式

## Acceptance Criteria
- [ ] `POST /projects/{project_id}/nodes` 创建节点，返回 `{id, project_id, node_type, content, position_x, position_y, created_at}`
- [ ] `GET /projects/{project_id}/nodes` 获取指定项目的节点列表（按 position_x 排序，左到右）
- [ ] `GET /projects/{project_id}/nodes/{node_id}` 获取节点详情，用户只能访问自己项目的节点（非本项目返回 403）
- [ ] `PUT /projects/{project_id}/nodes/{node_id}` 更新节点（内容、位置、类型等），用户只能更新自己项目的节点
- [ ] `DELETE /projects/{project_id}/nodes/{node_id}` 删除节点，用户只能删除自己项目的节点
- [ ] 节点数据在 SQLite 和内存模式下均可持久化
- [ ] `python -m compileall .` 通过
- [ ] 测试全部通过

## Deliverables
- `backend/models/canvas_node.py`（新建）
- `backend/schemas/canvas_node.py`（新建）
- `backend/api/canvas_nodes.py`（新建）
- `backend/controllers/store.py`（增强）
- `backend/api/router.py`（修改）
- `backend/models/__init__.py`（修改）
- `backend/tests/test_canvas_node_crud.py`（新建）

## Codex Prompt
你是 Revid 项目的 Codex Executor。

请执行以下任务：

### 步骤 1：创建 SQLAlchemy 模型

在 `backend/models/canvas_node.py` 中创建 CanvasNode 模型：

```python
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, JSON, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, utc_now


class CanvasNode(Base):
    __tablename__ = "canvas_nodes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    node_type: Mapped[str] = mapped_column(String(50), nullable=False)  # text, image, video, agnes_text, agnes_image, agnes_video 等
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    position_x: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    width: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    height: Mapped[int] = mapped_column(Integer, nullable=False, default=200)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")  # active, archived, deleted
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
```

说明：
- `node_type` 标识节点类型（文本、图片、视频、AI 生成等）
- `content` 使用 JSON 列存储节点具体内容（键值对），支持灵活扩展
- `position_x` / `position_y` 用于画布布局定位
- `width` / `height` 节点尺寸
- `status` 节点状态，支持归档/删除

### 步骤 2：创建 Pydantic Schemas

在 `backend/schemas/canvas_node.py` 中创建：

```python
from pydantic import BaseModel, Field
from typing import Optional


class CanvasNodeCreateRequest(BaseModel):
    node_type: str = Field(..., min_length=1, max_length=50)
    content: dict = Field(default_factory=dict)
    position_x: float = Field(default=0.0, ge=0.0)
    position_y: float = Field(default=0.0, ge=0.0)
    width: int = Field(default=300, ge=50)
    height: int = Field(default=200, ge=50)


class CanvasNodeUpdateRequest(BaseModel):
    node_type: Optional[str] = Field(None, min_length=1, max_length=50)
    content: Optional[dict] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    status: Optional[str] = None


class CanvasNodeResponse(BaseModel):
    id: str
    project_id: str
    node_type: str
    content: dict
    position_x: float
    position_y: float
    width: int
    height: int
    status: str
    created_at: str


class CanvasNodeListResponse(BaseModel):
    items: list[CanvasNodeResponse]
    total: int
```

### 步骤 3：增强 store.py

在 `InMemoryStore` 和 `DatabaseStore` 中添加以下方法：

**InMemoryStore 新增：**
- `create_node(self, project_id: str, user_id: str, node_type: str, content: dict, position_x: float, position_y: float, width: int, height: int) -> dict`
- `list_nodes(self, project_id: str, user_id: str) -> list[dict]`
- `get_node(self, node_id: str) -> dict | None`
- `update_node(self, node_id: str, user_id: str, **fields) -> dict | None`
- `delete_node(self, node_id: str, user_id: str) -> dict | None`

**DatabaseStore 新增：** 同样实现上述方法，使用 SQLAlchemy 操作数据库。

注意：所有方法都需要先验证项目属于当前用户（通过 project_id + user_id 关联校验）。

### 步骤 4：创建 API 路由

在 `backend/api/canvas_nodes.py` 中实现：

```python
from fastapi import APIRouter, Depends, HTTPException, status
from controllers.store import store
from core.security import current_user
from schemas.canvas_node import (
    CanvasNodeCreateRequest,
    CanvasNodeUpdateRequest,
    CanvasNodeResponse,
    CanvasNodeListResponse,
)

router = APIRouter(prefix="/projects/{project_id}/nodes", tags=["canvas-nodes"])


def _verify_project_ownership(project_id: str, user_id: str) -> dict:
    """验证项目存在且属于当前用户"""
    project = store.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return project


@router.post("", response_model=CanvasNodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(project_id: str, payload: CanvasNodeCreateRequest, user=Depends(current_user)):
    """在项目中创建新节点"""
    _verify_project_ownership(project_id, user["id"])
    return store.create_node(
        project_id=project_id,
        user_id=user["id"],
        node_type=payload.node_type,
        content=payload.content,
        position_x=payload.position_x,
        position_y=payload.position_y,
        width=payload.width,
        height=payload.height,
    )


@router.get("", response_model=CanvasNodeListResponse)
def list_nodes(project_id: str, user=Depends(current_user)):
    """获取项目的节点列表"""
    _verify_project_ownership(project_id, user["id"])
    items = store.list_nodes(project_id, user["id"])
    return {"items": items, "total": len(items)}


@router.get("/{node_id}", response_model=CanvasNodeResponse)
def get_node(project_id: str, node_id: str, user=Depends(current_user)):
    """获取节点详情"""
    _verify_project_ownership(project_id, user["id"])
    node = store.get_node(node_id)
    if node is None or node.get("project_id") != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return node


@router.put("/{node_id}", response_model=CanvasNodeResponse)
def update_node(project_id: str, node_id: str, payload: CanvasNodeUpdateRequest, user=Depends(current_user)):
    """更新节点"""
    _verify_project_ownership(project_id, user["id"])
    node = store.get_node(node_id)
    if node is None or node.get("project_id") != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return store.update_node(node_id, user["id"], **payload.model_dump(exclude_none=True))


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(project_id: str, node_id: str, user=Depends(current_user)):
    """删除节点"""
    _verify_project_ownership(project_id, user["id"])
    node = store.get_node(node_id)
    if node is None or node.get("project_id") != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    deleted = store.delete_node(node_id, user["id"])
    if deleted is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

### 步骤 5：挂载路由

在 `backend/api/router.py` 中：
```python
from api import admin, assets, auth, canvas_nodes, health, projects
...
app.include_router(canvas_nodes.router)
```

### 步骤 6：注册模型

在 `backend/models/__init__.py` 中添加 CanvasNode 导入和导出。

### 步骤 7：创建测试

在 `backend/tests/test_canvas_node_crud.py` 中覆盖：

1. **test_create_node** — 创建节点
2. **test_list_nodes** — 列出项目节点（按 position_x 排序）
3. **test_get_node** — 获取节点详情
4. **test_update_node** — 更新节点内容/位置
5. **test_delete_node** — 删除节点
6. **test_create_node_wrong_project** — 在错误项目中创建节点返回 403
7. **test_get_node_wrong_project** — 获取不属于当前项目的节点返回 403
8. **test_node_persistence** — 验证 SQLite 持久化

### 步骤 8：编译和测试
- `cd backend && python -m compileall .`
- `cd backend && python tests/test_canvas_node_crud.py`

### 注意事项
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 参考 `backend/tests/test_project_crud.py` 的测试结构
- 不要修改任何现有业务逻辑，只新增模块
- 确保用户只能操作自己项目下的节点
- 参考 T1-006 的代码风格（MappedColumn、ForeignKey、utc_now 工具函数等）
