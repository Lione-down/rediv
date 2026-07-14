import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canvasNodeWorldRect } from '../../src/components/canvas/canvas-geometry'
import { mapCanvasNode } from '../../src/modules/canvas/mappers'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { FIRST_CANVAS_ID, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-016-scenarios')

function rectsOverlap(left: ReturnType<typeof canvasNodeWorldRect>, right: ReturnType<typeof canvasNodeWorldRect>) {
  return left.left < right.left + right.width && left.left + left.width > right.left &&
    left.top < right.top + right.height && left.top + left.height > right.top
}

test('converging and branching scenario keeps typed geometry non-overlapping', () => {
  const document = createMultiScenarioState().documents[FIRST_CANVAS_ID]
  const nodes = document.nodes.map((node) => mapCanvasNode(node as never))
  const rects = nodes.map((node) => ({ id: node.id, rect: canvasNodeWorldRect(node, 'content') }))
  for (let left = 0; left < rects.length; left += 1) {
    for (let right = left + 1; right < rects.length; right += 1) {
      expect(rectsOverlap(rects[left].rect, rects[right].rect), `${rects[left].id} overlaps ${rects[right].id}`).toBe(false)
    }
  }
  expect(document.connections.filter((edge) => edge.target_node_id === 'generation-compose')).toHaveLength(4)
  expect(document.connections.filter((edge) => edge.source_node_id === 'generation-compose')).toHaveLength(6)
})

test('mixed image, video, lifecycle, and unavailable states render together', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+0')

  await expect(page.getByRole('img', { name: '图片素材' })).toHaveCount(2)
  await expect(page.getByRole('img', { name: '图片结果' })).toHaveCount(4)
  const video = page.locator('video[aria-label="视频结果"]')
  await expect(video).toBeVisible()
  await expect(page.getByText('图片结果暂未提供预览')).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: '媒体不可用' })).toBeVisible()
  await expect(page.locator('.node-status-overlay.is-running')).toHaveCount(1)
  await expect(page.locator('.node-status-overlay.is-warning')).toHaveCount(2)
  await expect(page.locator('.connection-line.active')).toHaveCount(10)
  await expect(page.locator('.connection-line.active').first()).toHaveCSS('stroke-dasharray', 'none')

  const ratios = await page.locator('.canvas-node-surface.is-media img').evaluateAll((images) =>
    images.filter((image) => (image as HTMLImageElement).naturalWidth > 0).map((image) => {
      const rect = image.closest('.canvas-node-surface')!.getBoundingClientRect()
      return Number((rect.width / rect.height).toFixed(2))
    }),
  )
  expect(ratios).toEqual(expect.arrayContaining([1.78, 1, 0.56]))

  const videoState = await video.evaluate(async (video: HTMLVideoElement) => {
    video.muted = true
    await video.play()
    await new Promise((resolvePlay) => setTimeout(resolvePlay, 120))
    return { duration: video.duration, paused: video.paused, width: video.videoWidth, height: video.videoHeight }
  })
  expect(videoState.duration).toBeGreaterThan(0)
  expect(videoState.paused).toBe(false)
  expect(videoState.width / videoState.height).toBeCloseTo(16 / 9, 1)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'mixed-topology-1440x900.png'), fullPage: true })
})

test('selection, editing, locked content, and supported viewports remain usable', async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900, name: '1440x900', readonly: false },
    { width: 1366, height: 768, name: '1366x768', readonly: false },
    { width: 920, height: 900, name: '920x900', readonly: false },
    { width: 375, height: 812, name: '375x812', readonly: true },
  ]
  await mkdir(evidenceDirectory, { recursive: true })
  for (const viewport of viewports) {
    await openResourceWorkspace(page, createMultiScenarioState(), viewport)
    const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
    await stage.focus()
    await page.keyboard.press('Control+0')
    await expect(stage).toHaveAttribute('aria-description', viewport.readonly ? '只读审阅模式' : '可编辑画布')
    await expect.poll(() => page.locator('.canvas-node-surface.is-media img').evaluateAll((images) => (
      images.filter((image) => (image as HTMLImageElement).naturalWidth > 0).length
    ))).toBe(5)
    await expect.poll(() => page.locator('video[aria-label="视频结果"]').evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(1)
    await page.screenshot({ path: resolve(evidenceDirectory, `topology-${viewport.name}-overview.png`), fullPage: true })
    if (!viewport.readonly) {
      await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
      await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
      await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toHaveCount(0)
      await expect(page.getByRole('region', { name: '节点内容编辑器' })).toBeVisible()
      if (viewport.width === 920) {
        expect((await page.locator('.n-drawer:visible').boundingBox())?.width).toBeGreaterThanOrEqual(359)
      }
      await expect(page.locator('.selection-toolbar')).toBeVisible()
    } else {
      await expect(page.getByRole('region', { name: '节点内容编辑器' })).toHaveCount(0)
      await expect(page.locator('.selection-toolbar')).toHaveCount(0)
      await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
      await page.getByRole('button', { name: '选择并定位 合并四路上下文生成' }).click()
      expect((await page.locator('.n-drawer:visible').boundingBox())?.width).toBeGreaterThanOrEqual(viewport.width - 1)
      await stage.focus()
      await page.keyboard.press('Control++')
      await page.keyboard.press('Control++')
      await page.keyboard.press('Control++')
    }
    await page.screenshot({ path: resolve(evidenceDirectory, `topology-${viewport.name}-detail.png`), fullPage: true })
  }
})
