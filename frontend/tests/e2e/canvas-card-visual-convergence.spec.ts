import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { documentPatches, openResourceWorkspace } from './canvas-resource-generation-fixture'
import { createT6VisualConvergenceState, T6_VISUAL_NODE_IDS } from './canvas-card-visual-convergence-fixture'

interface ScreenRect { height: number; width: number; x: number; y: number }

function expectMeasuredMediaToolbar(toolbar: ScreenRect, node: ScreenRect, stage: ScreenRect) {
  const safeLeft = stage.x + 28
  const safeRight = stage.x + stage.width - 28
  const expectedWidth = Math.min(900, safeRight - safeLeft)
  const expectedLeft = Math.min(
    Math.max(node.x + node.width / 2 - expectedWidth / 2, safeLeft),
    safeRight - expectedWidth,
  )
  expect(toolbar.width).toBeCloseTo(expectedWidth, 0)
  expect(toolbar.x).toBeCloseTo(expectedLeft, 0)
}

function cssAlpha(value: string) {
  const functionalAlpha = value.match(/\/\s*([\d.]+)\s*\)?$/)
  if (functionalAlpha) return Number(functionalAlpha[1])
  const rgbaAlpha = value.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/)
  return rgbaAlpha ? Number(rgbaAlpha[1]) : 1
}

async function nodeRects(page: Page) {
  return page.locator('.canvas-surface').evaluate((element, nodeIds) => {
    const inspection = (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection
    return nodeIds.map((nodeId) => inspection?.getNodeScreenRect?.(nodeId) ?? null)
  }, [...T6_VISUAL_NODE_IDS])
}

async function fitRepresentativeGraph(page: Page) {
  const stage = page.locator('.canvas-surface')
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+0')
  const stageRect = await stage.boundingBox()
  const rects = await nodeRects(page)
  if (!stageRect || rects.some((rect) => !rect)) throw new Error('Representative graph geometry is unavailable')
  for (const rect of rects as ScreenRect[]) {
    expect(rect.x).toBeGreaterThanOrEqual(stageRect.x - 2)
    expect(rect.y).toBeGreaterThanOrEqual(stageRect.y - 2)
    expect(rect.x + rect.width).toBeLessThanOrEqual(stageRect.x + stageRect.width + 2)
    expect(rect.y + rect.height).toBeLessThanOrEqual(stageRect.y + stageRect.height + 2)
  }
  return { rects: rects as ScreenRect[], stage, stageRect }
}

async function selectRepresentativeResult(page: Page) {
  const target = await page.locator('.canvas-surface').evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeScreenRect?: (nodeId: string) => ScreenRect | null }
    }).__revidCanvasInspection?.getNodeScreenRect?.('visual-selected') ?? null
  ))
  if (!target) throw new Error('Representative result interaction target is unavailable')
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
  const closeDetails = page.getByRole('button', { name: '关闭节点详情' })
  if (await closeDetails.isVisible().catch(() => false)) await closeDetails.click()
}

