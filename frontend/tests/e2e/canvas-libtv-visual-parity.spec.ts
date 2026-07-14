import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canvasNodeWorldRect } from '../../src/components/canvas/canvas-geometry'
import { buildCanvasNodePresentation } from '../../src/components/canvas/canvas-node-presentation'
import type { CanvasNode } from '../../src/types/canvas'
import { createResourceMockState, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-014-final')

test('text, generation, and result nodes expose semantic presentation geometry', () => {
  const base = { x: 120, y: 80, width: 320, height: 180, title: 'Node', contentData: { serialization_version: 1 } }
  const text = { ...base, id: 'text', type: 'script', contentData: { ...base.contentData, subtype: 'script' } } satisfies CanvasNode
  const generation = { ...base, id: 'generation', type: 'generation', contentData: { ...base.contentData, subtype: 'image' } } satisfies CanvasNode
  const result = { ...base, id: 'result', type: 'result', contentData: { ...base.contentData, subtype: 'image', url: 'https://media.revid.test/result.png', width: 1600, height: 900 } } satisfies CanvasNode

  expect(buildCanvasNodePresentation(text).visualKind).toBe('text')
  expect(buildCanvasNodePresentation(generation).visualKind).toBe('generation')
  expect(buildCanvasNodePresentation(result)).toMatchObject({ visualKind: 'result', media: { aspectRatio: 16 / 9 } })
  expect(canvasNodeWorldRect(text, 'label').top).toBeLessThan(text.y)
  expect(canvasNodeWorldRect(text, 'composer').top).toBeGreaterThan(text.y + text.height)
})

test('result media has one visible surface, keeps its ratio, and edges are passive', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const image = page.getByRole('img', { name: '图片结果' })
  await expect(image).toBeVisible()
  const dimensions = await image.evaluate((element: HTMLImageElement) => {
    const rect = element.getBoundingClientRect()
    return { naturalRatio: element.naturalWidth / element.naturalHeight, renderedRatio: rect.width / rect.height }
  })
  expect(dimensions.naturalRatio).toBeCloseTo(16 / 9, 5)
  expect(dimensions.renderedRatio).toBeCloseTo(16 / 9, 1)
  await expect(page.getByRole('img', { name: '图片结果' })).toHaveCount(1)
  await expect(page.locator('.connection-hit')).toHaveCount(0)
  await expect(page.locator('.connection-layer')).toHaveCSS('pointer-events', 'none')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'canvas-media-and-passive-edges.png'), fullPage: true })
})

test('16:9, 1:1, and 9:16 media remain recognizable without stretching', async ({ page }) => {
  const cases = [
    { url: 'https://media.revid.test/landscape.png', width: 320, height: 180 },
    { url: 'https://media.revid.test/square.png', width: 240, height: 240 },
    { url: 'https://media.revid.test/portrait.png', width: 180, height: 320 },
  ]
  for (const item of cases) {
    const state = createResourceMockState()
    const result = state.documents['canvas-first'].nodes.find((node) => node.id === 'result-existing')!
    Object.assign(result.content as Record<string, unknown>, { url: item.url, width: item.width, height: item.height })
    await openResourceWorkspace(page, state)
    const image = page.getByRole('img', { name: '图片结果' })
    await expect(image).toBeVisible()
    const metrics = await image.evaluate((element: HTMLImageElement) => ({
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      objectFit: getComputedStyle(element).objectFit,
    }))
    expect(metrics).toEqual({ naturalWidth: item.width, naturalHeight: item.height, objectFit: 'contain' })
    expect(Math.abs(metrics.naturalWidth / metrics.naturalHeight - item.width / item.height)).toBeLessThan(1 / Math.max(item.width, item.height))
    await expect(page.getByRole('img', { name: '图片结果' })).toHaveCount(1)
  }
})

test('DOM media and composer scale from the shared world geometry at 10%, 100%, and 200%', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const zoom = page.getByLabel('缩放百分比')
  const surface = page.locator('.canvas-node-surface.is-media').first()
  const widths = new Map<number, number>()
  for (const percent of [100, 10, 200]) {
    await zoom.fill(String(percent))
    await zoom.press('Enter')
    await expect(zoom).toHaveValue(String(percent))
    widths.set(percent, (await surface.boundingBox())!.width)
  }
  expect(Math.abs(widths.get(10)! - widths.get(100)! * 0.1)).toBeLessThanOrEqual(1)
  expect(Math.abs(widths.get(200)! - widths.get(100)! * 2)).toBeLessThanOrEqual(1)
})

test('selected editable node opens a composer below the node content surface', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
  await page.getByRole('button', { name: '关闭画布内容与快捷键' }).click()
  const editor = page.getByRole('textbox', { name: '编辑镜头脚本内容' })
  const composer = page.getByRole('region', { name: '节点内容编辑器' })
  await expect(editor).toBeVisible()
  await expect(composer).toBeVisible()
  const rects = await page.locator('.canvas-node-surface.is-composer').evaluate((element) => {
    const composerRect = element.getBoundingClientRect()
    return { top: composerRect.top, height: composerRect.height }
  })
  expect(rects.height).toBeGreaterThan(80)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-node-composer.png'), fullPage: true })
})

test('accepted viewport matrix retains desktop editing and mobile review-only hierarchy', async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900, name: '1440x900', readonly: false },
    { width: 1366, height: 768, name: '1366x768', readonly: false },
    { width: 920, height: 900, name: '920x900', readonly: false },
    { width: 375, height: 812, name: '375x812', readonly: true },
  ]
  await mkdir(evidenceDirectory, { recursive: true })
  for (const viewport of viewports) {
    await openResourceWorkspace(page, createResourceMockState(), { width: viewport.width, height: viewport.height })
    const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
    await expect(stage).toHaveAttribute('aria-description', viewport.readonly ? '只读审阅模式' : '可编辑画布')
    await stage.focus()
    await page.keyboard.press('Control+0')
    await expect(page.getByRole('img', { name: '图片结果' })).toBeVisible()
    if (viewport.width === 920) {
      await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
      await page.getByRole('button', { name: '选择并定位 镜头脚本' }).click()
      const graphDialog = page.getByRole('dialog', { name: '画布内容与快捷键' })
      await graphDialog.getByRole('button', { name: '关闭画布内容与快捷键' }).evaluate((button: HTMLButtonElement) => button.click())
      await expect(graphDialog).toHaveCount(0)
      await expect(page.getByRole('region', { name: '节点内容编辑器' })).toBeVisible()
    }
    if (viewport.readonly) await expect(page.getByRole('textbox', { name: /编辑.*内容/ })).toHaveCount(0)
    await page.screenshot({ path: resolve(evidenceDirectory, `${viewport.name}.png`), fullPage: true })
  }
})
