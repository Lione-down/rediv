import { expect, test, type Page } from '@playwright/test'
import {
  FIRST_CANVAS_ID,
  documentPatches,
  createResourceMockState,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

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

  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const image = page.locator('.canvas-node-surface[data-node-id="result-existing"] img')
  const node = page.locator('.canvas-node-surface[data-node-id="result-existing"]')
  expect((await node.boundingBox())?.width).toBeCloseTo(560, 0)
  expect(await image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(0)
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight]))
    .toEqual([736, 1312])

  await expect.poll(async () => (await node.boundingBox())?.width ?? 0).toBeCloseTo(314, 0)
  for (const percent of [17, 36, 100, 200]) {
    await setZoom(page, percent)
    const rect = await node.boundingBox()
    if (!rect) throw new Error('Portrait node geometry is unavailable')
    const [inputPort, outputPort] = await Promise.all([
      portPoint(page, 'input'),
      portPoint(page, 'output'),
    ])
    expect(inputPort).not.toBeNull()
    expect(outputPort).not.toBeNull()
    expect(inputPort!.x).toBeCloseTo(rect.x, 0)
    expect(inputPort!.y).toBeCloseTo(rect.y + rect.height / 2, 0)
    expect(outputPort!.x).toBeCloseTo(rect.x + rect.width, 0)
    expect(outputPort!.y).toBeCloseTo(rect.y + rect.height / 2, 0)
  }

  await setZoom(page, 100)
  const rect = await node.boundingBox()
  const canvas = await page.locator('.canvas-surface').boundingBox()
  if (!rect || !canvas) throw new Error('Portrait node geometry is unavailable')

  const source = { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
  const target = { x: canvas.x + 760, y: canvas.y + 680 }
  await page.mouse.move(source.x, source.y)
  await page.mouse.down()
  await page.mouse.move(target.x, target.y, { steps: 8 })
  await page.mouse.up()

  await expect(page.getByRole('dialog', { name: '继续连接' })).toBeVisible()
})
