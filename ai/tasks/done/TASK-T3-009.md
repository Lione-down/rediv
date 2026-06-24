# Task: Agnes 多模态模型端到端测试

## Task ID
T3-009

## Phase
Phase 3

## Objective
编写并运行后端端到端集成测试，验证完整业务流程：微信登录 → 创建项目 → 画布节点创建 → Agnes 文本生成 → 资产保存，确保各模块串联后可正常工作。

## Scope
- 新增文件：`backend/tests/test_e2e_workflow.py` — 端到端集成测试
- 不涉及：前端代码修改
- 不涉及：数据库 schema 变更
- 不涉及：生产环境部署

## Constraints
- 只涉及 backend 测试模块，不修改任何业务代码
- 使用 `fastapi.testclient.TestClient` 进行集成测试
- 使用临时 SQLite 数据库（内存或 temp 文件）
- 测试流程：注册/登录 → 创建项目 → 创建画布节点 → 调用 Agnes 文本生成 → 验证资产入库
- 如果 Agnes API 不可用（无 API key 或网络不通），使用 mock 模拟
- 单任务 ≤ 4 小时工作量
- 不涉及 frontend 代码

## Acceptance Criteria
- [ ] 端到端测试覆盖完整流程：微信登录 → 创建项目 → 创建画布节点 → Agnes 文本生成 → 资产验证
- [ ] 测试使用临时 SQLite 数据库，不污染现有数据
- [ ] Agnes API 调用使用 mock 模拟（不依赖真实网络）
- [ ] 所有测试用例通过（`python -m unittest backend.tests.test_e2e_workflow`）
- [ ] `python -m compileall backend/tests/test_e2e_workflow.py` 编译通过
- [ ] 测试报告包含每个步骤的断言结果

## Deliverables
- `backend/tests/test_e2e_workflow.py`（新增端到端集成测试）
- `ai/reports/REPORT-T3-009.md`

## Codex Prompt
请编写后端端到端集成测试，验证完整业务流程可串联运行。

测试流程如下：
1. 初始化临时 SQLite 数据库（使用 tempfile）
2. 配置 store 为 DatabaseStore
3. 注册模式设为 open
4. 使用微信 mock 登录创建一个新用户
5. 使用该用户 token 创建一个项目
6. 在该项目中创建一个画布节点
7. 调用 Agnes 文本生成接口（使用 mock 模拟 Agnes API 调用）
8. 验证生成的资产已入库
9. 验证用户额度已正确扣减

技术要求：
- 使用 `fastapi.testclient.TestClient`
- 使用 `unittest` 框架
- Agnes API 调用使用 `@patch` mock
- 临时数据库在每个测试用例的 setUp/tearDown 中管理
- 测试类继承 `unittest.TestCase`

参考文件：
- `backend/main.py` — FastAPI app 实例
- `backend/tests/test_wechat_callback.py` — 已有测试写法参考
- `backend/tests/test_text_generate.py` — Agnes 文本生成的测试参考
- `backend/api/auth.py` — 微信登录接口
- `backend/api/projects.py` — 项目接口
- `backend/api/canvas_nodes.py` — 画布节点接口
- `backend/api/text_generate.py` — Agnes 文本生成接口
- `backend/api/assets.py` — 资产接口
