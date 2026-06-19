# Agnes Provider 集成说明

## 1. 架构

```
backend/
├── main.py                 # FastAPI 入口，创建 AgnesProvider 单例
├── settings/
│   └── config.py           # Settings 包含 Agnes 配置
├── core/
│   └── agnes_provider.py   # Agnes AI 多模态模型统一入口
└── api/
    └── routers/
        ├── text.py         # 文本生成 / 图片理解 / 工具调用
        ├── image.py        # 文生图 / 图生图
        └── video.py        # 文生视频 / 图生视频 / 多图视频
```

## 2. 模型映射

| Revid 用途 | Agnes 模型 | Endpoint |
|-----------|-----------|----------|
| 脚本/Prompt/分镜生成 | `agnes-2.0-flash` | `/v1/chat/completions` |
| 封面/角色/场景素材 | `agnes-image-2.1-flash` | `/v1/images/generations` |
| 视频生成 | `agnes-video-v2.0` | `/v1/videos` (异步) |

## 3. 使用方式

在 Router 中注入：

```python
from main import get_agnes

@router.post("/generate")
async def generate_text(prompt: str):
    agnes = get_agnes()
    result = await agnes.chat(
        model=settings.agnes_model_text,
        messages=[{"role": "user", "content": prompt}],
    )
    return {"content": result["choices"][0]["message"]["content"]}
```

## 4. 视频任务流程

```
1. POST /v1/videos → 返回 {task_id, video_id}
2. 轮询 GET /agnesapi?video_id=xxx (每 5s)
3. status="completed" → 取 video_url
4. status="failed" → 返还额度
```

## 5. Mock 模式

开发阶段，Agnes Provider 可降级为 Mock：
- 文本：返回预设回复
- 图片：返回随机占位图 URL
- 视频：模拟异步任务，3s 后返回完成

```python
# settings.config
wechat_mock_enabled: bool = True  # 控制 Mock 开关

# 未来可扩展：
agnes_mock_enabled: bool = True  # 控制 Agnes Mock
```

## 6. 额度扣减时机

| 操作 | 扣减时机 | 返还条件 |
|------|---------|---------|
| 文本生成 | 请求发出前预扣 | 超时/失败 |
| 图片生成 | 请求发出前预扣 | 超时/失败 |
| 视频生成 | 任务创建前预扣 | 任务失败/超时 |

## 7. 待实现

- [ ] 创建 `api/routers/text.py` — 文本生成接口
- [ ] 创建 `api/routers/image.py` — 图片生成接口
- [ ] 创建 `api/routers/video.py` — 视频生成接口
- [ ] 实现额度预扣和返还逻辑
- [ ] 实现 Mock Provider 降级
- [ ] 实现视频任务轮询中间件
- [ ] 实现 Agnes 回调通知（可选）
