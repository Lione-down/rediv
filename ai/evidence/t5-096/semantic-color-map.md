# T5-096 Semantic Color Map

- Version: `2`
- Date: `2026-07-19`
- Revid source: `frontend/src/assets/styles/v2-canvas-tokens.scss`
- Official comparison state: `MATCHED_BY_SEMANTIC_NORMALIZATION`

The map records the live Revid side of the allowed semantic-color exception. It does not sample or copy LibTV colors. Structural comparison normalizes color/media interiors and still enforces outer geometry, outline, hierarchy, and state roles through `comparison-contract-2026-07-20.json`.

| Semantic role | Live Revid token | Live value | Invariant |
|---|---|---|---|
| Canvas base | `--v2-canvas` | `oklch(9.5% 0.018 292)` | Darkest workspace surface. |
| Surface steps | `--v2-surface-1/2/3` | `oklch(14.5% 0.026 292)` to `oklch(21% 0.035 292)` | Elevation uses luminance steps, not a new card system. |
| Prominent surface | `--v2-surface-prominent` | `oklch(24% 0.04 292)` | Reserved for immediate contextual ownership. |
| Grid | `--v2-grid-dot` | `oklch(72% 0.035 292 / 0.14)` | Orientation only, subordinate to graph content. |
| Primary/secondary/muted text | `--v2-text-primary/secondary/muted` | `94%`, `74%`, `62%` lightness at hue `292` | Preserve hierarchy and CJK readability. |
| Disabled text | `--v2-text-disabled` | `oklch(50% 0.022 292)` | Unavailable actions remain legible and explicit. |
| Selection/action family | `--v2-accent`, `--v2-accent-hover`, `--v2-accent-pressed` | Violet hue `292` | Revid-owned selection, focus, target, and primary-action meaning. |
| Soft selection | `--v2-accent-soft` | `oklch(65% 0.19 292 / 0.14)` | Never replaces geometry or state evidence. |
| Focus ring | `--v2-focus-ring` | `oklch(72% 0.17 292 / 0.64)` | Visible 2px accessibility focus ownership. |
| Node outlines | `--canvas-node-outline`, `--canvas-node-selected-outline` | quiet white-violet alpha, selected violet alpha | Default and selected boundaries remain distinct without glow flooding. |
| Ports and edges | `--canvas-port-fill`, `--canvas-port-idle-fill`, `--canvas-edge` | violet active, muted idle | Typed state and direction remain readable at supported zooms. |
| Composer | `--canvas-composer-surface`, `--canvas-composer-outline` | surface-2 alpha plus quiet outline | Source node remains visible; composer is contextual. |
| Media radius | `--canvas-media-radius` | `8px` | Revid-owned radius until official geometry is measured. |
| Success/warning/error | `--v2-success`, `--v2-warning`, `--v2-danger` | green `155`, amber `82`, red `24` hues | State meaning is never recolored to imitate a brand. |
| Floating depth | `--v2-shadow-floating`, `--v2-shadow-prominent` | bounded dark shadows | Used with surface steps only where contextual elevation is required. |

## Non-color Invariants

- Semantic normalization never excuses a geometry, spacing, typography, outline, radius, shadow-footprint, icon, motion, or action-order mismatch.
- New values must be named Revid semantic tokens. Literal reference colors and proprietary visual assets are prohibited.
- Reduced motion preserves status and focus meaning while removing nonessential animation.
- Official measurements must record browser tolerance separately from the semantic-color exception.