test('approved dense selected-media composition is represented by one honest Revid runtime scene', async ({ page }, testInfo) => {
  const state = createT6VisualConvergenceState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  const { rects: visibleRects, stage, stageRect } = await fitRepresentativeGraph(page)
  const bounds = {
    left: Math.min(...visibleRects.map((rect) => rect.x)),
    top: Math.min(...visibleRects.map((rect) => rect.y)),
    right: Math.max(...visibleRects.map((rect) => rect.x + rect.width)),
    bottom: Math.max(...visibleRects.map((rect) => rect.y + rect.height)),
  }
  expect((bounds.right - bounds.left) / stageRect.width).toBeGreaterThanOrEqual(0.72)
  expect.soft((bounds.bottom - bounds.top) / stageRect.height, 'fitted vertical occupancy').toBeGreaterThanOrEqual(0.58)

  const representativeMediaHeight = visibleRects[T6_VISUAL_NODE_IDS.indexOf('visual-reference-top')].height
  for (const nodeId of ['visual-script-a', 'visual-note-a', 'visual-script-b', 'visual-brief-b', 'visual-script-c', 'visual-note-c', 'visual-generation']) {
    const height = visibleRects[T6_VISUAL_NODE_IDS.indexOf(nodeId as typeof T6_VISUAL_NODE_IDS[number])].height
    expect.soft(height / representativeMediaHeight, `${nodeId} fitted height ratio`).toBeGreaterThanOrEqual(0.85)
  }

  const gridToken = await stage.evaluate((element) => getComputedStyle(element).getPropertyValue('--v2-grid-dot').trim())
  expect.soft(cssAlpha(gridToken), 'enabled grid dot alpha').toBeGreaterThanOrEqual(0.2)
  await expect(stage).not.toHaveClass(/is-grid-hidden/)
  await expect(stage).toHaveCSS('background-image', /radial-gradient/)
  const emptyLeaferAlphas = await stage.locator('canvas').evaluateAll((elements: HTMLCanvasElement[]) => elements.map((element) => {
    const context = element.getContext('2d')
    return context?.getImageData(400, 150, 1, 1).data[3] ?? 255
  }))
  expect.soft(Math.max(...emptyLeaferAlphas), 'empty Leafer backdrop alpha').toBe(0)
  const emptyPointCover = await page.evaluate(({ x, y }) => {
    const surface = document.querySelector('.canvas-surface')
    return document.elementsFromPoint(x, y)
      .filter((element) => surface?.contains(element) && element !== surface)
      .map((element) => ({
        element: `${element.tagName.toLowerCase()}.${element.className}`,
        background: getComputedStyle(element).backgroundColor,
      }))
      .filter(({ background }) => background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent')
  }, { x: stageRect.x + 400, y: stageRect.y + 150 })
  expect.soft(emptyPointCover, 'empty point must expose the grid-bearing surface').toEqual([])

  const selectedSurface = page.locator('.canvas-node-surface[data-node-id="visual-selected"]')
  const selectedImage = selectedSurface.locator('img')
  const target = visibleRects[T6_VISUAL_NODE_IDS.indexOf('visual-selected')]
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.classList.contains('connection-hit') ?? false, {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2,
  })).toBe(true)
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
  await expect(page.getByRole('complementary', { name: '节点详情 人物主参考' })).toBeVisible()
  await page.getByRole('button', { name: '关闭节点详情' }).click()

  await expect.poll(() => stage.evaluate((element) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: { getNodeInteractionPresentation?: (nodeId: string) => { state?: string } | null }
    }).__revidCanvasInspection?.getNodeInteractionPresentation?.('visual-selected')?.state ?? ''
  ))).toBe('selected')
  await expect(selectedImage).toBeVisible()
  await expect.poll(() => selectedImage.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([640, 360])
  await expect(page.getByRole('complementary', { name: /节点详情/ })).toHaveCount(0)
  await page.getByRole('button', { name: '打开节点详情' }).click()
  await expect(page.getByRole('complementary', { name: '节点详情 人物主参考' })).toBeVisible()
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await expect(page.getByRole('complementary', { name: /节点详情/ })).toHaveCount(0)
  const selectedRect = await selectedSurface.boundingBox()
  if (!selectedRect) throw new Error('Selected representative media is unavailable')

  const toolbar = page.getByRole('toolbar', { name: '媒体节点操作' })
  const continuation = page.getByRole('region', { name: '以此结果继续创作' })
  await expect(toolbar).toBeVisible()
  await expect(continuation).toBeVisible()
  const toolbarRect = await toolbar.boundingBox()
  const continuationRect = await continuation.boundingBox()
  const workspaceRect = await page.locator('.workspace-stage').boundingBox()
  expect(toolbarRect).not.toBeNull()
  expect(continuationRect).not.toBeNull()
  expect(workspaceRect).not.toBeNull()
  expect(toolbarRect!.y + toolbarRect!.height).toBeLessThanOrEqual(selectedRect.y - 6)
  expect(continuationRect!.y).toBeGreaterThanOrEqual(selectedRect.y + selectedRect.height + 4)
  expectMeasuredMediaToolbar(toolbarRect!, selectedRect, workspaceRect!)
  expect(Math.abs(continuationRect!.x - selectedRect.x)).toBeLessThanOrEqual(2)
  const toolbarSurface = await toolbar.evaluate((element) => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, border: style.borderTopColor }
  })
  expect.soft(cssAlpha(toolbarSurface.background), 'media toolbar background alpha').toBeGreaterThanOrEqual(0.98)
  expect.soft(cssAlpha(toolbarSurface.border), 'media toolbar border alpha').toBeGreaterThanOrEqual(0.16)

  const focalEdge = page.getByRole('button', { name: '选择连线：人物主参考 到 生成视频' })
  await focalEdge.hover({ force: true })
  await expect(page.locator('.connection-flow[data-flow-reason="hover"]')).toHaveCount(1)
  await expect(page.locator('.connection-flow')).toHaveCount(1)

  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-visual-convergence')
  await mkdir(outputDirectory, { recursive: true })
  const screenshotPath = resolve(outputDirectory, 'desktop-1440x900.png')
  await page.screenshot({ path: screenshotPath })
  await testInfo.attach('t6-003-visual-convergence-1440x900', { path: screenshotPath, contentType: 'image/png' })
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('representative composition stays bounded and fail-closed across supported viewport classes', async ({ page }, testInfo) => {
  const cases = [
    { name: 'desktop-1366x768', width: 1366, height: 768, readonly: false },
    { name: 'compact-920x900', width: 920, height: 900, readonly: false },
    { name: 'readonly-375x812', width: 375, height: 812, readonly: true },
  ] as const
  const outputDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-visual-convergence')
  await mkdir(outputDirectory, { recursive: true })

  for (const viewport of cases) {
    const state = createT6VisualConvergenceState()
    await openResourceWorkspace(page, state, { width: viewport.width, height: viewport.height }, { enableCanvasInspection: true })
    await fitRepresentativeGraph(page)
    await selectRepresentativeResult(page)
    await expect(page.getByRole('complementary', { name: /节点详情/ })).toHaveCount(0)

    const continuation = page.getByRole('region', { name: '以此结果继续创作' })
    if (viewport.readonly) {
      await expect(continuation).toHaveCount(0)
      await expect(page.getByRole('button', { name: /以此结果创建/ })).toHaveCount(0)
      await expect(page.getByRole('toolbar', { name: '媒体节点操作' })).toHaveCount(0)
    } else {
      await expect(continuation).toBeVisible()
      const box = await continuation.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height)
      const [toolbarBox, selectedBox, workspaceBox] = await Promise.all([
        page.getByRole('toolbar', { name: '媒体节点操作' }).boundingBox(),
        page.locator('.canvas-node-surface[data-node-id="visual-selected"]').boundingBox(),
        page.locator('.workspace-stage').boundingBox(),
      ])
      if (!toolbarBox || !selectedBox || !workspaceBox) throw new Error('Viewport toolbar geometry is unavailable')
      expectMeasuredMediaToolbar(toolbarBox, selectedBox, workspaceBox)
    }

    const screenshotPath = resolve(outputDirectory, `${viewport.name}.png`)
    await page.screenshot({ path: screenshotPath })
    await testInfo.attach(viewport.name, { path: screenshotPath, contentType: 'image/png' })
    expect(documentPatches(state)).toHaveLength(0)
  }
})
