# Task: Agnes 文本生成接入（脚本/prompt/分镜）

## Task ID
T3-004

## Phase
Phase 3

## Objective
在后端实现 Agnes 文本生成 API 接口，支持从选中节点内容生成脚本/prompt/分镜，并保存为 prompt 类型资产。

## Scope
- 新增文件：`backend/api/text_generate.py` — 文本生成路由
- 修改文件：`backend/api/router.py` — 注册新路由
- 不涉及：前端代码修改

## Constraints
- 基于已有 `AgnesProvider.chat()` 方法实现
- 使用 `agnes-2.0-flash` 模型
- 扣减用户 text_quota 额度，失败返还
- 生成结果保存为 prompt 类型 asset（source="generation"）
- 单任务 ≤ 4 小时工作量
- 只涉及 backend 模块

## Acceptance Criteria
- [ ] 后端提供 POST `/api/text-generate` 接口，接收 project_id、node_id、prompt 参数
- [ ] 调用 AgnesProvider.chat(model="agnes-2.0-flash") 生成文本
- [ ] 成功后自动保存为 prompt 类型 asset
- [ ] 扣减用户 text_quota 额度，失败时返还
- [ ] 前端 `npm run build` 不受影响
- [ ] 后端冒烟测试通过

## Deliverables
- `backend/api/text_generate.py`
- `ai/reports/REPORT-T3-004.md`

## Codex Prompt
你是一个 Revid 项目的 Codex Executor。请执行以下任务：

### 任务背景
Revid 是一个 AI 驱动的短视频创作平台。T3-001~T3-003 已完成画布交互能力。现在需要接入 Agnes 文本生成能力，让用户可以从画布节点内容生成脚本/prompt/分镜。

### 后端已有基础设施
1. `backend/core/agnes_provider.py` — AgnesProvider 类，已有 `chat(model, messages)` 方法
2. `backend/main.py` — 全局 `_agnes` 单例，通过 `get_agnes()` 函数获取
3. `backend/controllers/store.py` — store 对象，已有 `create_asset()` 和 `grant_quota()` 方法
4. `backend/api/auth.py` — 用户认证依赖 `current_user`

### 实现要求
1. 创建 `backend/api/text_generate.py`：
   - POST `/api/text-generate` 接口
   - 接收 JSON body：`{ "project_id": str, "node_id": str, "prompt": str }`
   - 使用 `Depends(current_user)` 认证
   - 调用 `get_agnes().chat(model="agnes-2.0-flash", messages=[{"role":"user","content":prompt}])`
   - 从响应中提取 `choices[0].message.content` 作为生成结果
   - 使用 `store.create_asset()` 保存为 prompt 类型 asset（source="generation", source_model="agnes-2.0-flash"）
   - 使用 `store.grant_quota(user_id, "text", -1, "text_generate", None)` 扣减1个额度
   - 如果 Agnes 调用失败，不扣额度，返回 500 错误
   - 如果 asset 保存失败，返还额度

2. 修改 `backend/api/router.py`：
   - 导入 text_generate 模块
   - 注册路由 `app.include_router(text_generate.router)`

### 注意事项
- 参考 `backend/api/assets.py` 的代码风格和认证模式
- 额度扣减使用 `grant_quota` 传入负数（与现有 grant_quota 实现一致）
- 错误处理要完善，确保额度一致性
