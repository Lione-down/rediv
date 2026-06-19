# 任务管理 (Tasks)

本目录管理 Revid 项目的开发任务。

## 目录结构

```
ai/tasks/
├── README.md          ← 本文件：任务格式定义
├── todo/              ← 待办任务（每个任务一个 .md 文件）
├── doing/             ← 进行中任务
└── done/              ← 已完成任务
```

## 任务文件命名

```
TASK-{TaskID}.md
```

示例：`TASK-1-001.md`（Phase 1, 第 1 个任务）

## 任务格式

每个任务文件必须包含以下字段：

```markdown
# Task: {标题}

## Task ID
T{Phase}-{Seq}（例：T1-001）

## Phase
Phase 1 / Phase 2 / Phase 3

## Objective
一句话描述任务目标

## Scope
- 修改的文件范围
- 新增的文件范围
- 不涉及的文件范围

## Constraints
- 技术栈约束
- 架构约束
- 规范约束

## Acceptance Criteria
- [ ] 可测试的具体标准 1
- [ ] 可测试的具体标准 2
- [ ] 可测试的具体标准 3

## Deliverables
- 文件清单
- 报告路径

## Codex Prompt
派发给 Codex Executor 的完整执行指令
```

## 任务流转

```
todo/  →  被选中后移入 doing/  →  Codex 执行完毕  →  审查通过后移入 done/
                      ↓ 审查不通过          ↑
                  移回 todo/ (标注原因)
```

## 任务优先级

1. 后端核心流程（认证 → 额度 → 资产）
2. 数据库持久化
3. 前端工程迁移
4. 画布真实化
5. 联调与集成

---

*维护者：Project Master Controller (PM)*
*最后更新：2026-06-18*
