🎨 Infinite Canvas SaaS — UI Wireframe（开发级）
🧭 一、整体布局（核心）
🖥️ 主页面结构（Canvas Editor）
┌──────────────────────────────────────────────────────────────┐
│ TOP BAR                                                     │
│ project name | save | undo | redo | user | admin入口        │
└──────────────────────────────────────────────────────────────┘
│                                                              │
│  LEFT TOOLBAR        CANVAS AREA               RIGHT PANEL   │
│ ┌──────────────┐   ┌──────────────────────┐  ┌────────────┐ │
│ │ + Text       │   │                      │  │ Assets     │ │
│ │ + Image      │   │   Infinite Canvas    │  │ Templates  │ │
│ │ Select Tool  │   │                      │  │ Node Props │ │
│ │ Hand Tool    │   │   nodes + drag       │  │ Inspector  │ │
│ └──────────────┘   │                      │  └────────────┘ │
│                    │                      │                  │
│                    └──────────────────────┘                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
🧠 二、区域功能定义
1️⃣ TOP BAR（全局控制区）
📌 功能
项目名称显示
保存按钮
undo / redo（后期）
用户菜单
admin入口（仅admin可见）
🧠 交互逻辑
[项目名] → 可点击重命名
[Save] → 手动保存当前canvas
[user] → dropdown
[admin] → 仅admin可见入口
2️⃣ LEFT TOOLBAR（工具栏）
📌 功能
工具列表：
✏️ Text Tool
🖼 Image Tool
🖱 Select Tool
✋ Hand Tool（拖动画布）
🧠 交互逻辑
点击工具 → 改变 canvas mode
Mode状态：
select_mode
hand_mode
text_mode
image_mode
📌 行为规则
select → 选中节点
hand → 拖动画布
text → 点击创建文本节点
image → 从asset拖入
3️⃣ CANVAS AREA（核心区域）
📌 功能
核心能力：
无限画布（无限平面）
zoom in / zoom out
pan拖动
node渲染
🧠 Canvas交互模型
🎯 基础交互
Mouse Wheel → Zoom
Space + Drag → Pan
Drag Node → Move
Click Node → Select
Double Click → Edit
📌 Node视觉结构
Text Node
┌──────────────┐
│ Hello World   │
└──────────────┘
Image Node
┌──────────────┐
│   image       │
│   preview     │
└──────────────┘
📌 Node状态
normal
selected
editing
dragging
4️⃣ RIGHT PANEL（信息面板）
📌 Tabs结构
[ Assets ] [ Templates ] [ Properties ]
📁 4.1 Assets Panel
功能
图片上传
asset列表
拖入canvas
UI结构
Assets
──────────────
[ Upload Button ]

[ img1 ]
[ img2 ]
[ img3 ]
交互
drag asset → canvas → create image node
📦 4.2 Templates Panel
功能
模板列表
一键应用模板
UI
Templates
──────────────
Storyboard
UI Layout
Brainstorm
行为
click template → create nodes on canvas
🧾 4.3 Properties Panel（节点属性）
功能

选中 node 后显示：

Text Node：
Text:
[ editable input ]

Font size:
[ slider ]

Color:
[ picker ]
Image Node：
Image URL
Width / Height
Delete button
🧭 三、交互模式（非常关键）
🎯 Canvas Mode 状态机
select_mode
hand_mode
text_mode
image_mode
🧠 行为规则
Mode	行为
select	选中/拖动node
hand	拖动画布
text	点击创建文本
image	拖入图片
🧠 四、UI状态结构（给Codex用）
Zustand UI Store
uiState = {
  selectedNodeId: null,
  mode: "select",
  rightPanelTab: "assets",
  isDragging: false,
  zoom: 1,
  camera: { x: 0, y: 0 }
}
🧱 五、Canvas数据结构（关键）
node = {
  id,
  type: "text" | "image",
  x,
  y,
  width,
  height,
  data: {
    text?,
    imageUrl?
  }
}
🚨 六、必须遵守的UI原则（非常重要）
❗1. Canvas优先

所有UI服务 canvas，不要反过来

❗2. 右侧面板不抢主视觉

canvas永远最大

❗3. 工具栏永远轻量

不能超过5个工具

❗4. 不要弹窗系统复杂化

尽量 inline editing

🚀 七、最终UI总结（一句话）

一个“类似 Figma 的简化版无限画布 + 右侧资产系统 + 左侧工具栏”的个人创作空间

🧭 八、你下一步应该做什么（关键）

现在你可以进入真正开发阶段了，顺序是：

✅ Step 1（建议）

👉 把这个UI结构交给 Codex：

“请按照这个UI结构实现Canvas前端基础框架”

✅ Step 2

实现：

canvas
toolbar
node渲染
✅ Step 3

再接：

API
assets
templates