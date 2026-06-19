# Task: 个人空间页迁移（Space.vue）

## Task ID
T2-003

## Phase
Phase 2

## Objective
将 `Space.vue` 个人空间页从现有基础骨架迁移为与 `ui/revid-space.html` 原型结构对齐、与 `ui/design-direction.md` 设计方向一致的完整页面。

## Scope
- 修改的文件范围：`frontend/src/views/app/Space.vue`
- 不涉及的文件范围：后端代码、其他前端页面、组件库

## Constraints
- 使用 Vue 3 + TypeScript + SCSS + Composition API + `<script setup>`
- 使用 `ui/design-direction.md` 定义的 OKLCH 色彩系统（浅色主题，非原型中的深色主题）
- 顶栏使用已有的 `AppTopBar.vue` 组件（52px 高度）
- 按钮动效：hover 120ms, active scale(0.96)
- 响应式断点：≤760px 移动端适配
- 不引入新的外部依赖
- 单页面任务，不涉及后端 API 联调（联调在 T2-007 阶段进行）

## Acceptance Criteria
- [ ] 页面包含 hero 区域：标题、副标题、CTA 按钮（"查看个人资产"/"继续工作流"）
- [ ] 页面包含统计卡片区域（至少展示额度信息：文本/图片/视频）
- [ ] 页面包含内容入口导航区（个人中心/个人资产/历史记录/结果页 四个卡片）
- [ ] 页面包含 Tab 切换区（section-switcher），点击切换不同子页面内容
- [ ] 子页面内容骨架：个人中心（账号概览/订阅通知/基础设置）、个人资产（素材库/结果资产/空间用量）、历史记录（列表项）、结果页（结果封面/操作位/回链工作流）
- [ ] 视觉与 design-direction.md 一致：浅色背景、OKLCH tokens、无玻璃拟态大面积 blur、无夸张 AI 科技感
- [ ] `npm run build` 构建通过
- [ ] 响应式验证：桌面端正常显示，≤760px 移动端布局合理（hero 纵向排列、grid 单列）

## Deliverables
- `frontend/src/views/app/Space.vue` — 迁移后的完整个人空间页
- `ai/tasks/doing/TASK-T2-003-PLAN.md` — 开发计划
- `ai/tasks/doing/TASK-T2-003-PROGRESS.md` — 进度记录
- `ai/reports/REPORT-T2-003.md` — 完成报告

## Codex Prompt
请执行以下任务：

1. 读取 `ai/state/CURRENT.md`、`ai/state/ROADMAP.md`、`xq/progress.md` 了解项目上下文
2. 读取 `ui/design-direction.md` 了解设计规范（色彩系统、布局原则、组件风格、响应式断点）
3. 读取 `ui/revid-space.html` 了解个人空间页原型结构和交互逻辑
4. 读取现有 `frontend/src/views/app/Space.vue` 了解当前实现
5. 读取 `frontend/src/components/layout/AppTopBar.vue` 了解顶栏组件

然后重构 `Space.vue`，实现以下结构（使用 design-direction.md 的浅色主题，而非原型的深色主题）：

### 页面结构
```
<AppTopBar />
<section class="space-wrap">
  <!-- Hero 区域 -->
  <header class="space-hero">
    <div class="hero-main">
      <div class="hero-kicker">管理总览</div>
      <h1>把账号、资产和结果集中到一个不打断工作流的管理台里。</h1>
      <p>这里优先负责看状态、回历史、管资产，再决定什么时候回到工作流继续创作。</p>
      <div class="hero-actions">
        <button class="hero-action primary focus-ring">查看个人资产</button>
        <RouterLink to="/app/workspace" class="hero-action focus-ring">继续工作流</RouterLink>
      </div>
    </div>
    <div class="hero-stats">
      <!-- 额度统计卡片：文本/图片/视频 -->
    </div>
  </header>

  <!-- 内容入口导航区 -->
  <section class="nav-section">
    <div class="section-head">
      <h2>内容入口</h2>
      <span>先按管理任务拆入口，再分别进入资产、历史和结果的独立内容区。</span>
    </div>
    <div class="management-strip">
      <!-- 管理标签：最近结果 / 资产空间 / 已拆分模块 -->
    </div>
    <div class="nav-grid">
      <!-- 4 个导航卡片：个人中心 / 个人资产 / 历史记录 / 结果页 -->
    </div>
  </section>

  <!-- Tab 切换区 + 子页面 -->
  <section class="panel section">
    <div class="section-head">
      <h2>个人空间</h2>
      <span>先切到目标模块，再决定是查看状态、回看历史，还是继续推回工作流。</span>
    </div>
    <div class="section-switcher">
      <!-- 4 个 tab 按钮：个人中心 / 个人资产 / 历史记录 / 结果页 -->
    </div>
    <div class="subpages">
      <!-- 4 个子页面，通过 active class 控制显示 -->
    </div>
  </section>
</section>
```

### 交互逻辑
- 使用 `ref` 或 `reactive` 管理当前激活的 tab（`activeTab: string = 'profile'`）
- 点击 section-switcher 中的 tab 按钮切换 `activeTab`
- 导航卡片的点击事件也切换 `activeTab`
- 子页面根据 `activeTab` 显示对应的内容

### 样式要求
- 使用 design-direction.md 的 OKLCH tokens（浅色主题）
- 容器宽度：`min(1120px, calc(100% - 40px))`
- nav-grid 4 列，≤1040px 变为 2 列，≤720px 变为 1 列
- 卡片 hover 效果：`translateY(-2px)` + border-color 变化
- 按钮 active 效果：`scale(0.96)`
- 子页面切换使用淡入动画（opacity 0→1, translateY 12→0, 320ms, stagger 40ms）
- 首次加载页面整体淡入动画（opacity 0→1, translateY 16→0, 420ms, stagger 48ms）

### 注意
- 原型使用深色主题（`--bg: #0d1016`），但 design-direction.md 定义为浅色主题（`--bg-app: oklch(96% 0.008 92)`），请以 design-direction.md 为准
- 原型中的 Chinese 单字图标（"个""资""历""结"）请用 lucide-vue-next 图标替代
- 额度数据可以从 `useAuthStore` 获取，暂时使用 mock 数据或 store 中的值
- 资产列表暂时显示空状态或 mock 数据（真实数据联调在 T2-007 阶段）

完成后执行 `cd frontend && npm run build` 验证构建通过，然后生成完成报告。
