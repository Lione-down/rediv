# TASK-T1-003 开发计划

## 目标

完善后端邀请码注册控制，修复邀请码过期时间比较逻辑，并补齐 `open`、`invite_only`、`closed` 三种注册模式与邀请码边界场景的专项测试。

## 范围

- 更新 `backend/controllers/store.py`
- 复核 `backend/api/auth.py` 的现有注册流程行为
- 新增 `backend/tests/test_invitation_code.py`
- 生成 `ai/reports/REPORT-T1-003.md`

## 实施步骤

1. 阅读任务、状态文档、需求设计和后端现有实现，确认邀请码与注册模式的既有规则。
2. 修复 `use_invitation_code` 的过期时间判断，改为 `datetime` 对象比较，保持其余业务逻辑不扩散。
3. 为 `DatabaseStore` 和认证流程新增专项测试，覆盖：
   - `open` 模式忽略邀请码
   - `invite_only` 模式下缺失、无效、过期、用尽的邀请码拒绝注册
   - `closed` 模式拒绝新用户注册
4. 运行后端检查与测试命令，记录结果并生成报告。

## 验收标准

- `use_invitation_code` 不再依赖字符串比较判断过期
- `backend/tests/test_invitation_code.py` 覆盖任务要求的主要场景
- `cd backend && python -m compileall .` 通过
- `cd backend && python tests/test_invitation_code.py` 通过
