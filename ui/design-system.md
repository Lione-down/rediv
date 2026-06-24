# Revid Design System

> Version: 1.0 — Phase 4C
> Last updated: 2026-06-22
> Source: `frontend/src/assets/styles/variables.scss` + `frontend/src/assets/styles/naive-theme.ts`

## 1. Tokens

### 1.1 Colors

#### Backgrounds

| Token | Value | Usage |
|---|---|---|
| `--bg-app` | `oklch(96% 0.008 92)` / Dark: `#13131a` | App shell, body background |
| `--bg-canvas` | `oklch(98% 0.006 92)` / Dark: `#0e0e12` | Canvas workspace area |
| `--bg-panel` | `oklch(100% 0.004 92)` / Dark: `#1a1a24` | Primary panel surface |
| `--bg-panel-subtle` | `oklch(94% 0.007 92)` / Dark: `#22222e` | Secondary / input surface |

#### Text

| Token | Value | Usage |
|---|---|---|
| `--text-primary` | `oklch(18% 0.014 245)` / Dark: `#f0eef6` | Headings, body text |
| `--text-secondary` | `oklch(46% 0.018 245)` / Dark: `rgba(240,238,246,0.72)` | Descriptions, labels |
| `--text-muted` | `oklch(62% 0.014 245)` / Dark: `rgba(240,238,246,0.48)` | Helper text, placeholders |

#### Borders

| Token | Value | Usage |
|---|---|---|
| `--border-subtle` | `oklch(88% 0.009 92)` / Dark: `rgba(240,238,246,0.10)` | Panel dividers, subtle lines |
| `--border-strong` | `oklch(76% 0.014 92)` / Dark: `rgba(240,238,246,0.20)` | Controls, selected borders |

#### Brand

| Token | Value | Usage |
|---|---|---|
| `--accent-generate` | `oklch(62% 0.105 175)` / Dark: `#6347C2` | Primary action (Generate) |
| `--accent-generate-hover` | `oklch(55% 0.12 175)` / Dark: `#7B61D6` | Hover state |
| `--accent-select` | `oklch(58% 0.115 252)` / Dark: `#6347C2` | Selection, focus accent |

#### Status

| Token | Value | Usage |
|---|---|---|
| `--warning` | `oklch(70% 0.13 78)` / Dark: `#d4a03c` | Warning states |
| `--danger` | `oklch(58% 0.17 27)` / Dark: `#d9535c` | Error / danger states |
| `--success` | `oklch(60% 0.12 150)` / Dark: `#4caf7d` | Success states |

### 1.2 Spacing

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Tight icon / micro spacing |
| `--space-2` | `8px` | Compact inner control spacing |
| `--space-3` | `12px` | Form rows, panel gaps |
| `--space-4` | `16px` | Standard panel padding |
| `--space-6` | `24px` | Page-level whitespace |
| `--space-8` | `32px` | Empty state, group spacing |

### 1.3 Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | `4px` | Small utility corners |
| `--radius-sm` | `6px` | Button, tool button corners |
| `--radius-md` | `8px` | Node, thumbnail corners |
| `--radius-lg` | `12px` | Drawer, floating panel corners |
| `--radius-pill` | `999px` | Avatar, capsule corners |

### 1.4 Typography

| Token | Value | Usage |
|---|---|---|
| `--font-family` | `"Geist", -apple-system, ...` | Global UI font stack |
| `--font-size-page-heading` | `24px` / `36px` (≤1024) | Page heading |
| `--font-weight-page-heading` | `650` | Page heading weight |
| `--line-height-page-heading` | `1.2` | Page heading line height |
| `--font-size-panel-heading` | `15px` | Panel heading |
| `--font-weight-panel-heading` | `600` | Panel heading weight |
| `--font-size-body` | `14px` | Body text |
| `--font-weight-body` | `450` | Body text weight |
| `--line-height-body` | `1.6` | Body text line height |
| `--font-size-hint` | `12px` | Helper text |
| `--font-size-number` | `13px` | Numeric text |

### 1.5 Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-soft` | `0 16px 40px oklch(20% 0.02 245 / 0.08)` | Default soft panel |
| `--shadow-elevated` | `0 22px 50px oklch(24% 0.016 245 / 0.06)` | Large surface elevation |
| `--shadow-node` | `0 18px 42px oklch(24% 0.02 245 / 0.1)` | Floating node element |
| `--shadow-strong` | `0 26px 72px oklch(10% 0.02 245 / 0.24)` | Deep dark surface |
| `--shadow-accent` | `0 12px 24px oklch(62% 0.105 175 / 0.18)` | Accent action glow |

### 1.6 Motion

