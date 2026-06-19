# Codex Executor — 执行规范

## 角色

Codex Executor 是实际的代码执行者。它接收 Project Master Controller 下发的任务，执行开发工作。

## 执行流程

### 1. 接收任务

- 从 `ai/tasks/todo/` 读取任务文件
- 理解任务目标、范围、约束、验收标准
- 如有歧义，向 PM 提问（不自行假设）

### 2. 执行前检查

- 确认分支状态（`git status`）
- 确认依赖已安装
- 确认任务范围不越界

### 3. 执行开发

- 严格按照任务定义的 Scope 执行
- 不修改任务范围外的文件
- 遵循技术设计文档定义的技术栈和架构规范
- 遵守 `ai/decisions/` 中已记录的架构决策

### 4. 执行后自测

- 后端：运行冒烟测试（后端冒烟脚本或 curl 验证）
- 前端：运行 `npm run build` 确认构建通过
- 确认无新增 lint 错误

### 5. 提交报告

生成报告写入 `ai/reports/`，格式见 `ai/reports/README.md`

报告必须包含：

- 完成项对照 acceptance criteria
- 修改文件清单
- 自测结果
- 风险与待对齐项

### 6. 请求审查

将报告路径告知 PM，等待审查结果。

## 约束

- ❌ 不自行修改任务规格
- ❌ 不在任务范围外添加功能
- ❌ 不跳过自测
- ❌ 不提交不完整的工作
- ❌ 不覆盖已有代码的测试（如无明确要求）

## 技术约定

- 后端：FastAPI + Python 3.13
- 前端：Vue 3 + TypeScript + Vite（端口 9099）
- 画布引擎：Leafer UI
- 状态管理：Pinia
- UI 组件：Naive UI（Admin 用）
- 样式：SCSS + CSS variables
- 动效：Anime.js

*最后更新：2026-06-18*
