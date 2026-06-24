# Task: 全局设计 tokens 对齐（SCSS variables 抽取）

## Task ID
T2-007

## Phase
Phase 2

## Objective
将 `ui/design-direction.md` 中定义的全部设计 tokens（色彩、间距、半径、字体、阴影）抽取到 `frontend/src/assets/styles/variables.scss`，并在 `Home.vue`、`Workspace.vue`、`Space.vue` 中替换硬编码值，确保全局一致性。

## Scope
- 修改的文件范围：
  - `frontend/src/assets/styles/variables.scss` — 补充缺失的 token
  - `frontend/src/assets/styles/global.scss` — 如需补充字体栈
  - `frontend/src/views/app/Home.vue` — 替换硬编码 oklch 值为 var() 引用
  - `frontend/src/views/app/Workspace.vue` — 同上
  - `frontend/src/views/app/Space.vue` — 同上
  - 其他组件如 `AppTopBar.vue`、`PromptComposer.vue`、`CanvasStage.vue` — 按需替换
- 不涉及的文件范围：后端代码、Admin 页面、新建页面

## Constraints
- 使用 Vue 3 + TypeScript + SCSS + Composition API + `<script setup>`
- 所有 token 必须与 `ui/design-direction.md` 定义的值完全一致
- 不改变任何现有布局和视觉表现
- 单模块任务：仅做 token 抽取和变量替换，不新增功能
- 修改后必须 `npm run build` 通过
- 新增 token 必须带 SCSS 注释说明用途

## Missing Tokens (from design-direction.md)

以下 token 在 `variables.scss` 中尚不存在，需要补充：

### Spacing tokens
| Token | Value | 用途 |
|-------|-------|------|
| `--space-1` | 4px | 图标微调、紧密间距 |
| `--space-2` | 8px | 控件内部间距 |
| `--space-3` | 12px | 表单、面板行间距 |
| `--space-4` | 16px | 面板 padding |
| `--space-6` | 24px | 页面级留白 |
| `--space-8` | 32px | 空状态、分组间距 |

### Radius tokens
| Token | Value | 用途 |
|-------|-------|------|
| `--radius-xs` | 4px | 小型标签、输入内部 |
| （已有 `--radius-sm` 6px）| | |
| （已有 `--radius-md` 8px）| | |
| （已有 `--radius-lg` 12px）| | |
| `--radius-pill` | 999px | 用户头像、状态胶囊 |

### Font tokens
| Token | Value | 用途 |
|-------|-------|------|
| `--font-family` | "Geist", -apple-system, ... | 全局字体栈 |
| `--font-size-page-heading` | 24px / weight 650 / lh 1.2 | 页面级标题 |
| `--font-size-panel-heading` | 15px / weight 600 / lh 1.4 | 面板标题 |
| `--font-size-body` | 14px / weight 450 / lh 1.6 | 正文和控件 |
| `--font-size-hint` | 12px / weight 450 / lh 1.45 | 辅助信息 |
| `--font-size-number` | 13px / weight 520 / lh 1.4 | 数字和额度 |

### Shadow tokens
| Token | Value | 用途 |
|-------|-------|------|
| （已有 `--shadow-soft`）| | |
| 可能需要补充其他层级阴影 | | |

## Acceptance Criteria
- [ ] `variables.scss` 包含 design-direction.md 定义的所有 token（色彩 12 个 + 间距 6 个 + 半径 5 个 + 字体 5 个 + 阴影 ≥ 1 个）
- [ ] 三个页面（Home.vue / Workspace.vue / Space.vue）中硬编码的 `oklch()` 值尽可能替换为 `var(--token-name)` 引用
- [ ] 硬编码的 spacing 值（4px/8px/12px/16px/24px/32px）替换为 `var(--space-N)` 引用
- [ ] 硬编码的 radius 值（4px/6px/8px/12px/999px）替换为 `var(--radius-*)` 引用
- [ ] `global.scss` 中字体栈与 design-direction.md 第 5 节一致
- [ ] 所有替换不改变任何视觉表现（像素级等价）
- [ ] `npm run build` 构建通过，无 SCSS 编译错误
- [ ] 每个新增 token 有 SCSS 注释说明用途

## Deliverables
- `frontend/src/assets/styles/variables.scss` — 完整的 token 定义
- `frontend/src/assets/styles/global.scss` — 字体栈对齐
- `frontend/src/views/app/Home.vue` — token 引用替换
- `frontend/src/views/app/Workspace.vue` — token 引用替换
- `frontend/src/views/app/Space.vue` — token 引用替换
- `ai/reports/REPORT-T2-007.md` — 完成报告

## Codex Prompt
请执行以下任务：

1. 读取 `ai/state/CURRENT.md`、`ai/state/ROADMAP.md` 了解项目上下文
2. 读取 `ui/design-direction.md` 获取完整的 token 定义
3. 读取 `frontend/src/assets/styles/variables.scss` 查看已有 token
4. 对比两者，列出缺失的 token（spacing / radius / font / shadow）
5. 在 `variables.scss` 中补充缺失的 token，每个 token 附带 SCSS 注释
6. 在 `global.scss` 中确保字体栈与 design-direction.md 第 5 节一致
7. 依次读取 `Home.vue`、`Workspace.vue`、`Space.vue` 的 `<style>` 部分
8. 对每个文件执行：
   - 将硬编码的 spacing 值（4px/8px/12px/16px/24px/32px）替换为 `var(--space-N)`
   - 将硬编码的 radius 值（4px/6px/8px/12px/999px）替换为 `var(--radius-*)`
   - 将重复出现的 oklch 颜色值替换为 `var(--color-token)`（如 `--bg-panel-subtle`、`--border-subtle` 等已有 token）
   - 对于 design-direction.md 中未定义的新颜色值，保留原值但添加注释
9. 完成后执行 `cd frontend && npm run build` 验证构建通过
10. 生成完成报告 `ai/reports/REPORT-T2-007.md`
