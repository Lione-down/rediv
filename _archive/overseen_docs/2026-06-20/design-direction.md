# Revid UI 基调设计方案

## 1. 设计结论

Revid 的 UI 基调定为：安静的创作工作台，带一点媒体资产管理工具的精密感。界面不做夸张的 AI 科技感，不使用紫蓝渐变、玻璃拟态和大面积营销式 hero，而是让画布、资产、生成任务成为第一视觉中心。

视觉关键词：

- Creative utility：创作工具优先，所有装饰都服务于画布操作。
- Soft precision：边界清楚、层级安静、反馈精确。
- Media-first：图片、视频、prompt 和生成结果本身比 UI 更抢眼。

## 2. 同类产品参考

### Figma

Figma 的主界面把顶栏、工具栏和属性面板压到最轻，核心空间让给画布。Revid 应学习它的空间优先级，但不要复制专业设计工具的复杂控件密度。

### Miro

Miro 的无限画布更偏协作和白板，视觉更轻松。Revid 可以参考它的节点拖拽和空白画布亲和力，但 Revid 第一版不做多人协作和复杂模板市场。

### Runway

Runway 的强项是媒体资产和生成任务的可视化管理。Revid 应参考它的媒体预览优先级，让生成结果、任务状态和素材复用在界面中更直接。

## 3. 三行方向锁定

- Visual thesis：低噪声浅色工作台，米白画布底、墨色文字、青绿生成态强调，像创作者桌面而不是企业后台。
- Content plan：工作台只做三件事，定位当前项目、展示最大画布、让用户快速调用资产和生成能力。
- Interaction thesis：按钮按下轻微缩放，节点选中有清晰描边和阴影，生成任务用短促淡入和进度态表达，不做弹跳动画。

## 4. 色彩系统

使用 OKLCH 作为设计 token 表达方式，前端可先落为 CSS variables。

| Token | Value | 用途 |
| --- | --- | --- |
| `--bg-app` | `oklch(96% 0.008 92)` | 应用最外层背景，轻微暖色 |
| `--bg-canvas` | `oklch(98% 0.006 92)` | 画布底色 |
| `--bg-panel` | `oklch(100% 0.004 92)` | 顶栏、侧栏、右侧面板 |
| `--bg-panel-subtle` | `oklch(94% 0.007 92)` | 二级面板、输入背景 |
| `--text-primary` | `oklch(18% 0.014 245)` | 主文本 |
| `--text-secondary` | `oklch(46% 0.018 245)` | 辅助文本、说明 |
| `--text-muted` | `oklch(62% 0.014 245)` | 弱提示 |
| `--border-subtle` | `oklch(88% 0.009 92)` | 面板分隔线 |
| `--border-strong` | `oklch(76% 0.014 92)` | 节点和控件边界 |
| `--accent-generate` | `oklch(62% 0.105 175)` | 生成、运行、主要动作 |
| `--accent-generate-hover` | `oklch(55% 0.12 175)` | 主要动作 hover |
| `--accent-select` | `oklch(58% 0.115 252)` | 节点选中、焦点态 |
| `--warning` | `oklch(70% 0.13 78)` | 额度不足、等待确认 |
| `--danger` | `oklch(58% 0.17 27)` | 删除、冻结、失败 |
| `--success` | `oklch(60% 0.12 150)` | 保存成功、任务完成 |

色彩比例：

- 60%：暖浅背景和画布。
- 30%：面板、分隔线、文本层级。
- 10%：青绿生成态、蓝色选择态和状态色。

## 5. 字体与排版

品牌词：清晰、克制、可复用。

排除的反射字体：Inter、Space Grotesk、IBM Plex Sans。

推荐字体栈：

```css
font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
```

选择理由：Geist 比 Inter 更有工程工具气质，但不喧宾夺主；中文 fallback 使用系统 CJK 字体，保证中文界面稳定。

字号规则：

| 场景 | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- |
| 页面级标题 | 24px | 650 | 1.2 | -0.012em，仅英文 |
| 面板标题 | 15px | 600 | 1.4 | 0 |
| 正文和控件 | 14px | 450 | 1.6 | 0 |
| 辅助信息 | 12px | 450 | 1.45 | 0 |
| 数字和额度 | 13px | 520 | 1.4 | 0，启用 tabular nums |

中文界面不对汉字使用负字距。长段说明行高保持 1.7，控件文本保持紧凑。

## 6. 布局原则

主界面采用 app shell：

- 顶栏高度：52px。
- 左侧工具栏宽度：56px，最多 5 个主工具。
- 右侧面板宽度：320px，最小 280px，最大 360px。
- 画布区域永远占据剩余最大空间。
- 移动端优先保留画布，右侧面板折叠为底部抽屉，左侧工具栏变为底部工具条。

 spacing scale：

| Token | Value | 用途 |
| --- | --- | --- |
| `--space-1` | 4px | 图标微调、紧密间距 |
| `--space-2` | 8px | 控件内部间距 |
| `--space-3` | 12px | 表单、面板行间距 |
| `--space-4` | 16px | 面板 padding |
| `--space-6` | 24px | 页面级留白 |
| `--space-8` | 32px | 空状态、分组间距 |

半径系统：

| Token | Value | 用途 |
| --- | --- | --- |
| `--radius-xs` | 4px | 小型标签、输入内部 |
| `--radius-sm` | 6px | 按钮、工具项 |
| `--radius-md` | 8px | 节点、资产缩略图 |
| `--radius-lg` | 12px | 抽屉、浮动面板 |
| `--radius-pill` | 999px | 用户头像、状态胶囊 |

## 7. 组件风格

