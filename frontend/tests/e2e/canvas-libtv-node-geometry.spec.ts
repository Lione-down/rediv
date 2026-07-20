import { expect, test, type Page } from '@playwright/test'
import { documentPatches, createResourceMockState, openResourceWorkspace } from './canvas-resource-generation-fixture'

async function setZoom(page: Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

test('media body and node-local composer consume the same geometry at official target zooms', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const baselinePatches = documentPatches(state).length

  const mediaSurface = page.locator('.canvas-node-surface[data-node-id="result-existing"]')
  const mediaViewport = mediaSurface.locator('.canvas-node-media__viewport')

  for (const percent of [17, 36, 100, 200]) {
    await setZoom(page, percent)
    const scale = percent / 100
    const surface = await mediaSurface.boundingBox()
    const viewport = await mediaViewport.boundingBox()
    expect(surface).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(surface!.width).toBeCloseTo(320 * scale, 0)
    expect(surface!.height).toBeCloseTo(180 * scale, 0)
    expect(viewport!.width).toBeCloseTo(surface!.width, 0)
    expect(viewport!.height).toBeCloseTo(surface!.height, 0)
    expect(viewport!.x).toBeCloseTo(surface!.x, 0)
    expect(viewport!.y).toBeCloseTo(surface!.y, 0)
  }

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: /选择并定位.*镜头脚本/ }).click()
  const composer = page.locator('.canvas-node-surface.is-composer[data-node-id="script-source"]')

  for (const percent of [17, 36, 100, 200]) {
    await setZoom(page, percent)
    const scale = percent / 100
    const rect = await composer.boundingBox()
    expect(rect).not.toBeNull()
    expect(rect!.width).toBeCloseTo(320 * scale, 0)
    expect(rect!.height).toBeCloseTo(76 * scale, 0)
  }

  expect(documentPatches(state)).toHaveLength(baselinePatches)
})
