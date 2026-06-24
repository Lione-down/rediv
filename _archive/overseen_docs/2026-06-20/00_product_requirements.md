# Revid 产品需求总览

# Revid 产品定位

Revid 是一个面向 AI 内容创作者的多模态无限画布创作工作台（AI Creator Workspace）。

用户可以在无限画布中组织 Prompt、图片、视频和生成结果，通过 Agnes 多模态模型完成创作，并将创作过程持续沉淀为可复用的个人资产。

Revid 的核心价值由三部分共同构成：

* 无限画布（创作空间）
* AI 生成能力（创作引擎）
* 个人资产库（价值沉淀）

三者缺一不可。

第一版目标不是打造复杂剪辑器、工作流编排器或模型聚合平台，而是验证用户是否愿意持续使用：

灵感 → 创作 → 资产沉淀 → 复用 → 持续创作

这一完整创作闭环。


# Revid 产品最高设计原则

Revid 不是：

* 白板工具
* 工作流编排器
* AI 模型聚合器
* 专业设计工具

Revid 是：

AI Creator Workspace（AI 创作者工作台）

无限画布不是传统白板。

无限画布是用户的创作空间。

用户在其中组织想法、管理素材、调用 AI 能力、沉淀创作资产，并持续完成创作迭代。

Revid 的核心价值由：

* 无限画布
* AI 生成能力
* 个人资产库

共同构成。

所有设计决策必须服务于：

灵感 → 创作 → 资产沉淀 → 复用 → 持续创作

如果某个功能无法增强上述链路，则不应进入 MVP。



---

## 第一版目标用户

- 经常尝试 AI 图片、AI 视频、社媒素材、梗图、短内容的普通创作者。
- 对主流 AI 视频平台 credits 消耗快、费用高、试错浪费敏感。
- 不要求企业协作、专业剪辑和复杂商业授权流程。

---

## 核心模块

### 1. 用户与注册

- 第一版使用微信扫码登录自动注册。
- 不做 SMS、email、用户名密码注册和找回密码。
- 支持游客模式：游客可进入画布体验，但不能保存个人资产、导出视频或领取正式额度。
- 测试期可启用邀请码注册，控制免费额度消耗。

### 2. 无限画布

- 使用 Leafer UI 作为画布引擎。
- 支持文本节点、图片节点、视频节点、生成节点、资产引用节点。
- 画布用于组织创作流程，不在第一版追求复杂 Figma 级编辑能力。

### 3. Agnes 多模态模型

- `Agnes-2.0-Flash`：生成脚本、prompt、分镜、标题和描述。
- `Agnes Image 2.1 Flash`：文生图、图生图、封面、角色和场景素材。
- `Agnes-Video-V2.0`：文生视频、图生视频、多图视频、关键帧视频。
- 开发阶段保留 mock provider，避免第三方模型或微信审核阻塞主流程开发。

### 4. 个人资产库

- 保存用户上传资产和模型生成资产。
- 资产类型包括 prompt、图片、视频。
- 资产记录来源模型、来源任务、所属项目和画布节点。
- 用户可从资产库拖回画布复用。

### 5. 免费额度系统

- 后台配置默认额度。
- 用户注册成功后自动发放默认额度。
- Admin 可针对用户派发额外额度。
- 额度按模型类型拆分：text、image、video。
- 所有额度变化必须有流水记录。

### 6. 内部 Admin 后台

- Admin 后台永远不对外开放。
- 管理用户、注册开关、邀请码、额度、资产、生成任务和服务器状态。
- 支持封禁用户、冻结生成权限、查看异常注册和高频调用。

---

### 7. 相关工具的账号密码

- 存放在.env文件中，自行获取后修改.env中真正应该书写的规范
- 如遇到有工具缺失账号密码的情况，再向我索要


## 第一版不做

- SMS 注册。
- email 注册。
- 用户名密码注册。
- 找回密码。
- 小程序登录。
- 公众号关注登录。
- 多 provider 账号合并。
- 多人协作。
- 模板市场。
- 复杂剪辑时间线。
- 自研模型训练。
- 付费充值。

