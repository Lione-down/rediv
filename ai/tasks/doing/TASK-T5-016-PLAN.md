# T5-016 Multi-scenario Canvas Validation Plan

- State: `DONE - PASS`
- Updated: 2026-07-15
- Visual thesis: a media-first graphite workbench that stays legible when workflows converge, branch, fail, and become dense.
- CSS strategy: existing Vue SFC, Leafer UI, DOM media overlays, and shared SCSS tokens only.

## Scenario matrix

| Scenario | Required evidence |
|---|---|
| Media ratios | 16:9, 1:1, and 9:16 recognizable local images |
| Native video | playable local video with poster and decoded metadata |
| Converging graph | two text plus two media sources into one generation node |
| Branching graph | one generation node into at least three image/video results |
| Lifecycle | idle, running, success, failed, loading, unavailable |
| Content extremes | long Chinese, long English, empty content |
| Interaction | selected, editing, locked, port draft, read-only |
| Density | compact creative graph plus existing 200-node/300-edge profile |
| Viewports | 1440x900, 1366x768, 920x900, 375x812 |

## Implementation sequence

### Unit 0: deterministic media and graph fixture - complete

Create recognizable SVG image fixtures and a short local video fixture using existing local tooling. Build a reusable mocked Canvas document with converging, branching, lifecycle, content-extreme, and locked nodes. Keep all media synthetic and repository-local or data-URL based.

### Unit 1: RED scenario assertions - complete

Add a focused browser spec that proves exact media counts and ratios, video playability, typed connection endpoints, topology counts, no-overlap geometry, state semantics, mobile review-only behavior, and retained screenshots.

### Unit 2: screenshot-driven refinement - complete

Inspect every scenario at supported desktop widths. Fix only evidence-backed defects in typed geometry, label placement, port/edge hierarchy, status presentation, result stacking, selection toolbar, composer, minimap, or inspector avoidance.

### Unit 3: dense and runtime verification - complete

Run focused Canvas suites, full Chromium, build, and the guarded real-MySQL/browser 200/300 supervisor. Confirm visual-size derivation and metadata adoption do not introduce redundant saves or performance regression.

### Unit 4: closure - complete

Perform a fresh diff review, strict UTF-8, <=500-line, sensitive-path, and `git diff --check` audits. Write REPORT and mark DONE only when every scenario has direct evidence.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Synthetic media is visually meaningless | Screenshots cannot reveal crop/stretch defects | Use recognizable corner marks, labels, gradients, and distinct aspect ratios |
| Browser codec support varies | Video scenario becomes flaky | Generate a tiny Chromium-supported WebM/VP8 or use an existing proven fixture |
| Multi-input topology exceeds product contract | Test invents unsupported behavior | Use existing registry ports and document API shapes only |
| Dense evidence hides overlay defects | False visual pass | Capture selected/editing states separately at each desktop width |
| Scenario fixture bloats source | Maintainability regression | Reuse builders and keep every changed source file <=500 lines |

## Verification commands

```powershell
Set-Location frontend
npx playwright test tests/e2e/canvas-multi-scenario-visual.spec.ts --project=chromium
npx playwright test tests/e2e/canvas-libtv-visual-parity.spec.ts tests/e2e/canvas-node-workflow.spec.ts tests/e2e/canvas-port-geometry.spec.ts --project=chromium
npx playwright test --project=chromium
npm run build
```

Use the existing guarded supervisor through `backend/.venv/Scripts/python.exe`; never read `.env` files or expose credentials.
