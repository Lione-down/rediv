import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-card-interaction')

test('accepted card interaction direction remains deterministic across required viewports', async ({ page }, testInfo) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  await expect(page.locator('.connection-line')).toHaveCount(0)
  await expect(page.locator('.connection-hit')).toHaveCount(0)
  await expect(page.locator('#canvas-edge-arrow')).toHaveCount(0)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 历史图片生成结果' }).click()
  await expect(page.locator('.connection-line').first()).toHaveCSS('stroke-width', '2.6px')
  await expect(page.locator('.connection-hit').first()).toHaveCSS('stroke-width', '20px')

  const presentation = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: {
        getNodeInteractionPresentation?: (nodeId: string) => Record<string, unknown> | null
      }
    }).__revidCanvasInspection?.getNodeInteractionPresentation?.('result-existing') ?? null
  ))
  expect(presentation).toMatchObject({
    state: 'selected', cornerRadius: 12, outlineWidth: 1.5, shadowTone: 'selected', portOpacity: 1, translateY: 0, scale: 1,
  })
  await expect(page.locator('.canvas-node-surface.is-media[data-node-id="result-existing"]')).toHaveCSS('border-radius', '12px')

  await mkdir(evidenceDirectory, { recursive: true })
  for (const viewport of [
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1366x768', width: 1366, height: 768 },
    { name: 'compact-920x900', width: 920, height: 900 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await expect(page.getByRole('toolbar', { name: '媒体节点操作' })).toBeVisible()
    const path = resolve(evidenceDirectory, `${viewport.name}.png`)
    await page.screenshot({ path })
    await testInfo.attach(viewport.name, { path, contentType: 'image/png' })
  }

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByText('浏览审阅模式', { exact: true })).toBeVisible()
  await expect(page.getByRole('toolbar', { name: '媒体节点操作' })).toHaveCount(0)
  await expect(page.locator('.canvas-node-surface.is-composer')).toHaveCount(0)
  const readonlyPresentation = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: {
        getNodeInteractionPresentation?: (nodeId: string) => Record<string, unknown> | null
      }
    }).__revidCanvasInspection?.getNodeInteractionPresentation?.('result-existing') ?? null
  ))
  expect(readonlyPresentation).toMatchObject({
    state: 'readonly', shadowTone: 'none', portOpacity: 0,
  })
  const mobilePath = resolve(evidenceDirectory, 'review-375x812.png')
  await page.screenshot({ path: mobilePath })
  await testInfo.attach('review-375x812', { path: mobilePath, contentType: 'image/png' })
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('attached work surface stays inside the actual stage when the project panel narrows it', async ({ page }) => {
  const state = createResourceMockState()
  const generation = state.documents['canvas-first'].nodes.find(
    (node) => node.id === 'generation-cover',
  )!
  generation.position_x = 800
  await openResourceWorkspace(page, state, { width: 1440, height: 900 })

  await page.getByRole('button', { name: '打开项目资源' }).click()
  await expect(page.getByRole('complementary', { name: '项目资源' })).toBeVisible()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()

  const stageRect = await page.locator('.workspace-stage').boundingBox()
  const surfaceRect = await page.locator('.canvas-card-work-surface').boundingBox()
  expect(stageRect).not.toBeNull()
  expect(surfaceRect).not.toBeNull()
  expect(surfaceRect!.x).toBeGreaterThanOrEqual(stageRect!.x + 32)
  expect(surfaceRect!.x + surfaceRect!.width).toBeLessThanOrEqual(
    stageRect!.x + stageRect!.width - 32,
  )
  expect(surfaceRect!.y).toBeGreaterThanOrEqual(stageRect!.y + 108)
  expect(surfaceRect!.y + surfaceRect!.height).toBeLessThanOrEqual(
    stageRect!.y + stageRect!.height - 108,
  )
})
