import { expect, test } from '@playwright/test'
import { v2CanvasNaiveTheme } from '../../src/assets/styles/v2-canvas-naive-theme'

test('Canvas Naive UI theme keeps parser-facing colors concrete', () => {
  const sections = [
    v2CanvasNaiveTheme.common,
    v2CanvasNaiveTheme.Button,
    v2CanvasNaiveTheme.Input,
    v2CanvasNaiveTheme.Drawer,
    v2CanvasNaiveTheme.Dropdown,
    v2CanvasNaiveTheme.Modal,
    v2CanvasNaiveTheme.Message,
    v2CanvasNaiveTheme.Notification,
    v2CanvasNaiveTheme.Dialog,
  ]

  for (const section of sections) {
    for (const [key, value] of Object.entries(section ?? {})) {
      const normalizedKey = key.toLowerCase()
      if (!normalizedKey.includes('color') && (
        !normalizedKey.startsWith('border') || normalizedKey.includes('radius')
      )) continue
      expect(String(value), `${key} must be parseable by Naive UI`).not.toContain('var(')
    }
  }
})