### 顶栏

- 背景使用 `--bg-panel`，底部 1px `--border-subtle`。
- 项目名左侧对齐，可点击重命名。
- 保存状态靠近项目名展示，使用弱文本加状态点，不使用弹窗。
- Admin 入口仅 admin 可见，视觉权重低于创作动作。

### 左侧工具栏

- 图标按钮 40px 命中区域，视觉图标 20px。
- active 状态使用 `--accent-select` 的浅色背景和深色图标。
- 工具不超过 5 个：select、hand、text、image、generate。
- 每个 icon-only button 必须有 `aria-label` 和 tooltip。

### 画布

- 画布底色接近白，但带微暖色，避免纯白刺眼。
- 可使用极淡点阵网格：`oklch(88% 0.006 92 / 0.45)`，缩放时不抢节点。
- 选中节点使用 2px `--accent-select` 描边，加轻阴影。
- 拖拽状态只改变阴影和透明度，不改变节点尺寸。

### 节点

- Text node：白底，8px 半径，边界清楚，编辑态使用内联输入。
- Image node：媒体预览优先，底部只保留名称、来源和状态。
- Video node：预留时间长度、封面和播放按钮，不做复杂时间线。
- Generation node：强调输入、模型、状态和输出，不做聊天气泡样式。

### 右侧面板

- Tabs 使用下划线或浅背景，不使用大 pill tab。
- Asset 列表以缩略图网格为主，prompt 资产使用紧凑文本块。
- Properties 只显示选中节点相关字段，避免空表单占满面板。
- 删除、冻结等危险操作放在面板底部，使用明确文案和二次确认。

### 按钮

- 主按钮：青绿色实底，6px radius，hover 降低 lightness，active `scale(0.96)`。
- 次按钮：浅背景加文本，不使用重边框。
- 危险按钮：默认弱化，hover 后才提升危险色存在感。
- 所有按钮不使用感叹号文案，例如使用“保存完成”，不用“保存成功!”。

## 8. 动效规则

- 常规 hover：120ms，属性限定为 color、background-color、box-shadow、transform。
- 按下反馈：`transform: scale(0.96)`，120ms。
- 面板切换：opacity 0 到 1，translateY(4px) 到 0，160ms。
- 节点创建：opacity 0 到 1，scale 0.98 到 1，180ms。
- 生成任务完成：状态点和结果区域淡入，不使用弹跳。
- 遵守 `prefers-reduced-motion`，减少非必要动效。

## 9. 响应式行为

### 桌面端

- 顶栏、左工具栏、右面板常驻。
- 画布是主舞台，右侧面板不得超过 360px。
- 资产面板支持两列缩略图，prompt 资产单列。

### 平板端

- 右侧面板可折叠，默认打开最近使用 tab。
- 左工具栏保持窄列。
- 顶栏隐藏低频入口，只保留项目名、保存状态、用户入口。

### 手机端

- 顶栏压缩为项目名和保存状态。
- 工具栏改为底部 5 项。
- 右侧面板改为底部抽屉，高度 60% 以内。
- 节点编辑尽量 inline，不用全屏弹窗，除非输入长 prompt。

## 10. Do 和 Don't

Do：

- 让画布永远最大。
- 让媒体缩略图和生成结果成为视觉锚点。
- 用状态点、进度条和内联提示表达任务状态。
- 保持工具栏克制，优先图标加 tooltip。
- 用背景层级和轻阴影区分面板，不堆叠卡片。

Don't：

- 不使用紫蓝 AI 渐变。
- 不做玻璃拟态和大面积 blur。
- 不把首页做成营销 landing。
- 不用三张卡片介绍功能。
- 不用弹窗承载普通编辑动作。
- 不让右侧面板抢过画布。

## 11. 首屏信息结构

第一屏就是 Canvas Editor，不做独立 landing：

1. 顶栏：项目名、保存状态、额度入口、用户入口。
2. 左栏：5 个以内核心工具。
3. 中央：无限画布、节点、生成结果。
4. 右栏：Assets、Templates、Properties 三个工作 tab。
5. 空画布状态：给出 3 个可执行起点，创建 prompt、上传素材、使用生成节点。

## 12. 后续前端实现提示

建议 CSS 策略：CSS variables + CSS Modules。若后续使用 Vue，则样式放在 `src/assets/styles/variables.scss` 和组件局部 `<style module>` 中，避免 Tailwind、CSS Modules 和 CSS-in-JS 混用。

可直接用于后续 Codex 实现的 prompt：

1. 按 `ui/design-direction.md` 的 tokens 创建 Revid Canvas Editor app shell，顶栏 52px、左栏 56px、右栏 320px，画布占满剩余区域，使用 CSS variables 和 CSS Modules。
2. 创建左侧工具栏组件，包含 select、hand、text、image、generate 五个 icon-only buttons，每个按钮 40px 命中区域、6px radius、active 使用 `--accent-select` 浅背景，并提供 `aria-label`。
3. 创建画布节点样式，Text node 和 Image node 使用 8px radius、白底、轻阴影，selected 状态使用 2px `--accent-select` 描边，dragging 状态只改变 opacity 和 shadow。
4. 创建右侧资产面板，Tabs 为 Assets、Templates、Properties，资产缩略图用两列网格，危险操作固定在面板底部并使用弱化危险按钮。

## 13. 当前完成记录

- 已基于产品需求、现有 UI wireframe 和设计技能规则确定 UI 基调。
- 已明确同类参考、视觉 thesis、tokens、组件风格、响应式规则和后续实现提示。
- 尚未实现前端代码，下一步可按本方案创建 Vue 前端基础框架。