---

# Revid Design System v1.0 产品核心基调
这个是最终要实现的前端样式基调 根据已有的ui去做调整

## Design Philosophy

Revid 不是设计工具，不是白板工具，也不是工作流编排器。

Revid 是面向 AI 创作者的个人创作工作台（AI Creator Workspace）。

视觉设计应遵循：

* 神秘（Mystic）
* 创造（Creative）
* 无限（Infinite）
* 专业（Professional）
* 克制（Minimal）

避免：

* 赛博朋克风
* RGB 霓虹风
* 过度渐变
* 夸张动效
* 复杂拟物设计

目标是营造：

"进入自己的 AI 创作空间" 的感觉。

---

# Brand Color

## Primary Purple

品牌主色：

```css
--color-primary: #7254D6;
```

设计含义：

* 神秘感
* 创作感
* AI 属性
* 长时间使用不刺眼

---

## Primary Scale

```css
--purple-50:  #F4F0FF;
--purple-100: #E8DEFF;
--purple-200: #D4C4FF;
--purple-300: #B89EFF;
--purple-400: #9A7BF0;

--purple-500: #7254D6;

--purple-600: #6347C2;
--purple-700: #553CA7;
--purple-800: #46318B;
--purple-900: #36246F;
```

---

# Semantic Colors

## Success

```css
--success: #2EC58D;
```

用于：

* 生成成功
* 上传成功
* 任务完成

---

## Warning

```css
--warning: #F7B955;
```

用于：

* 额度不足提醒
* 风险提示

---

## Error

```css
--error: #F05D6C;
```

用于：

* 生成失败
* 删除确认
* 系统错误

---

## Info

```css
--info: #4A8BFF;
```

用于：

* 系统消息
* 状态提示

---

# Dark Theme

## Background

应用背景：

```css
--bg-primary: #12131A;
```

---

## Surface

侧边栏、顶部栏：

```css
--bg-surface: #1A1C25;
```

---

## Card

项目卡片、弹窗内容：

```css
--bg-card: #232632;
```

---

## Elevated

悬浮层：

```css
--bg-elevated: #2B2E3B;
```

---

# Border System

## Default

```css
--border-default: rgba(255,255,255,0.08);
```

---

## Hover

```css
--border-hover: rgba(114,84,214,0.45);
```

---

## Active

```css
--border-active: #7254D6;
```

---

# Text System

## Primary

```css
--text-primary: rgba(255,255,255,0.92);
```

---

## Secondary

```css
--text-secondary: rgba(255,255,255,0.65);
```

---

## Tertiary

```css
--text-tertiary: rgba(255,255,255,0.42);
```

---

## Disabled

```css
--text-disabled: rgba(255,255,255,0.28);
```

---

# Canvas Design

## Canvas Background

```css
--canvas-bg: #12131A;
```

---

## Grid Color

```css
--canvas-grid: rgba(255,255,255,0.05);
```

设计目标：

* Miro 风格
* 极弱存在感
* 不干扰创作

---

# Node Design

默认状态：

```css
background: #232632;
border: rgba(255,255,255,0.08);
```

---

Hover：

```css
border: #7254D6;
```

---

Selected：

Prompt Node

```css
border: #7254D6;
```

Image Node

```css
border: #4A8BFF;
```

Video Node

```css
border: #F05D6C;
```

Asset Node

```css
border: #2EC58D;
```

说明：

默认所有节点保持统一风格。

仅在选中状态下展示类型颜色。

避免画布视觉污染。

---

# Shadow System

## Small

```css
0 4px 12px rgba(0,0,0,.25);
```

---

## Medium

```css
0 8px 24px rgba(0,0,0,.32);
```

---

## Large

```css
0 12px 36px rgba(0,0,0,.40);
```

---

# Radius System

统一圆角：

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
```

推荐：

* Button：12px
* Card：16px
* Modal：20px

---

# Design Principle

所有 UI 设计必须遵循：

灵感
→ 创作
→ 资产沉淀
→ 复用
→ 持续创作

如果某个设计无法增强上述链路，则不应进入 MVP。
