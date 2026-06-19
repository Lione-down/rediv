# Revid 前端页面开发计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 基于现有 `ui/` 原型和产品文档，把 Revid 的首页、工作流页、个人空间页收敛成一套一致、可预览、可继续迭代的前端页面。

**Architecture:** 本轮继续沿用当前静态原型路线，不引入新的前端框架或重构成大型工程。页面实现优先围绕 `ui/index.html`、`ui/revid-prototype.html`、`ui/revid-space.html` 三个入口收口，统一视觉 token、布局层级、状态语气和移动端规则，再逐步补交互细节。所有能力先以本地静态预览和 mock 数据完成验证，真实后端联调留到后续阶段。

**Tech Stack:** HTML, CSS, Vanilla JS, PowerShell preview script, browser-based QA.

---

## 计划依据

本计划基于以下现有材料整理：

- `ui/design-direction.md`
- `ui/revid-ui-design-plan.md`
- `ui/revid-requirements-status.md`
- `ui/revid-user-flow-draft.md`
- `ui/impeccable-ui-audit-and-polish-plan.md`
- `xq/00_product_requirements.md`
- `xq/09_technical_design.md`
- `xq/10_ui_prototype_plan.md`
- `backend/README.md`

从这些文档里可以确认三件事：

1. 首页不是营销 landing，而是进入工作流的主入口。
2. 工作流页是主舞台，核心是画布、节点、连线、工具栏和底部输入区。
3. 个人空间页要承接资产、历史、结果等管理能力，但不能抢主流程的视觉权重。

---

## 当前上下文与假设

- 当前项目前端形态以 `ui/` 下的静态 HTML 原型为主，不以 Vue / React 工程化重构为前提。
- 现阶段不做真实登录、真实资产存储、真实生成任务联调，只做页面结构、交互与视觉收口。
- 后端 `backend/README.md` 已说明目前以 mock provider、游客 session 和 dev 登录为主，因此前端页面先按 mock / local state 设计即可。
- `pitfalls.md` 里已有规则变更记录要求；如果这次开发过程中再新增规则，需要同步回写。

---

## 目标拆分

### 1. 首页

- 保留一个明确的主入口 CTA。
- 压缩次级内容，避免首页变成信息堆叠页。
- 让“继续上次流程”和“进入工作流”两类动作优先级清楚。
- 保留个人中心、最近项目和少量辅助入口，但不抢主入口。

### 2. 工作流页

- 把画布继续保持为唯一视觉中心。
- 统一节点、连线、右侧面板、底部 dock、提示文案的语气。
- 收紧辅助信息，让用户先看懂流程，再看辅助能力。
- 保持移动端 375px 可用，不横向溢出。

### 3. 个人空间页

- 以管理总览为主，承接资产、历史、结果等模块。
- 与首页、工作流页共用同一套视觉系统。
- 进入后第一眼能看见状态和资源，而不是说明文案。

---

## 开发步骤

### Task 1: 冻结本轮范围并对齐验收标准

**Objective:** 明确本轮只做哪些页面、哪些交互和哪些视觉收口，避免实现时继续扩范围。

**Files:**
- 参考：`ui/revid-ui-design-plan.md`
- 参考：`ui/revid-requirements-status.md`
- 参考：`ui/impeccable-ui-audit-and-polish-plan.md`
- 参考：`xq/00_product_requirements.md`

**Step 1: 复核本轮范围**
- 首页：入口收口、主 CTA 优先级、最近项目和个人中心的层级调整。
- 工作流页：画布主舞台、节点/连线/工具栏/底部区统一收口。
- 个人空间页：资产、历史、结果的管理总览结构。

**Step 2: 统一验收标准**
- 桌面端首屏一眼能看出主入口和主舞台。
- 375px 下不横向溢出。
- 三个页面的按钮、卡片、chip、面板语气一致。
- 所有辅助信息不盖过主任务。

**Step 3: 记录计划关联**
- 后续实现结束时，要把状态同步回 `ui/revid-ui-design-plan.md`、`ui/revid-requirements-status.md`，必要时补 `pitfalls.md`。

---

### Task 2: 统一三页的基础视觉与布局骨架

