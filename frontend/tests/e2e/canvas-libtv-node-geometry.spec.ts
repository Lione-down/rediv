import { expect, test, type Page } from '@playwright/test'
import {
  FIRST_CANVAS_ID,
  addEarlierVariant,
  documentPatches,
  createResourceMockState,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

interface ScreenRect { height: number; width: number; x: number; y: number }

async function setZoom(page: Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

async function portPoint(page: Page, direction: 'input' | 'output') {
  return page.locator('.canvas-surface').evaluate((element, requestedDirection) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: {
        getPortScreenPoint: (nodeId: string, direction: 'input' | 'output', portId: string) => { x: number; y: number } | null
      }
    }).__revidCanvasInspection?.getPortScreenPoint(
      'result-existing', requestedDirection, requestedDirection === 'input' ? 'in' : 'out',
    ) ?? null
  ), direction)
}

async function rendererRect(page: Page) {
  return page.locator('.canvas-surface').evaluate((element) => {
    const inspection = (element as HTMLElement & {
      __revidCanvasInspection?: {
        getNodeScreenRect: (nodeId: string) => ScreenRect | null
      }
    }).__revidCanvasInspection
    return inspection?.getNodeScreenRect('result-existing') ?? null
  })
}

async function existingConnectionTargetPoint(page: Page) {
  const hit = page.getByRole('button', { name: /封面生成.*历史图片生成结果/ })
  const path = hit.locator('xpath=following-sibling::*[contains(concat(" ", normalize-space(@class), " "), " connection-line ")]')
  return path.evaluate((element) => {
    const pathElement = element as SVGPathElement
    const point = pathElement.getPointAtLength(pathElement.getTotalLength())
    const matrix = pathElement.getScreenCTM()
    if (!matrix) return null
    const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix)
    return { x: screenPoint.x, y: screenPoint.y }
  })
}

function expectRectWithin(actual: ScreenRect | null, expected: ScreenRect, tolerance = 2) {
  expect(actual).not.toBeNull()
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual![key] - expected[key])).toBeLessThanOrEqual(tolerance)
  }
}

test('media body and node-local composer consume the same geometry at official target zooms', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
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

test('portrait metadata keeps the existing output port on the visible node boundary', async ({ page }) => {
  const state = createResourceMockState()
  const portrait = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-existing')!
  portrait.width = 560
  portrait.height = 560
  portrait.content = {
    ...portrait.content,
    url: 'https://media.revid.test/portrait-736x1312.png',
    aspect_ratio: 1,
  }
  delete portrait.content.width
  delete portrait.content.height
  state.assets.find((asset) => asset.id === 'asset-generated')!.url = 'https://media.revid.test/portrait-736x1312.png'
  addEarlierVariant(state)
  state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'result-earlier-variant')!.position_y = 900
  portrait.status = 'success'

  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const image = page.locator('.canvas-node-surface[data-node-id="result-existing"] img')
  const node = page.locator('.canvas-node-surface[data-node-id="result-existing"]')
  expect((await node.boundingBox())?.width).toBeCloseTo(560, 0)
  expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(0)
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight]))
    .toEqual([736, 1312])

  await expect.poll(async () => (await node.boundingBox())?.width ?? 0).toBeCloseTo(314, 0)
  await expect.poll(() => documentPatches(state).length).toBe(2)
  const metadataPatches = documentPatches(state)
  for (const patch of metadataPatches) {
    const body = patch.body as Record<string, unknown>
    expect(body.connection_upserts).toEqual([])
    expect(body.connection_deletes).toEqual([])
    expect(body.node_deletes).toEqual([])
    expect(body.node_upserts).toHaveLength(1)
  }
  const baselinePatches = metadataPatches.length
  const selectionTarget = await node.boundingBox()
  const selectionSurface = await page.locator('.canvas-surface').boundingBox()
  if (!selectionTarget || !selectionSurface) throw new Error('Portrait node geometry is unavailable')
  await page.locator('.canvas-surface').click({
    force: true,
    position: {
      x: selectionTarget.x - selectionSurface.x + selectionTarget.width / 2,
      y: selectionTarget.y - selectionSurface.y + selectionTarget.height / 2,
    },
  })
  const toolbar = page.getByRole('toolbar', { name: '媒体节点操作' })
  const versionStack = page.getByLabel('2 个生成结果版本')
  const statusOverlay = page.locator('.node-status-overlay')
  await expect(toolbar).toBeVisible()
  await expect(versionStack).toBeVisible()
  await expect(statusOverlay).toHaveCount(1)

  for (const percent of [17, 36, 100, 200]) {
    await setZoom(page, percent)
    const rect = await node.boundingBox()
    if (!rect) throw new Error('Portrait node geometry is unavailable')
    const [nodeVisual, inputPort, outputPort, connectionTarget] = await Promise.all([
      rendererRect(page),
      portPoint(page, 'input'),
      portPoint(page, 'output'),
      existingConnectionTargetPoint(page),
    ])
    expectRectWithin(nodeVisual, rect)
    expect(inputPort).not.toBeNull()
    expect(outputPort).not.toBeNull()
    expect(connectionTarget).not.toBeNull()
    expect(inputPort!.x).toBeCloseTo(rect.x, 0)
    expect(inputPort!.y).toBeCloseTo(rect.y + rect.height / 2, 0)
    expect(outputPort!.x).toBeCloseTo(rect.x + rect.width, 0)
    expect(outputPort!.y).toBeCloseTo(rect.y + rect.height / 2, 0)
    expect(connectionTarget!.x).toBeCloseTo(inputPort!.x, 0)
    expect(connectionTarget!.y).toBeCloseTo(inputPort!.y, 0)
    for (const layer of [toolbar, statusOverlay]) {
      const layerRect = await layer.boundingBox()
      expect(layerRect).not.toBeNull()
      expect(Math.abs(layerRect!.x - rect.x)).toBeLessThanOrEqual(2)
      expect(Math.abs(layerRect!.width - rect.width)).toBeLessThanOrEqual(2)
    }
    const versionRect = await versionStack.boundingBox()
    expect(versionRect).not.toBeNull()
    expect(versionRect!.x - rect.x).toBeGreaterThanOrEqual(4)
    expect(versionRect!.x - rect.x).toBeLessThanOrEqual(8)
    expect(versionRect!.y - rect.y).toBeGreaterThanOrEqual(4)
    expect(versionRect!.y - rect.y).toBeLessThanOrEqual(8)
    expect(Math.abs(versionRect!.width - rect.width)).toBeLessThanOrEqual(2)
  }

  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await setZoom(page, 100)
  const rect = await node.boundingBox()
  const canvas = await page.locator('.canvas-surface').boundingBox()
  if (!rect || !canvas) throw new Error('Portrait node geometry is unavailable')

  const source = { x: rect.x + rect.width + 12, y: rect.y + rect.height / 2 }
  const target = { x: canvas.x + 760, y: canvas.y + 680 }
  await page.mouse.move(source.x, source.y)
  await page.mouse.down()
  await page.mouse.move(target.x, target.y, { steps: 8 })
  await page.mouse.up()

  await expect(page.getByRole('dialog', { name: '继续连接' })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})
