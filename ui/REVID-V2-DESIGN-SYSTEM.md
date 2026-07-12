# Revid V2 Design System

- Status: Approved target
- Version: 2.0
- Date: 2026-07-12
- Applies to: Canvas first, then Login, Home, Space, Admin, and shared components
- Historical baseline: `ui/design-system.md` describes Phase 4 and is not the V2 target

## Direction Lock

- Visual thesis: a graphite-black violet creative studio, cinematic, precise, and controlled; UI chrome recedes while media and generated results carry the strongest visual weight.
- Content plan: orient the creator, expose save and project state, enable creation, then reveal detail only for the current selection.
- Interaction thesis: context tools fade and scale in within 160 ms, panels decelerate into place within 180 ms, and selected nodes gain a restrained violet halo without bounce or ornamental motion.

CSS strategy: SCSS variables plus scoped SCSS and Naive UI theme overrides only. Do not add Tailwind, CSS-in-JS, a second UI library, or a second icon family.

## 1. Visual Theme And Atmosphere

Revid V2 uses solid, violet-tinted near-black surfaces. The Canvas is the deepest layer and every elevated control is one measured lightness step above it. Traditional dark shadows are not the primary depth cue because they disappear on near-black surfaces; background luminance, low-opacity borders, media outlines, and selective violet focus define depth.

The interface is dense but calm. No decorative hero, permanent dashboard sidebar, bright white card, cyan highlight, or purple-to-blue gradient belongs in the creative workspace. Violet is a functional interaction color, not a decorative wallpaper.

## 2. Color Palette And Roles

All source tokens use OKLCH. Hex values may be generated only for third-party component APIs that cannot consume OKLCH.

### 2.1 Foundation

| Token | Value | Role |
|---|---|---|
| `--v2-canvas` | `oklch(9.5% 0.018 292)` | Infinite Canvas and deepest page background |
| `--v2-app` | `oklch(11.5% 0.022 292)` | App background outside Canvas |
| `--v2-surface-1` | `oklch(14.5% 0.026 292)` | Quiet toolbar and side-panel base |
| `--v2-surface-2` | `oklch(17.5% 0.030 292)` | Inputs, active rows, node cards |
| `--v2-surface-3` | `oklch(21% 0.035 292)` | Elevated popovers and context panels |
| `--v2-surface-prominent` | `oklch(24% 0.042 292)` | Selected or high-emphasis surface |

### 2.2 Text And Borders

| Token | Value | Role |
|---|---|---|
| `--v2-text-primary` | `oklch(94% 0.012 292)` | Primary text, never pure white |
| `--v2-text-secondary` | `oklch(74% 0.024 292)` | Labels and descriptions |
| `--v2-text-muted` | `oklch(62% 0.028 292)` | Hints and inactive metadata; remains at least 4.5:1 on V2 surfaces |
| `--v2-text-disabled` | `oklch(44% 0.022 292)` | Disabled text only |
| `--v2-text-on-accent` | `oklch(12% 0.020 292)` | Primary-button text on every solid accent state |
| `--v2-border-subtle` | `oklch(94% 0.015 292 / 0.06)` | Surface separation |
| `--v2-border-standard` | `oklch(94% 0.015 292 / 0.10)` | Controls and node edges |
| `--v2-border-strong` | `oklch(94% 0.018 292 / 0.18)` | Hover and high-contrast separation |
| `--v2-grid-dot` | `oklch(72% 0.035 292 / 0.14)` | Canvas dot grid |

### 2.3 Brand And Focus

| Token | Value | Role |
|---|---|---|
| `--v2-accent` | `oklch(65% 0.19 292)` | Selection, focus, primary action |
| `--v2-accent-hover` | `oklch(70% 0.18 292)` | Pointer hover |
| `--v2-accent-pressed` | `oklch(59% 0.20 292)` | Pressed and active |
| `--v2-accent-soft` | `oklch(65% 0.19 292 / 0.14)` | Selected row and focus background |
| `--v2-focus-ring` | `oklch(72% 0.17 292 / 0.48)` | Visible keyboard focus |

### 2.4 Semantic States