**Objective:** 让首页、工作流页、个人空间页共享同一套 surface、radius、shadow、spacing、按钮和文字层级。

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/revid-prototype.html`
- Modify: `ui/revid-space.html`
- Modify: `ui/design-direction.md`

**Step 1: 提取统一视觉约束**
- 把 `design-direction.md` 里的 token 思路作为页面实现标准。
- 保持整体偏暗、克制、低噪点，不引入紫色渐变或营销感 hero。

**Step 2: 统一页面壳**
- 三个页面都采用同一套顶栏、面板边界、圆角和阴影语气。
- 首页偏内容入口，工作流页偏画布壳，个人空间页偏管理壳，但视觉母体一致。

**Step 3: 统一基础状态**
- Hover、active、selected、empty、loading、warning 的语气一致。
- 低优先级辅助块统一弱化，不用更重的边框去抢注意力。

**Validation**
- 在同一个浏览器窗口内切换三页时，不会感觉像三个独立项目。
- 视觉上能明显看出它们属于同一产品线。

---

### Task 3: 收敛首页信息架构

**Objective:** 把首页从“内容堆叠页”收敛成“进入工作流的主入口页”。

**Files:**
- Modify: `ui/index.html`
- Reference: `ui/revid-user-flow-draft.md`

**Step 1: 保留主动作**
- 保留一个最明确的主 CTA，文案指向进入工作流。
- 次级动作只保留必要的继续流程、最近项目入口或管理入口。

**Step 2: 压缩非核心内容**
- 把大段说明、重复模块和过多卡片收起来。
- 让最近项目和辅助内容退到更次级的位置，避免首屏竞争。

**Step 3: 统一首页语气**
- 文案尽量短、直接、可执行。
- 主页不做营销话术，不做夸张 hero，不做多入口并列竞争。

**Validation**
- 进入首页后，用户能在 3 秒内知道主要动作是什么。
- 手机端首屏不被次级信息挤满。

---

### Task 4: 收口工作流页为主舞台

**Objective:** 让工作流页的画布、节点、连线、工具栏和底部 dock 形成一个统一的主操作界面。

**Files:**
- Modify: `ui/revid-prototype.html`
- Reference: `ui/revid-requirements-status.md`

**Step 1: 继续压低辅助区存在感**
- 右侧面板、底部 dock、辅助提示只保留必要信息。
- 让 canvas 仍然是视觉绝对中心。

**Step 2: 统一节点与连线语气**
- 节点选中态、连接态、流动高亮、静态实线保持一致规则。
- 继续沿用当前“细线 + 选中时高亮”的方向，不回到重动画、重弹窗方案。

**Step 3: 保持常驻操作可发现**
- 双击添加、右键菜单、拖拽连接、框选、多选汇聚等能力继续保留，但表达要克制。
- 辅助提示和空状态要能帮助理解流程，但不能压过主内容。

**Validation**
- 桌面端一眼看出画布是唯一主角。
- 375px 下工具区不会把主体内容挤碎。
- 连线、节点、右键菜单和底部输入区的交互语气统一。

---

### Task 5: 重整个人空间页的管理总览结构

**Objective:** 把个人空间页做成资源管理总览，而不是说明页或第二首页。

**Files:**
- Modify: `ui/revid-space.html`
- Reference: `ui/impeccable-ui-audit-and-polish-plan.md`

**Step 1: 先显示状态，再显示操作**
- 页面首屏优先展示当前项目状态、资产摘要、最近记录或结果概览。
- 次级功能再展开，不让说明文案过多堆叠。

**Step 2: 统一模块气质**
- 资产、历史、结果、设置等模块使用同一套卡片和面板语言。
- 模块之间通过 spacing 和层级分区，而不是通过厚边框硬切。

**Step 3: 明确与首页、工作流页的关系**
- 个人空间页只承接管理行为，不和工作流页争夺创作主路径。

**Validation**
- 用户能快速判断这里是“管理/查看”页面，而不是新一套创作入口。
- 手机端能顺滑浏览，不出现横向拥挤。

---

### Task 6: 完成移动端优先级重排

**Objective:** 确保 375px 宽度下仍然可读、可点、可理解，且不靠缩小桌面布局硬塞。

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/revid-prototype.html`
- Modify: `ui/revid-space.html`

**Step 1: 首页移动端重排**
- 保留主 CTA 和最必要的辅助入口。
- 次级信息折叠或延后展示。

**Step 2: 工作流页移动端重排**
- 缩短顶部状态、底部说明和辅助块。
- 工具栏、dock 和辅助面板不要挤压 canvas。

**Step 3: 个人空间页移动端重排**
- 首页式 hero 结构不要继续保留。
- 资源模块用更清晰的纵向层级展开。

**Validation**
- 375px 下不出现明显横向滚动条。
- 主操作永远排在次级信息前面。

---

### Task 7: 补齐文案、状态和可访问性收口

