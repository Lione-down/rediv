# 审查记录格式

## 记录文件命名

```
REVIEW-{TaskID}-{YYYY-MM-DD}.md
```

示例：`REVIEW-T1-001-2026-06-18.md`

## 审查报告模板

```markdown
# Review: {任务标题}

## Task ID
T{Phase}-{Seq}

## Report Reference
ai/reports/REPORT-{TaskID}-...md

## 审查结果
✅ 通过（无需修改）
⚠️ 通过但有建议（可合并）
❌ 打回（必须修改）

## 评分
X / 5 分

## 审查详情

### 报告审查
- [ ] 报告完整性
- [ ] Acceptance Criteria 对照准确性

### 代码审查
- [ ] Scope 合规性（未越权修改）
- [ ] 技术栈合规性
- [ ] 架构一致性
- [ ] 代码规范
- [ ] 安全隐患

### 功能验证
- [ ] 可运行性
- [ ] 冒烟测试/构建验证
- [ ] 视觉一致性（如适用）

## 发现的问题

| # | 严重度 | 描述 | 文件 |
|---|--------|------|------|
| 1 | Critical/Major/Minor | ... | path/to/file |

## 审查结论

### ✅ 通过
任务完成质量达标，可进入下一阶段。

### ❌ 打回
打回原因：
修复要求：
- 问题 1 必须修复
- 问题 2 必须修复

## 审查者
Project Master Controller (QA Lead)

## 审查时间
YYYY-MM-DD HH:MM
```

## 严重度定义

| 级别 | 含义 |
|------|------|
| Critical | 功能性故障、安全隐患、架构违规 |
| Major | 功能不完整、代码质量差、需返工 |
| Minor | 小问题、可优化但不阻塞 |

---

*维护者：Project Master Controller (QA Lead)*
*最后更新：2026-06-18*