All notification and alert containers use the dark-purple surface family. Semantic color appears in the icon, concise title, focus treatment, and optional edge. Making every status purple is prohibited because it removes meaning.

| Token | Value | Role |
|---|---|---|
| `--v2-success` | `oklch(72% 0.14 155)` | Saved, completed, healthy |
| `--v2-warning` | `oklch(78% 0.14 78)` | Quota, attention, partial state |
| `--v2-danger` | `oklch(66% 0.19 24)` | Error, destructive, conflict |
| `--v2-info` | `oklch(72% 0.12 270)` | Neutral information |

## 3. Typography Rules

Brand words: cinematic, precise, controlled.

Rejected reflex display faces: Inter, Geist, and Space Grotesk. They are common defaults and do not express the intended media-studio character.

Chosen stack:

```css
font-family: "Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
```

`Sora` is used for Latin interface rhythm and compact numeric identity. Chinese falls through to PingFang SC or Noto Sans SC. The implementation must self-host a licensed WOFF2 subset or use the fallback stack without a blocking network request. Chinese runs do not receive negative letter spacing.

| Level | Size | Weight | Line height | Letter spacing |
|---|---:|---:|---:|---:|
| Workspace title | 20 px | 600 | 1.25 | `-0.012em` for Latin only |
| Panel title | 15 px | 600 | 1.45 | normal |
| Body | 14 px | 450 | 1.7 for Chinese | normal |
| Control | 13 px | 550 | 1.4 | normal |
| Metadata | 12 px | 450 | 1.5 | normal |
| Numeric | 13 px | 550 | 1.4 | normal, tabular numbers |

Rules:

- headings and short labels use `text-wrap: balance`;
- body copy uses `text-wrap: pretty`;
- counters, zoom, quota, duration, and revisions use tabular numbers;
- errors use active voice and specific recovery guidance;
- success messages have no exclamation mark;
- `html` uses `lang="zh-CN"`; mixed-language runs declare their language when practical.

## 4. Component Styling

### 4.1 Radius And Spacing

Radius scale:

| Token | Value | Use |
|---|---:|---|
| `--v2-radius-xs` | 4 px | micro indicators and small previews |
| `--v2-radius-sm` | 8 px | buttons, inputs, menu rows |
| `--v2-radius-md` | 12 px | nodes and floating panels |
| `--v2-radius-pill` | 999 px | status chips and avatars only |

Spacing scale: 4, 8, 12, 16, 20, 24, 32, and 40 px. Outer container padding defaults to the same token as its inner gap unless a documented optical adjustment is required.

### 4.2 Buttons

- minimum hit target: 40x40 px;
- default: transparent or `surface-1`, standard border, primary text;
- hover: `surface-2`, accent icon or border;
- pressed: `scale(0.96)` and `surface-prominent` for 100 ms;
- focus: 2 px focus ring with 2 px offset;
- primary: solid accent background, `text-on-accent`, no gradient;
- destructive: surface remains dark purple, icon and label use danger;
- disabled: disabled text and surface, no press motion.

Buttons in the same action slot use the same 13 px typography and height. State changes vary color, opacity, and icon, never font size.

### 4.3 Inputs

- background `surface-2`, standard border, 8 px radius;
- focus uses accent border plus focus ring;
- placeholder uses muted text and never replaces a visible label;
- inline validation appears adjacent to the field;
- text areas keep resize and scroll behavior predictable at 200% zoom.

### 4.4 Node Cards

- base surface `surface-2`, 12 px radius, standard border;
- selected node uses a 1 px accent edge and a soft outer halo, not a heavy glow;
- media nodes show the media first, then compact metadata;
- status overlays remain inside node geometry and do not shift layout;
- ports are 16 px visuals with at least 32 px effective hit areas that never overlap;
- unknown node types use a labeled unsupported state and preserve serialized data;
- no white card, cyan port, or generic image illustration.

### 4.5 Tool Dock And View Controls

- bottom-center dock uses `surface-1` with one elevated luminance step and a subtle border;
- tool groups use separators only where behavior changes;
- active tool uses accent-soft background and accent icon;
- bottom-left view controls remain visually quieter than creation tools;
- labels appear in tooltips and the shortcut panel, not as permanent clutter.

