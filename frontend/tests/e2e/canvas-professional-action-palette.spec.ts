import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-082')

async function openPalette(page: import('@playwright/test').Page) {
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('/')
  const palette = page.getByRole('dialog', { name: '专业操作' })
  await expect(palette).toBeVisible()
  return { palette, stage }
}

test('Canvas-owned Slash opens an accessible deterministic palette without mutation and restores focus', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const { palette, stage } = await openPalette(page)
  const search = palette.getByRole('combobox', { name: '搜索专业操作' })
  await expect(search).toBeFocused()
  await expect(search).toHaveAttribute('aria-controls', 'canvas-professional-action-listbox')
  await expect(palette.getByRole('listbox', { name: '可用专业操作' })).toBeVisible()
  await expect(palette.getByRole('option')).toHaveCount(4)
  await expect(palette.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
  await expect(palette.getByRole('option').first()).toHaveCSS('transition-duration', '0s')
  const accessibility = await new AxeBuilder({ page }).include('.professional-action-palette').analyze()
  expect(accessibility.violations.filter((violation) => (
    violation.impact === 'serious' || violation.impact === 'critical'
  ))).toEqual([])
  await mkdir(evidenceDirectory, { recursive: true })
  await palette.screenshot({ path: resolve(evidenceDirectory, 'professional-palette-1440.png') })
  expect(documentPatches(state)).toHaveLength(0)

  await search.fill('视频 node')
  await expect(palette.getByRole('option')).toHaveCount(1)
  await expect(palette.getByRole('option')).toContainText('新建视频生成节点')
  expect(documentPatches(state)).toHaveLength(0)

  await page.keyboard.press('Escape')
  await expect(palette).toHaveCount(0)
  await expect(stage).toBeFocused()
  expect(documentPatches(state)).toHaveLength(0)
})

test('palette keyboard execution creates one node through one document mutation', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const patchCount = documentPatches(state).length
  const { palette } = await openPalette(page)
  const search = palette.getByRole('combobox', { name: '搜索专业操作' })
  await search.fill('视频 node')
  await page.keyboard.press('Enter')
  await expect(palette).toHaveCount(0)
  await expect.poll(() => documentPatches(state).length).toBe(patchCount + 1)
  const created = state.documents['canvas-first'].nodes.filter((node) => (
    node.node_type === 'generation' && (node.content as Record<string, unknown>)?.subtype === 'video'
  ))
  expect(created).toHaveLength(1)
})

test('Slash ownership excludes editable, IME, Graph Access, and open drawer contexts', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })

  const { palette } = await openPalette(page)
  const box = await palette.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(920)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(900)
  await mkdir(evidenceDirectory, { recursive: true })
  await palette.screenshot({ path: resolve(evidenceDirectory, 'professional-palette-920.png') })
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
  const editor = page.locator('textarea.canvas-node-editor')
  await expect(editor).toBeVisible()
  const originalValue = await editor.inputValue()
  await editor.fill(`${originalValue}/`)
  await editor.dispatchEvent('keydown', { key: '/', code: 'Slash', bubbles: true })
  await expect(editor).toHaveValue(`${originalValue}/`)
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const patchCountAfterEdit = documentPatches(state).length

  await stage.focus()
  await stage.dispatchEvent('keydown', { key: '/', code: 'Slash', isComposing: true, bubbles: true })
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)

  await stage.focus()
  await page.keyboard.press('Shift+/')
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toBeVisible()
  await page.getByRole('button', { name: '关闭画布内容与快捷键' }).click()

  await page.getByRole('button', { name: '打开项目资源' }).click()
  await expect(page.locator('.n-drawer:visible')).toBeVisible()
  await stage.focus()
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(patchCountAfterEdit)
})

test('375px review-only Canvas never opens or executes the professional palette', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await expect(stage).toHaveAttribute('aria-description', '只读审阅模式')
  await stage.focus()
  await page.keyboard.press('/')
  await expect(page.getByRole('dialog', { name: '专业操作' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
})
