# Task: 后端 .gitignore 完善 + 后端 README 完善

## Task ID
T1-002

## Phase
Phase 1

## Objective
完善后端 `.gitignore` 排除数据库文件和运行时产物，补充后端 `README.md` 说明项目结构、启动方式和数据库配置。

## Scope

### 修改的文件
- `backend/.gitignore` — 确保排除 `*.db`、`__pycache__/`、`.env`、`revid.db`、IDE 配置等
- `backend/README.md` — 补充/完善后端说明文档

### 不涉及的文件
- 业务代码（`api/`、`controllers/`、`models/`、`schemas/`、`core/`）
- 前端代码
- AI 协作目录文件

## Constraints
- 不修改任何业务代码
- `.gitignore` 规则需与项目根目录 `.gitignore` 协调，避免重复或遗漏
- README 语言为中文，面向开发者

## Acceptance Criteria
- [ ] `backend/.gitignore` 排除所有数据库文件（`*.db`、`*.sqlite`）
- [ ] `backend/.gitignore` 排除 Python 缓存（`__pycache__/`、`*.pyc`）
- [ ] `backend/.gitignore` 排除 `.env` 文件
- [ ] `backend/README.md` 包含：项目简介、技术栈、启动步骤、数据库配置说明、测试命令
- [ ] README 格式规范（Markdown 标题、代码块标注语言）

## Deliverables
- `backend/.gitignore`（更新）
- `backend/README.md`（更新）

## Notes
- 当前 `backend/revid.db` 在 T1-001 执行过程中已生成，且未被 `.gitignore` 排除，属于已知风险
- 后端 README 目前可能只有基础内容，需要补充完整的开发指南