| Token | Value | Usage |
|---|---|---|
| Reduced motion | `prefers-reduced-motion: reduce` | Disable transitions/animations |
| Standard transition | `0.2s ease` | Default micro-interactions |

## 2. Component States

### 2.1 Button

| State | Color | Background | Border |
|---|---|---|---|
| Default | `textColor1` | `buttonColor2` | `borderColor` |
| Hover | `textColor1` | `buttonColor2Hover` | `hoverBorderColor` |
| Active | `textColor1` | `buttonColor2Pressed` | `activeBorderColor` |
| Focus | `textColor1` | `buttonColor2` | `focusBorderColor` + 3px ring |
| Disabled | `textColorDisabled` | `inputColorDisabled` | `borderColor` |
| Primary | `#f0eef6` | `#6347C2` | transparent |
| Primary Hover | `#f0eef6` | `#7B61D6` | transparent |
| Primary Active | `#f0eef6` | `#4E35A8` | transparent |

### 2.2 Input

| State | Background | Border | Text | Placeholder |
|---|---|---|---|---|
| Default | `inputColor` | `borderColor` | `textColor1` | `placeholderColor` |
| Hover | `inputColor` | `borderHover` | `textColor1` | `placeholderColor` |
| Focus | `inputColor` | `borderFocus` + ring | `textColor1` | `placeholderColor` |
| Disabled | `inputColorDisabled` | `borderColor` | `textColorDisabled` | `placeholderColorDisabled` |

### 2.3 Drawer

| State | Color | Text | Shadow |
|---|---|---|---|
| Default | `cardColor` | `textColor1` | `boxShadow3` |
| Mask | — | — | `maskBg: rgba(0,0,0,0.5)` |

### 2.4 Dropdown

| State | Background | Text |
|---|---|---|
| Default | `color` | `optionTextColor` |
| Hover | `optionColorHover` | `optionTextColorHover` |
| Active | `optionColorActive` | `optionTextColorActive` |

### 2.5 Modal

| State | Color | Text | Shadow |
|---|---|---|---|
| Default | `modalColor` | `textColor1` | `boxShadow3` |
| Mask | — | — | `maskBg: rgba(0,0,0,0.5)` |

### 2.6 Message

| Type | Background | Text | Icon |
|---|---|---|---|
| Info | `infoColor` | `textColor` | `iconColorInfo` |
| Success | `successColor` | `textColorSuccess` | `iconColorSuccess` |
| Warning | `warningColor` | `textColorWarning` | `iconColorWarning` |
| Error | `errorColor` | `textColorError` | `iconColorError` |
| Loading | `textColor` | `textColorLoading` | `iconColorLoading` |

## 3. Layout Specifications

### 3.1 Target Viewport

| Breakpoint | Min Width | Notes |
|---|---|---|
| Desktop (baseline) | `1440px` | Full toolbar + panels |
| Narrow desktop | `920px` | Collapsed sidebar |
| Tablet | `768px` | Stacked panels |
| Mobile | `375px` | Single column, hidden panels |

### 3.2 Layout Zones

| Zone | Width / Height | Position |
|---|---|---|
| Top toolbar | `76px` height | Fixed top, full width |
| Left panel | `320px` width | Collapsible, fixed left |
| Canvas workspace | `flex: 1` | Center, fills remaining |
| Right panel | `320px` width | Collapsible, fixed right |
| Prompt Dock | bottom-center, ~`480px` max-width | Floating above canvas |

### 3.3 Canvas

- Background: `--bg-canvas`
- Grid: optional, 20px snap, subtle dots at `opacity: 0.04`
- Pan: drag on canvas background
- Zoom: `Ctrl/Cmd + scroll`, range `20%–400%`

### 3.4 Node States

| State | Border | Shadow | Opacity |
|---|---|---|---|
| Default | `border-subtle` | `--shadow-node` | `1.0` |
| Selected | `--accent-select` 2px | `--shadow-accent` | `1.0` |
| Hover | `--border-strong` | `--shadow-elevated` | `1.0` |
| Disabled | `border-subtle` | none | `0.4` |
| Error | `--danger` 2px | `--shadow-strong` | `1.0` |

## 4. Responsive Rules

1. Below `920px`: left panel collapses to icon strip (64px).
2. Below `768px`: right panel hides by default, accessible via drawer.
3. Below `512px`: toolbar icons compress, Prompt Dock becomes full-width bottom sheet.
4. Below `375px`: canvas zooms to fit, panels switch to modal drawers.
5. `min-width: 320px` enforced on `html` element.

## 5. Accessibility

- Focus ring: `3px solid oklch(58% 0.115 252 / 0.35)` with `outline-offset: 3px`.
- `prefers-reduced-motion`: all transitions/animations disabled.
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text and UI components.
- All interactive elements must be keyboard-focusable.