**Objective:** 统一按钮、提示、状态和焦点反馈，避免局部看起来像原型拼接。

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/revid-prototype.html`
- Modify: `ui/revid-space.html`
- Reference: `ui/design-direction.md`

**Step 1: 统一文案语气**
- 按钮、chip、提示、空状态尽量短。
- 用动词描述动作，用名词描述状态。

**Step 2: 补齐交互状态**
- `hover`、`active`、`selected`、`loading`、`warning` 的反馈保持一致。
- 保证键盘焦点可见，避免只靠颜色传达状态。

**Step 3: 检查可访问性**
- 图标按钮需要可理解的标签。
- 关键交互不要只依赖 tooltip。

**Validation**
- 页面里不会出现多套互相打架的按钮语气。
- 键盘操作时状态反馈可见。

---

### Task 8: 本地预览与人工验收

**Objective:** 用本地浏览器预览确认页面在桌面和移动端都达到计划标准。

**Files:**
- Use: `ui/start-preview.ps1`
- Check: `ui/index.html`
- Check: `ui/revid-prototype.html`
- Check: `ui/revid-space.html`

**Step 1: 启动本地预览**
- 运行 `ui/start-preview.ps1`。
- 用本机浏览器打开本地预览地址。

**Step 2: 桌面端检查**
- 检查 1440px 左右宽度下的主视觉、层级和留白。
- 检查三个页面的切换是否还有突兀感。

**Step 3: 移动端检查**
- 检查 375px 宽度下是否横向溢出。
- 检查底部安全区、工具栏和主要操作位置是否合理。

**Step 4: 记录验收结果**
- 将完成情况同步回 `ui/revid-ui-design-plan.md`。
- 将仍存在的问题同步回 `ui/revid-requirements-status.md`。

---

## 文件清单

### 预计会改的前端页面

- `ui/index.html`
- `ui/revid-prototype.html`
- `ui/revid-space.html`
- `ui/start-preview.ps1`

### 预计会更新的设计 / 状态文档

- `ui/design-direction.md`
- `ui/revid-ui-design-plan.md`
- `ui/revid-requirements-status.md`
- `ui/impeccable-ui-audit-and-polish-plan.md`
- `ui/revid-user-flow-draft.md`
- `xq/progress.md`
- `pitfalls.md`

---

## 验证方式

### 手动验证

- 桌面端浏览首页、工作流页、个人空间页，确认统一视觉系统成立。
- 在 375px 宽度下检查是否有横向溢出、遮挡和可点击区域过小的问题。
- 检查主 CTA 是否足够明确，辅助信息是否没有抢主任务。
- 检查页面切换时是否有明显的“拼接感”。

### 预览验证

- 启动 `ui/start-preview.ps1`
- 使用浏览器查看本地预览页
- 必要时在 Chrome 和 Edge 中各跑一次，确认没有浏览器策略差异

### 记录验证

- 已完成内容同步到 `ui/revid-ui-design-plan.md`
- 未完成项同步到 `ui/revid-requirements-status.md`
- 新发现的问题同步到 `pitfalls.md`

---

## 风险与取舍

1. **风险：继续在静态 HTML 上堆交互，后续迁移成本偏高。**
   - 取舍：本轮先换取快速收口和明确视觉方向，不提前工程化重构。

2. **风险：首页、工作流页、个人空间页各自迭代后又出现视觉漂移。**
   - 取舍：先统一 token、状态和文案，再做局部美化。

3. **风险：移动端为了保留功能塞太多模块。**
   - 取舍：移动端优先保证主任务顺畅，次级能力折叠。

4. **风险：和后端联调时，页面结构需要再改。**
   - 取舍：本计划先不接真实 API，页面先按 mock / local state 稳定下来。

---

## 开放问题

1. 首页的主 CTA 最终文案是否要固定为“进入工作流”还是“开始创作”。
2. 个人空间页是否要在本轮就预留历史 / 结果 / 资产三个 tab，还是先做总览再展开。
3. 工作流页右侧面板当前是否需要继续收窄，还是保留现有宽度只做内容收口。
4. 后续是否要把 `ui/` 静态原型拆成更细的 JS/CSS 片段，还是继续保持单文件维护到联调前。

---

## 交付标准

- 首页、工作流页、个人空间页都能从 `ui/` 目录直接本地预览。
- 三页共享同一套视觉系统，不再像拼接的原型合集。
- 首页主入口明确，工作流页画布中心明确，个人空间页管理总览明确。
- 375px 宽度下仍然能顺畅阅读和操作。
- 计划完成后，`ui/revid-ui-design-plan.md` 和 `ui/revid-requirements-status.md` 的状态能继续对上当前实现。

