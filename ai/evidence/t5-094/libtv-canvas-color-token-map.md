# T5-094 LibTV-to-Revid semantic color-token map

- Version: `1`
- Date: `2026-07-18`
- Rule: reproduce observable contrast hierarchy and state weight only. Never copy LibTV color values, gradients, logo colors, brand assets, fonts, or proprietary icon files.
- Revid source of truth: `frontend/src/assets/styles/v2-canvas-tokens.scss`.

| Observable semantic role | LibTV evidence | Revid token | Current Revid value | Required relationship |
|---|---|---|---|---|
| Canvas background | `L-SS-03` through `L-SS-12` | `--v2-canvas` | `oklch(9.5% 0.018 292)` | Darkest application surface; media and controls remain dominant. |
| Dot grid | `L-SS-03` through `L-SS-10` | `--v2-grid-dot` | `oklch(72% 0.035 292 / 0.14)` | Visible enough for spatial orientation, below edge/text contrast. |
| Primary node/control surface | `L-SS-04`,`L-SS-06`,`L-SS-09` | `--v2-surface-1` | `oklch(14.5% 0.026 292)` | Slightly above Canvas; no large status tint. |
| Secondary/floating surface | `L-SS-05`,`L-SS-09`,`L-SS-10` | `--v2-surface-2` | `oklch(17.5% 0.03 292)` | Composer/menu/panel elevation without competing with media. |
| Hover/selected tile | `L-SS-05`,`L-SS-09` | `--v2-surface-3` | `oklch(21% 0.035 292)` | Local progressive disclosure only. |
| Prominent control surface | `L-SS-09`,`L-SS-10` | `--v2-surface-prominent` | `oklch(24% 0.04 292)` | Reserved for the most immediate contextual control. |
| Primary text | all retained captures | `--v2-text-primary` | `oklch(94% 0.012 292)` | Highest non-media information contrast. |
| Secondary text/labels | all retained captures | `--v2-text-secondary` | `oklch(74% 0.024 292)` | Node labels and parameter values below primary copy. |
| Muted metadata | `L-SS-03`,`L-SS-09`,`L-SS-11` | `--v2-text-muted` | `oklch(62% 0.028 292)` | Zoom, cost, resolution, and supporting metadata. |
| Disabled state | `L-SS-12` continuation menu | `--v2-text-disabled`, `--v2-surface-disabled` | `oklch(50% 0.022 292)`, `oklch(16% 0.02 292)` | Visibly unavailable without appearing selected. |
| Default node outline | `L-SS-05`,`L-SS-06` | `--canvas-node-outline` | `oklch(94% 0.015 292 / 0.1)` | Approximately 1px, quiet against the Canvas. |
| Selected node outline | `L-SS-08`,`L-SS-09` | `--canvas-node-selected-outline` | `oklch(68% 0.18 292 / 0.88)` | Revid violet substitutes for LibTV local active emphasis; no glow flood. |
| Active/valid interaction | `L-SS-07`,`L-SS-08` | `--v2-accent`, `--v2-accent-hover`, `--v2-accent-pressed` | hue 292 violet family | Used for ports, selected tiles, valid targets, primary actions, and local flow only. |
| Soft selected background | `L-SS-09` mode tiles | `--v2-accent-soft` | `oklch(65% 0.19 292 / 0.14)` | Background tint stays subordinate to text/media. |
| Focus ring | keyboard/accessibility Revid contract | `--v2-focus-ring` | `oklch(72% 0.17 292 / 0.64)` | Visible 2px accessibility ring; not inferred as a LibTV brand color. |
| Idle port | `L-SS-05`,`L-SS-06` | `--canvas-port-idle-fill` | `oklch(82% 0.018 292 / 0.26)` | Recedes until hover/selection. |
| Active port | `L-SS-07`,`L-SS-08` | `--canvas-port-fill` | `oklch(68% 0.18 292)` | Local active emphasis. |
| Default edge | `L-SS-06`,`L-SS-12` | `--canvas-edge` | `oklch(74% 0.024 292 / 0.2)` | Thin, quiet, and below node/media prominence. |
| Composer | `L-SS-06`,`L-SS-09`,`L-SS-11` | `--canvas-composer-surface`, `--canvas-composer-outline` | surface 2 at 0.98; white at 0.12 | Distinct attached workspace without covering the source body. |
| Success | no explicit success color in retained LibTV captures | `--v2-success` | `oklch(72% 0.13 155)` | Icon/text only; never a full green result card. |
| Warning | unavailable/low-confidence action semantics | `--v2-warning` | `oklch(78% 0.14 82)` | Bounded warning text/icon, not the selection color. |
| Error | public error surface not observed | `--v2-danger` | `oklch(66% 0.19 24)` | Accessible failure message and small status treatment; do not infer LibTV styling. |
| Information | neutral metadata | `--v2-info` | `oklch(74% 0.024 292)` | Neutral status, same hierarchy as secondary text. |
| Floating shadow | `L-SS-04`,`L-SS-09`,`L-SS-10` | `--v2-shadow-floating` | `0 18px 44px oklch(3% 0.01 292 / 0.42)` | Separates menu/composer without glow. |
| Prominent overlay shadow | `L-SS-10` | `--v2-shadow-prominent` | `0 24px 64px oklch(3% 0.01 292 / 0.52)` | Reserved for modal/preflight ownership. |

## Non-color invariants

- The color exception does not permit changing observed opacity hierarchy, border width, geometry, padding, radius, shadow footprint, icon size/stroke, placement, reveal condition, or state transition.
- `--canvas-media-radius` remains the Revid-owned `8px`; observed numeric parity must be proven in Unit 5H rather than inferred from screenshots.
- Reduced motion maps durations to zero while preserving focus/state semantics; this is a Revid accessibility requirement and cannot be weakened for visual parity.
- Any new token must be semantic and Revid-owned. Literal LibTV color sampling is prohibited.