### 4.6 Panels And Popovers

- asset panel is a resizable left workspace panel, 280 to 420 px, and may push the Canvas on desktop;
- inspector is contextual, 360 px default, and closed when there is no relevant selection;
- history and large libraries use an overlay only when focus-lock is justified;
- lightweight menus and toolboxes use compact popovers;
- no backdrop blur as the default surface treatment;
- drawers use `overscroll-behavior: contain`.

### 4.7 Messages And Save State

- `Saving`: quiet violet spinner plus text;
- `Saved`: success icon and brief text, then reduce prominence;
- `Error`: danger icon, specific cause, retry action;
- `Conflict`: danger icon, current revision, reload-latest and preserve-local-copy actions;
- containers remain dark purple for all states;
- no generic `Something went wrong` or `Oops` copy.

## 5. Layout Principles

### 5.1 Full-Screen Canvas Layout

```text
top-left     project identity + canvas switcher
top-right    save state + quota/account
center       infinite Canvas
bottom-left  assets + arrange + minimap + edge + grid + zoom
bottom-center add/tool/library/history/shortcut dock
right        contextual inspector only when selected
```

- Canvas fills `100dvh` and is the page background;
- top controls float over Canvas and do not create a permanent 52 px app bar inside the workspace;
- empty state is centered in the usable Canvas, excluding open panels;
- multi-selection toolbar appears near the selection boundary and stays within viewport;
- node editor appears near the selected node or in the contextual panel, not as a permanent bottom dock;
- project IDs are never shown as the primary user label.

### 5.2 Grid And Density

- base grid is 24 world units, rendered as dots or micro-crosses on the visible layer;
- UI chrome uses compact 8 and 12 px gaps;
- node content uses 12 and 16 px internal spacing;
- no card is introduced solely to contain text that already has a clear spatial role.

## 6. Depth And Elevation

| Level | Treatment | Examples |
|---|---|---|
| 0 | `canvas` solid | Infinite Canvas |
| 1 | `surface-1`, subtle border | tool dock, quiet sidebar |
| 2 | `surface-2`, standard border | nodes, inputs, active rows |
| 3 | `surface-3`, standard border | popovers, context inspector |
| 4 | `surface-prominent`, accent edge when active | conflict panel, selected command surface |

Dark shadows may appear only as a soft separation behind a genuinely floating panel. Adjacent dark surfaces must remain distinguishable if all shadows are removed.

## 7. Motion And Micro-Interactions

- use only `transform` and `opacity` for ordinary animation;
- never use `transition: all`;
- hover and active transitions: 100 to 140 ms;
- context panel and popover enter: 160 to 180 ms, `cubic-bezier(0.16, 1, 0.3, 1)`;
- exit: 120 to 150 ms ease-in with at most `translateY(-8px)`;
- icon swap: 120 ms opacity plus scale from 0.9 to 1;
- press scale: 0.96, interruptible;
- no bounce, elastic easing, decorative rotation, layout-property animation, or perpetual ambient motion;
- reduced motion removes dash, pulse, spin, staged reveal, and press scale while preserving state changes.

Signature micro-interaction: a contextual tool surface appears from the selected graph element with a short opacity and 8 px translation, while the node receives one stable violet focus halo. The Canvas itself never zooms or shifts merely because a panel opens.

## 8. Do And Do Not

Do:

- make media and generation results the visual anchor;
- use one violet family for interaction and focus;
- separate depth through lightness steps;
- keep empty Canvas guidance compact and actionable;
- expose keyboard shortcuts and accurate save state;
- preserve visible focus and localized Chinese labels;
- use project-shared assets without duplicating ownership.

Do not:

- use blue-purple gradients, cyan accents, glass blur, or bright white node cards;
- show a permanent empty inspector or traditional dashboard sidebar inside Canvas;
- mix light SCSS tokens with dark Naive UI tokens;
- use dark shadows as the only depth cue;
- animate width, height, padding, or margin;
- hide conflict, unsaved, destructive, or recovery implications for visual simplicity;
- invent media illustrations when a labeled placeholder is more honest;
- use the same rounded card treatment for every content type.

