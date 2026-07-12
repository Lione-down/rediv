# Revid Frontend

Revid Frontend 是基于 Vue 3 和 TypeScript 的创作工作台。Product V2 当前优先交付多画布项目模型、无限 Canvas 交互和统一暗紫设计体系。

## Current V2 Contract

- Canvas first acceptance 在全站 UI rollout 之前完成。
- 一个项目可以拥有多个独立 Canvas。
- Leafer UI 继续作为 Canvas renderer，不引入第二套画布引擎。
- Canvas 使用持久 world group 和 keyed incremental update，不在 pan/zoom 时全量清空重建。
- 桌面 Chrome 是主编辑端；移动端只提供浏览与审核。

权威文档：

- [`V2 PRD`](../ai/requirements/REVID-V2-PRD.md)
- [`Canvas Acceptance`](../ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md)
- [`Canvas Architecture`](../ai/architecture/REVID-V2-CANVAS-ARCHITECTURE.md)
- [`V2 Design System`](../ui/REVID-V2-DESIGN-SYSTEM.md)

## Technology

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Axios
- Naive UI
- Leafer UI
- Anime.js
- SCSS
- Playwright

## Install And Start

From `frontend/`:

```powershell
npm install
npm run dev
```

The development server uses a strict local address:

```text
http://127.0.0.1:9099/
```

API requests use `VITE_API_BASE_URL`; when absent, the current fallback is `http://localhost:8000`.

## Verification

```powershell
npm run build
npm run test:e2e
```

`npm run build` includes TypeScript checking. Browser acceptance must record viewport, backend/database evidence and artifact path, and must distinguish mock from real-service flows.

Canvas first acceptance uses these primary viewports:

- `1440x900`: primary desktop editing
- `1366x768`: compact desktop editing
- `920x900`: narrow editing boundary
- `375x812`: mobile review-only

Performance and behavior thresholds are defined in [`Canvas Acceptance`](../ai/requirements/REVID-V2-CANVAS-ACCEPTANCE.md), not duplicated here.

## Styling Rules

- Use one styling strategy: SCSS variables, global SCSS foundations and scoped component SCSS.
- Naive UI overrides must derive from V2 semantic tokens.
- Do not reintroduce the Phase 4 warm-light palette, blue-purple gradients, permanent glass panels or white Canvas nodes.
- Semantic success, warning and error states retain accessible green, amber and red signals on dark-purple containers.
- The historical [`ui/design-system.md`](../ui/design-system.md) is Phase 4 evidence only.

## Browser Artifacts

Playwright snapshots and screenshots belong in ignored local evidence directories such as `output/playwright/<task-unit>/`. Do not stage `.playwright-cli/`, browser caches or generated QA artifacts.
