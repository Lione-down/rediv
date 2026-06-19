# Codex 执行报告格式

## 报告文件命名

```
REPORT-{TaskID}-{YYYY-MM-DD}.md
```

示例：`REPORT-T1-001-2026-06-18.md`

## 报告模板

```markdown
# Report: {任务标题}

## Task ID
T{Phase}-{Seq}

## Status
✅ Completed / ⚠️ Completed with Issues / ❌ Failed

## Execution Summary
简短描述执行过程（做了什么，遇到什么问题）

## Acceptance Criteria 对照

- [ ] 标准 1 → ✅/❌ 说明
- [ ] 标准 2 → ✅/❌ 说明
- [ ] 标准 3 → ✅/❌ 说明

## 修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| path/to/file1.py | MODIFIED | 新增 XXX 功能 |
| path/to/file2.ts | CREATED | 新增页面 |

## 自测结果

### 后端
- [ ] 可启动（uvicorn ...）
- [ ] 冒烟测试通过

### 前端
- [ ] 构建通过（npm run build）
- [ ] 路由正常

### 其他
- [ ] 自测命令输出

## 风险与待对齐项
- 风险 1
- 待对齐 1

## 遗留问题
- 如有，列出未完成或需后续处理的问题
```

## 报告要求

1. 必须诚实评估——完成就写完成，有问题就写问题
2. 不能伪造测试结果
3. 所有 acceptance criteria 必须逐项标注通过/失败
4. 报告是 PM 审查的唯一依据，必须准确完整

---

*维护者：Project Master Controller (QA Lead)*
*最后更新：2026-06-18*
