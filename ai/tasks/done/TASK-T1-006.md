# Task: 项目 CRUD

## Task ID
T1-006

## Phase
Phase 1

## Objective
实现用户画布项目管理系统，满足 xq/02_project_system.md 定义的需求：一个用户可以拥有多个画布项目，支持创建、列表、详情查询。

## Scope

### 新增的文件
- `backend/models/project.py` — SQLAlchemy 模型
- `backend/schemas/project.py` — Pydantic schemas
- `backend/api/projects.py` — FastAPI 路由

### 修改的文件
- `backend/controllers/store.py` — 在 InMemoryStore 和 DatabaseStore 中添加项目 CRUD 方法
- `backend/api/router.py` — 挂载 projects 路由
- `backend/tests/test_project_crud.py` — 新建端到端测试

### 不涉及的文件
- 前端代码
- 后端其他模块（auth、quota、admin、assets 等不改动）

## Background
当前后端已有用户、身份、资产、额度等完整的数据模型和 API，但缺少项目（Project）这一核心概念。xq/02_project_system.md 定义了项目系统的基础需求，项目是画布和资产的容器。

## Constraints
- 仅涉及后端 Python 代码
- 使用 SQLite 持久化（DatabaseStore）和内存存储（InMemoryStore）双实现
- 所有接口要求正式登录用户权限（`Depends(current_user)`）
- 用户只能操作自己的项目
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 不修改任何现有业务逻辑（仅新增模块）

## Acceptance Criteria
- [ ] `POST /projects` 创建项目，返回 `{id, user_id, name, created_at}`
- [ ] `GET /projects` 获取当前用户的项目列表（按创建时间倒序）
- [ ] `GET /projects/{project_id}` 获取项目详情，用户只能访问自己的项目（非自己的返回 403）
- [ ] `DELETE /projects/{project_id}` 删除项目，用户只能删除自己的项目
- [ ] 项目数据在 SQLite 和内存模式下均可持久化
- [ ] `python -m compileall .` 通过
- [ ] 测试全部通过

## Deliverables
- `backend/models/project.py`（新建）
- `backend/schemas/project.py`（新建）
- `backend/api/projects.py`（新建）
- `backend/controllers/store.py`（增强）
- `backend/api/router.py`（修改）
- `backend/tests/test_project_crud.py`（新建）

## Codex Prompt
你是 Revid 项目的 Codex Executor。

请执行以下任务：

### 步骤 1：创建 SQLAlchemy 模型

在 `backend/models/project.py` 中创建 Project 模型：

```python
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from models.base import Base
from datetime import UTC, datetime

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.now(UTC))
    updated_at = Column(DateTime, nullable=False, default=datetime.now(UTC), onupdate=datetime.now(UTC))

    # 关系（可选，后续资产系统会用到）
    assets = relationship("Asset", back_populates="project", lazy="selectin")
```

### 步骤 2：创建 Pydantic Schemas

在 `backend/schemas/project.py` 中创建：

```python
from pydantic import BaseModel, Field
from typing import Optional

class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: str

class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
```

### 步骤 3：增强 store.py

在 `InMemoryStore` 和 `DatabaseStore` 中添加以下方法：

**InMemoryStore:**
```python
def create_project(self, user_id: str, name: str) -> dict
def list_projects(self, user_id: str) -> list[dict]
def get_project(self, project_id: str) -> dict | None
def delete_project(self, project_id: str, user_id: str) -> dict | None
```

**DatabaseStore:** 同样实现上述方法，使用 SQLAlchemy 操作数据库。

### 步骤 4：创建 API 路由

在 `backend/api/projects.py` 中实现：

```python
from fastapi import APIRouter, Depends, HTTPException, status
from controllers.store import store
from schemas.project import ProjectCreateRequest, ProjectResponse, ProjectListResponse
from api.auth import current_user

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreateRequest, user=Depends(current_user)):
    """创建新项目"""

@router.get("", response_model=ProjectListResponse)
def list_projects(user=Depends(current_user)):
    """获取当前用户的项目列表"""

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, user=Depends(current_user)):
    """获取项目详情，只能访问自己的项目"""

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, user=Depends(current_user)):
    """删除项目，只能删除自己的项目"""
```

### 步骤 5：挂载路由

在 `backend/api/router.py` 中添加：
```python
from api import admin, assets, auth, health, projects
...
app.include_router(projects.router)
```

### 步骤 6：创建测试

在 `backend/tests/test_project_crud.py` 中覆盖：

1. **test_create_project** — 创建项目
2. **test_list_projects** — 列出项目（按创建时间倒序）
3. **test_get_project_own** — 获取自己的项目
4. **test_get_project_other** — 获取他人项目返回 403
5. **test_delete_project_own** — 删除自己的项目
6. **test_delete_project_other** — 删除他人项目返回 403
7. **test_project_persistence** — 验证 SQLite 持久化

### 步骤 7：编译和测试
- `cd backend && python -m compileall .`
- `cd backend && python tests/test_project_crud.py`

### 注意事项
- 测试必须使用 `TemporaryDirectory` 隔离数据库
- 参考 `backend/tests/test_asset_upload.py` 的测试结构
- 不要修改任何现有业务逻辑，只新增模块
- 确保用户只能操作自己的项目