## 9. Responsive Behavior

| Width | Behavior |
|---:|---|
| 1024 px and above | Full editing; resizable asset panel and contextual inspector |
| 768 to 1023 px | Compact editing; panels become drawers and tool groups compress without hiding actions |
| Below 768 px | Browse and review only; no graph mutation, delete, or generation controls |

Acceptance viewports are 1440x900, 1366x768, 920x900, and 375x812.

- every interactive target remains at least 40x40 px;
- tool docks respect safe-area insets;
- hover styles run only under `@media (hover: hover)`;
- the mobile review Canvas starts fitted to content and preserves pan and inspect;
- 200% zoom and long Chinese names must not hide project, canvas, save, back, or recovery actions;
- the first focusable control is a skip-to-content link outside the Canvas route chrome.

## 10. Accessibility Baseline

- body text contrast at least 4.5:1;
- large text and control boundaries at least 3:1;
- focus ring at least 3:1 against adjacent surfaces;
- `text-on-accent` contrast is at least 5.86:1 on accent, 7.11:1 on hover, and 4.55:1 on pressed; `text-muted` remains at least 4.53:1 on `surface-prominent`;
- icon buttons have `aria-label` and tooltips;
- Canvas has a synchronized DOM node list for screen readers and keyboard navigation;
- shortcuts are scoped to Canvas focus and described with `aria-keyshortcuts` where supported;
- state never relies on color alone;
- reduced motion and keyboard-only flows are acceptance requirements, not optional polish.

## 11. Agent Prompt Guide

Token reference:

```text
canvas: oklch(9.5% 0.018 292)
surface-1: oklch(14.5% 0.026 292)
surface-2: oklch(17.5% 0.030 292)
surface-3: oklch(21% 0.035 292)
text-primary: oklch(94% 0.012 292)
text-secondary: oklch(74% 0.024 292)
text-muted: oklch(62% 0.028 292)
text-on-accent: oklch(12% 0.020 292)
accent: oklch(65% 0.19 292)
accent-hover: oklch(70% 0.18 292)
accent-pressed: oklch(59% 0.20 292)
radius-sm: 8px
radius-md: 12px
```

Example implementation prompts:

1. Create the Canvas identity cluster on `oklch(14.5% 0.026 292)`, 12 px radius, 8 px internal gap, 13 px weight 550 text, project name in `oklch(94% 0.012 292)`, canvas name in `oklch(74% 0.024 292)`, 1 px `oklch(94% 0.015 292 / 0.06)` border, and a 2 px `oklch(72% 0.17 292 / 0.48)` focus ring.
2. Create a bottom tool dock with a 40 px minimum target, 8 px button radius, 12 px group gap, active item background `oklch(65% 0.19 292 / 0.14)`, active icon `oklch(65% 0.19 292)`, 120 ms transform and opacity transitions, and press scale 0.96.
3. Create an asset node at 320x240 px using `oklch(17.5% 0.030 292)`, 12 px radius, 1 px standard border, media preview first, 14 px weight 600 title, 12 px metadata, violet selection edge, and no white card or cyan port.
4. Create a conflict panel at 360 px width using `oklch(21% 0.035 292)`, 12 px radius, 16 px padding, danger icon `oklch(66% 0.19 24)`, 14 px primary title, 13 px body at 1.7 line height, and two 40 px actions for reload latest and preserve local copy.
5. Create the empty Canvas guide directly on `oklch(9.5% 0.018 292)` with one 15 px weight 600 title, one 13 px muted sentence, four 176x56 workflow starters containing real media thumbnails or labeled placeholders, 12 px gaps, and no surrounding hero card.

## 12. Aesthetic Review Gate

Before each visual handoff, verify:

- Revid is recognizable in the first viewport without relying on a logo;
- media or a real workflow is the strongest visual anchor;
- all light Phase 4 surfaces are absent from V2 Canvas;
- accent is violet rather than cyan or blue;
- no default gradient, glass, identical-card grid, or permanent empty panel remains;
- the interface still feels premium with decorative shadows disabled;
- desktop and 375 px review screenshots are inspected in Chinese;
- the real running browser, not source inspection alone, matches this document.
