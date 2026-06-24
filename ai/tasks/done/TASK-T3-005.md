# Task: Agnes 图片生成接入（文生图/图生图）

## Task ID
T3-005

## Phase
Phase 3

## Objective
在后端实现 Agnes 图片生成 API 接口，支持文生图和图生图，生成结果保存为 image 类型资产。

## Scope
- 新增文件：`backend/api/image_generate.py` — 图片生成路由
- 修改文件：`backend/api/router.py` — 注册新路由
- 不涉及：前端代码修改

## Constraints
- 基于已有 `AgnesProvider.generate_image()` 方法实现
- 使用 `agnes-image-2.1-flash` 模型
- 扣减用户 image_quota 额度，失败返还
- 生成结果保存为 image 类型 asset（source="generation"）
- 单任务 ≤ 4 小时工作量
- 只涉及 backend 模块

## Acceptance Criteria
- [ ] 后端提供 POST `/api/image-generate` 接口，接收 prompt、image_ids（可选）参数
- [ ] 调用 AgnesProvider.generate_image(model="agnes-image-2.1-flash") 生成图片
- [ ] 成功后自动保存为 image 类型 asset（含 URL 引用）
- [ ] 扣减用户 image_quota 额度，失败时返还
- [ ] 前端 `npm run build` 不受影响
- [ ] 后端冒烟测试通过

## Deliverables
- `backend/api/image_generate.py`
- `ai/reports/REPORT-T3-005.md`

## Codex Prompt
你是一个 Revid 项目的 Codex Executor。请执行以下任务：

### 任务背景
Revid 是一个 AI 驱动的短视频创作平台。T3-004 已完成文本生成接入。现在需要接入 Agnes 图片生成能力，支持文生图和图生图。

### 后端已有基础设施
1. `backend/core/agnes_provider.py` — AgnesProvider 类，已有 `generate_image(model, prompt, image_ids)` 方法
2. `backend/main.py` — 全局 `_agnes` 单例，通过 `get_agnes()` 函数获取
3. `backend/controllers/store.py` — store 对象，已有 `create_asset()` 和 `grant_quota()` 方法
4. `backend/api/text_generate.py` — 刚刚完成的文本生成路由，可参考其代码风格

### 实现要求
1. 创建 `backend/api/image_generate.py`：
   - POST `/api/image-generate` 接口
   - 接收 JSON body：`{ "prompt": str, "image_ids": Optional[List[str]] = None }`
   - 使用 `Depends(current_user)` 认证
   - 调用 `get_agnes().generate_image(model="agnes-image-2.1-flash", prompt=prompt, image_ids=image_ids)`
   - 从响应中提取图片 URL（假设返回格式为 `{"data": [{"url": "..."}]}`）
   - 使用 `store.create_asset()` 保存为 image 类型 asset（source="generation", source_model="agnes-image-2.1-flash"）
   - 使用 `store.grant_quota(user_id, "image", -1, "image_generate", None)` 扣减1个额度
   - 如果 Agnes 调用失败，不扣额度，返回 500 错误
   - 如果 asset 保存失败，返还额度

2. 修改 `backend/api/router.py`：
   - 导入 image_generate 模块
   - 注册路由 `app.include_router(image_generate.router)`

### 注意事项
- 参考 `backend/api/text_generate.py` 的代码风格和认证模式
- 额度扣减使用 `grant_quota` 传入负数
- 错误处理要完善，确保额度一致性
- image_ids 可选：如果提供，则为图生图；如果不提供，则为文生图
