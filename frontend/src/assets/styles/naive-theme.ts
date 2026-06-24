/**
 * Naive UI dark theme overrides for Revid.
 *
 * Brand color: #6347C2 (oklch ~58% 0.115 270)
 * Derived tokens for hover / active / disabled / focus.
 *
 * Usage:
 *   import { naiveDarkTheme } from '@/assets/styles/naive-theme'
 *   // pass as prop to NConfigProvider in App.vue template
 */
import type { GlobalThemeOverrides } from 'naive-ui'

export const naiveDarkTheme: GlobalThemeOverrides = {
  common: {
    // ── Brand ───────────────────────────────────────────
    primaryColor: '#6347C2',
    primaryColorHover: '#7B61D6',
    primaryColorPressed: '#4E35A8',
    primaryColorSuppl: '#7B61D6',

    // ── Surface colors (dark) ───────────────────────────
    cardColor: '#1a1a24',
    bodyColor: '#13131a',
    popoverColor: '#1a1a24',
    modalColor: '#1a1a24',
    inputColor: '#1e1e2a',
    tableColor: '#13131a',
    tabColor: '#13131a',
    actionColor: '#1a1a24',
    invertedColor: '#0e0e12',

    // ── Text ────────────────────────────────────────────
    textColor1: '#f0eef6',
    textColor2: 'rgba(240, 238, 246, 0.72)',
    textColor3: 'rgba(240, 238, 246, 0.48)',
    textColorDisabled: 'rgba(240, 238, 246, 0.28)',
    placeholderColor: 'rgba(240, 238, 246, 0.36)',
    iconColor: 'rgba(240, 238, 246, 0.6)',
    iconColorHover: '#f0eef6',
    iconColorPressed: 'rgba(240, 238, 246, 0.8)',
    iconColorDisabled: 'rgba(240, 238, 246, 0.28)',
    clearColor: 'rgba(240, 238, 246, 0.48)',
    clearColorHover: 'rgba(240, 238, 246, 0.72)',
    clearColorPressed: 'rgba(240, 238, 246, 0.48)',

    // ── Border ──────────────────────────────────────────
    borderColor: 'rgba(240, 238, 246, 0.10)',
    dividerColor: 'rgba(240, 238, 246, 0.08)',
    closeIconColor: 'rgba(240, 238, 246, 0.6)',
    closeIconColorHover: '#f0eef6',
    closeColorHover: '#f0eef6',
    closeColorPressed: 'rgba(240, 238, 246, 0.8)',

    // ── Status ──────────────────────────────────────────
    warningColor: '#d4a03c',
    warningColorHover: '#e0b04a',
    warningColorPressed: '#b8892e',
    warningColorSuppl: '#d4a03c',
    successColor: '#4caf7d',
    successColorHover: '#5cc08e',
    successColorPressed: '#3d9165',
    successColorSuppl: '#4caf7d',
    errorColor: '#d9535c',
    errorColorHover: '#e06a71',
    errorColorPressed: '#c0454d',
    errorColorSuppl: '#d9535c',
    infoColor: '#8a88a0',
    infoColorHover: '#9a98b0',
    infoColorPressed: '#7a7890',
    infoColorSuppl: '#8a88a0',

    // ── Radius ──────────────────────────────────────────
    borderRadius: '8px',
    borderRadiusSmall: '6px',

    // ── Font ────────────────────────────────────────────
    fontSize: '14px',
    fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif',

    // ── Shadows ─────────────────────────────────────────
    boxShadow1: '0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadow2: '0 4px 16px rgba(0, 0, 0, 0.4)',
    boxShadow3: '0 8px 24px rgba(0, 0, 0, 0.4)',

    // ── Misc ────────────────────────────────────────────
    hoverColor: 'rgba(99, 71, 194, 0.12)',
    pressedColor: 'rgba(99, 71, 194, 0.20)',
    tableColorHover: 'rgba(99, 71, 194, 0.08)',
    progressRailColor: 'rgba(240, 238, 246, 0.08)',
    railColor: 'rgba(240, 238, 246, 0.06)',
    scrollbarColor: 'rgba(240, 238, 246, 0.24)',
    scrollbarColorHover: 'rgba(240, 238, 246, 0.36)',
    opacityDisabled: '0.28',
    inputColorDisabled: '#1a1a24',
    buttonColor2: 'rgba(240, 238, 246, 0.06)',
    buttonColor2Hover: 'rgba(240, 238, 246, 0.12)',
    buttonColor2Pressed: 'rgba(240, 238, 246, 0.18)',
  },

  // ── Button overrides ────────────────────────────────
  Button: {
    textColor: '#e8e6f0',
    textColorDisabled: 'rgba(232, 230, 240, 0.28)',
    hoverBorderColor: '#6347C2',
    activeBorderColor: '#4E35A8',
    focusBorderColor: '#6347C2',
    shadow1: '0 2px 8px rgba(0, 0, 0, 0.3)',
    shadow2: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },

  // ── Input overrides ─────────────────────────────────
  Input: {
    textColor: '#e8e6f0',
    placeholderColor: 'rgba(232, 230, 240, 0.48)',
    hoverBorderColor: '#6347C2',
    focusBorderColor: '#6347C2',
    boxShadowFocus: '0 0 0 3px rgba(99, 71, 194, 0.35)',
    clearColor: 'rgba(232, 230, 240, 0.48)',
  },

  // ── Drawer overrides ────────────────────────────────
  Drawer: {
    textColor: '#e8e6f0',
    titleTextColor: '#f0eef6',
    closeIconColor: 'rgba(232, 230, 240, 0.6)',
    closeIconColorHover: '#e8e6f0',
    closeColorHover: '#e8e6f0',
    boxShadow: '0 26px 72px rgba(0, 0, 0, 0.5)',
  },

  // ── Dropdown overrides ──────────────────────────────
  Dropdown: {
    optionTextColor: '#e8e6f0',
    optionTextColorHover: '#f0eef6',
    optionTextColorActive: '#f0eef6',
    optionColorHover: 'rgba(99, 71, 194, 0.12)',
    optionColorActive: 'rgba(99, 71, 194, 0.20)',
    color: '#1a1a24',
    dividerColor: 'rgba(232, 230, 240, 0.08)',
  },

  // ── Modal overrides ─────────────────────────────────
  Modal: {
    textColor: '#e8e6f0',
    boxShadow: '0 26px 72px rgba(0, 0, 0, 0.5)',
  },

  // ── Message overrides ───────────────────────────────
  Message: {
    textColor: '#e8e6f0',
    color: '#1a1a24',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    closeColorHover: '#e8e6f0',
  },

  // ── Notification overrides ──────────────────────────
  Notification: {
    textColor: '#e8e6f0',
    color: '#1a1a24',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    closeColorHover: '#e8e6f0',
  },

  // ── Dialog overrides ────────────────────────────────
  Dialog: {
    textColor: '#e8e6f0',
  },
}
