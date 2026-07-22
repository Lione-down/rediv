import { expect, test, type Locator, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  FIRST_CANVAS_ID,
  addEarlierVariant,
  documentPatches,
  createResourceMockState,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

interface ScreenRect { height: number; width: number; x: number; y: number }

const MEDIA_TOOLBAR_TARGET_WIDTH_PX = 900
const MEDIA_TOOLBAR_SAFE_MARGIN_PX = 12
const CANVAS_VIEWPORT_HORIZONTAL_INSET_PX = 16

async function setZoom(page: Page, percent: number) {
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill(String(percent))
  await zoom.press('Enter')
  await expect(zoom).toHaveValue(String(percent))
}

async function portPoint(page: Page, direction: 'input' | 'output', nodeId = 'generation-cover') {
  return page.locator('.canvas-surface').evaluate((element, request) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: {
        getPortScreenPoint: (nodeId: string, direction: 'input' | 'output', portId: string) => { x: number; y: number } | null
      }
    }).__revidCanvasInspection?.getPortScreenPoint(
       request.nodeId, request.direction, request.direction === 'input' ? 'prompt' : 'out',
    ) ?? null
  ), { direction, nodeId })
}

async function portMarkerPoint(page: Page, direction: 'input' | 'output', nodeId = 'generation-cover') {
  return page.locator('.canvas-surface').evaluate((element, request) => (
    (element as HTMLElement & {
      __revidCanvasInspection?: {
        getPortMarkerScreenPoint: (
          nodeId: string, direction: 'input' | 'output', portId: string,
        ) => { x: number; y: number } | null
      }
    }).__revidCanvasInspection?.getPortMarkerScreenPoint(
      request.nodeId, request.direction, request.direction === 'input' ? 'prompt' : 'out',
    ) ?? null
  ), { direction, nodeId })
}

async function expectPortMarkerCentered(page: Page, expectedPort: { x: number; y: number }) {
  await expect.poll(() => portMarkerPoint(page, 'output')).toEqual(expect.objectContaining({
    x: expect.closeTo(expectedPort.x, 0),
    y: expect.closeTo(expectedPort.y, 0),
  }))
}

async function edgeScreenStart(edge: Locator) {
  return edge.evaluate((element: SVGPathElement) => {
    const matrix = element.getScreenCTM()
    if (!matrix) return null
    const point = element.getPointAtLength(0)
    const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix)
    return { x: screenPoint.x, y: screenPoint.y }
  })
}

async function edgeScreenEnd(edge: Locator) {
  return edge.evaluate((element: SVGPathElement) => {
    const matrix = element.getScreenCTM()
    if (!matrix) return null
    const point = element.getPointAtLength(element.getTotalLength())
    const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix)
    return { x: screenPoint.x, y: screenPoint.y }
  })
}

async function rendererRect(page: Page, nodeId = 'generation-cover') {
  return page.locator('.canvas-surface').evaluate((element, requestedNodeId) => {
    const inspection = (element as HTMLElement & {
      __revidCanvasInspection?: {
        getNodeScreenRect: (nodeId: string) => ScreenRect | null
      }
    }).__revidCanvasInspection
    return inspection?.getNodeScreenRect(requestedNodeId) ?? null
  }, nodeId)
}

function expectRectWithin(actual: ScreenRect | null, expected: ScreenRect, tolerance = 2) {
  expect(actual).not.toBeNull()
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual![key] - expected[key])).toBeLessThanOrEqual(tolerance)
  }
}

function expectViewportStableToolbar(toolbar: ScreenRect, node: ScreenRect, surface: ScreenRect) {
  const safeLeft = surface.x + CANVAS_VIEWPORT_HORIZONTAL_INSET_PX + MEDIA_TOOLBAR_SAFE_MARGIN_PX
  const safeRight = surface.x + surface.width - CANVAS_VIEWPORT_HORIZONTAL_INSET_PX - MEDIA_TOOLBAR_SAFE_MARGIN_PX
  const expectedWidth = Math.min(MEDIA_TOOLBAR_TARGET_WIDTH_PX, safeRight - safeLeft)
  const desiredLeft = node.x + node.width / 2 - expectedWidth / 2
  const expectedLeft = Math.min(Math.max(desiredLeft, safeLeft), safeRight - expectedWidth)
  expect(toolbar.width).toBeCloseTo(expectedWidth, 0)
  expect(toolbar.x).toBeCloseTo(expectedLeft, 0)
  expect(toolbar.x).toBeGreaterThanOrEqual(safeLeft - 1)
  expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(safeRight + 1)
  expect(toolbar.height).toBeGreaterThanOrEqual(48)
  expect(toolbar.height).toBeLessThanOrEqual(52)
}

async function expectHorizontalToolbarRhythm(toolbar: Locator) {
  const rhythm = await toolbar.evaluate((element) => {
    const action = element.querySelector<HTMLElement>('.canvas-media-toolbar__action')!
    const icon = action.querySelector<SVGElement>('svg')!
    const label = action.querySelector<HTMLElement>('span')!
    const actionRect = action.getBoundingClientRect()
    const iconRect = icon.getBoundingClientRect()
    const labelRect = label.getBoundingClientRect()
    return {
      actionDisplay: getComputedStyle(action).display,
      actionFlexDirection: getComputedStyle(action).flexDirection,
      actionHeight: actionRect.height,
      iconLabelCenterDelta: Math.abs(
        (iconRect.top + iconRect.height / 2) - (labelRect.top + labelRect.height / 2),
      ),
      labelGap: labelRect.left - iconRect.right,
      overflow: element.scrollWidth - element.clientWidth,
    }
  })
  expect(rhythm.actionDisplay).toBe('flex')
  expect(rhythm.actionFlexDirection).toBe('row')
  expect(rhythm.actionHeight).toBeGreaterThanOrEqual(36)
  expect(rhythm.iconLabelCenterDelta).toBeLessThanOrEqual(1.5)
  expect(rhythm.labelGap).toBeGreaterThanOrEqual(4)
  expect(rhythm.overflow).toBeLessThanOrEqual(1)
}

test('media body and node-local composer consume the same geometry at official target zooms', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length

  const mediaSurface = page.locator('.canvas-node-surface[data-node-id="generation-cover"]')
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

test('output plus floats outside in X/Y while outgoing paths stay on the shared boundary anchor', async ({ page }, testInfo) => {
  const state = createResourceMockState()
  const document = state.documents[FIRST_CANVAS_ID]
  const source = document.nodes.find((candidate) => candidate.id === 'generation-cover')!
  const edgeTemplate = document.connections[0]
  document.nodes = document.nodes.filter((candidate) => candidate.id !== 'script-source')
  document.nodes.push({
    ...source,
    id: 'elastic-target-top',
    content: { title: '灵动目标上', subtype: 'video', serialization_version: 1, text: '' },
    position_x: 760,
    position_y: 40,
    status: 'idle',
  }, {
    ...source,
    id: 'elastic-target-bottom',
    content: { title: '灵动目标下', subtype: 'video', serialization_version: 1, text: '' },
    position_x: 760,
    position_y: 440,
    status: 'idle',
  })
  document.connections.push({
    ...edgeTemplate,
    id: 'connection-elastic-top',
    target_node_id: 'elastic-target-top',
    target_port: 'prompt',
    metadata: { input_order: 1 },
  }, {
    ...edgeTemplate,
    id: 'connection-elastic-bottom',
    target_node_id: 'elastic-target-bottom',
    target_port: 'media',
    metadata: { input_order: 2 },
  })
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  await setZoom(page, 100)
  const baselinePatches = documentPatches(state).length

  const node = await rendererRect(page)
  const topTarget = await rendererRect(page, 'elastic-target-top')
  const bottomTarget = await rendererRect(page, 'elastic-target-bottom')
  const resting = await portPoint(page, 'output')
  expect(node).not.toBeNull()
  expect(topTarget).not.toBeNull()
  expect(bottomTarget).not.toBeNull()
  expect(resting).not.toBeNull()
  expect(resting!.y).toBeCloseTo(node!.y + node!.height / 2, 0)
  expect(resting!.x).toBeGreaterThan(node!.x + node!.width)
  await expectPortMarkerCentered(page, resting!)

  const topEdge = page.getByRole('button', { name: '选择连线：封面生成 到 灵动目标上' })
  const bottomEdge = page.getByRole('button', { name: '选择连线：封面生成 到 灵动目标下' })
  await expect(topEdge).toBeVisible()
  await expect(bottomEdge).toBeVisible()
  const fixedBoundaryAnchor = { x: node!.x + node!.width, y: node!.y + node!.height / 2 }
  const expectEdgesAtBoundary = async () => {
    await expect.poll(() => edgeScreenStart(topEdge)).toEqual(expect.objectContaining({
      x: expect.closeTo(fixedBoundaryAnchor.x, 0), y: expect.closeTo(fixedBoundaryAnchor.y, 0),
    }))
    await expect.poll(() => edgeScreenStart(bottomEdge)).toEqual(expect.objectContaining({
      x: expect.closeTo(fixedBoundaryAnchor.x, 0), y: expect.closeTo(fixedBoundaryAnchor.y, 0),
    }))
  }

  const captureClip = {
    x: Math.max(0, Math.floor(Math.min(node!.x, topTarget!.x, bottomTarget!.x) - 80)),
    y: Math.max(0, Math.floor(Math.min(node!.y, topTarget!.y, bottomTarget!.y) - 80)),
    width: Math.min(1440, Math.ceil(Math.max(
      node!.x + node!.width, topTarget!.x + topTarget!.width, bottomTarget!.x + bottomTarget!.width,
    ) + 80)) - Math.max(0, Math.floor(Math.min(node!.x, topTarget!.x, bottomTarget!.x) - 80)),
    height: Math.min(900, Math.ceil(Math.max(
      node!.y + node!.height, topTarget!.y + topTarget!.height, bottomTarget!.y + bottomTarget!.height,
    ) + 80)) - Math.max(0, Math.floor(Math.min(node!.y, topTarget!.y, bottomTarget!.y) - 80)),
  }
  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-detached-output')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.mouse.move(4, 4)
  await expectEdgesAtBoundary()
  const restingPath = resolve(evidenceDirectory, '01-resting-shared-anchor.png')
  await page.screenshot({ path: restingPath, animations: 'disabled', clip: captureClip })
  await testInfo.attach('elastic-output-resting', { path: restingPath, contentType: 'image/png' })

  const acquisitionCenter = { x: node!.x + node!.width + 40, y: node!.y + node!.height / 2 }
  const following = { x: acquisitionCenter.x + 12, y: acquisitionCenter.y - 8 }
  await page.mouse.move(following.x, following.y)
  await expect.poll(() => portPoint(page, 'output')).toEqual(expect.objectContaining({
    x: expect.closeTo(following.x, 0),
    y: expect.closeTo(following.y, 0),
  }))
  await expectPortMarkerCentered(page, following)
  await expectEdgesAtBoundary()
  const followingPath = resolve(evidenceDirectory, '02-following-shared-anchor.png')
  await page.screenshot({ path: followingPath, animations: 'disabled', clip: captureClip })
  await testInfo.attach('elastic-output-following', { path: followingPath, contentType: 'image/png' })

  await page.mouse.down()
  await page.mouse.move(following.x + 80, following.y + 40)
  const draft = page.locator('path.draft')
  await expect(draft).toBeVisible()
  await expect.poll(() => edgeScreenStart(draft)).toEqual(expect.objectContaining({
    x: expect.closeTo(fixedBoundaryAnchor.x, 0),
    y: expect.closeTo(fixedBoundaryAnchor.y, 0),
  }))
  await page.mouse.up()
  await page.keyboard.press('Escape')

  const distantPointer = { x: acquisitionCenter.x + 32, y: acquisitionCenter.y + 20 }
  await page.mouse.move(distantPointer.x, distantPointer.y)
  const distance = Math.hypot(distantPointer.x - acquisitionCenter.x, distantPointer.y - acquisitionCenter.y)
  const clamped = {
    x: acquisitionCenter.x + (distantPointer.x - acquisitionCenter.x) * 30 / distance,
    y: acquisitionCenter.y + (distantPointer.y - acquisitionCenter.y) * 30 / distance,
  }
  await expect.poll(() => portPoint(page, 'output')).toEqual(expect.objectContaining({
    x: expect.closeTo(clamped.x, 0),
    y: expect.closeTo(clamped.y, 0),
  }))
  await expectPortMarkerCentered(page, clamped)
  await expectEdgesAtBoundary()

  await page.mouse.move(node!.x + node!.width + 90, node!.y + node!.height / 2)
  await expect.poll(() => portPoint(page, 'output')).toEqual(expect.objectContaining({
    x: expect.closeTo(resting!.x, 0),
    y: expect.closeTo(resting!.y, 0),
  }))
  await expectPortMarkerCentered(page, resting!)
  await expectEdgesAtBoundary()
  const resetPath = resolve(evidenceDirectory, '03-reset-shared-anchor.png')
  await page.screenshot({ path: resetPath, animations: 'disabled', clip: captureClip })
  await testInfo.attach('elastic-output-reset', { path: resetPath, contentType: 'image/png' })
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('prompt and media paths converge on one visible materialized input anchor', async ({ page }, testInfo) => {
  const state = createResourceMockState()
  const document = state.documents[FIRST_CANVAS_ID]
  const target = document.nodes.find((candidate) => candidate.id === 'generation-cover')!
  const firstSource = document.nodes.find((candidate) => candidate.id === 'script-source')!
  const edgeTemplate = document.connections[0]
  target.position_x = 760
  target.position_y = 260
  firstSource.position_x = 100
  firstSource.position_y = 80
  document.nodes.push({
    ...firstSource,
    id: 'script-source-reference',
    content: { ...firstSource.content, title: '补充参考' },
    position_x: 100,
    position_y: 500,
  })
  document.connections.push({
    ...edgeTemplate,
    id: 'connection-shared-prompt',
    source_node_id: 'script-source',
    source_port: 'out',
    target_node_id: 'generation-cover',
    target_port: 'prompt',
    metadata: { input_order: 1 },
  }, {
    ...edgeTemplate,
    id: 'connection-shared-media',
    source_node_id: 'script-source-reference',
    source_port: 'out',
    target_node_id: 'generation-cover',
    target_port: 'media',
    metadata: { input_order: 2 },
  })

  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  await setZoom(page, 100)
  const baselinePatches = documentPatches(state).length
  const [targetRect, firstSourceRect, secondSourceRect, inputPoint] = await Promise.all([
    rendererRect(page),
    rendererRect(page, 'script-source'),
    rendererRect(page, 'script-source-reference'),
    portPoint(page, 'input'),
  ])
  expect(targetRect).not.toBeNull()
  expect(firstSourceRect).not.toBeNull()
  expect(secondSourceRect).not.toBeNull()
  expect(inputPoint).not.toBeNull()
  expect(inputPoint!.x).toBeCloseTo(targetRect!.x, 0)
  expect(inputPoint!.y).toBeCloseTo(targetRect!.y + targetRect!.height / 2, 0)

  const promptEdge = page.locator('.connection-hit[aria-label*="镜头脚本 到 封面生成"]')
  const mediaEdge = page.locator('.connection-hit[aria-label*="补充参考 到 封面生成"]')
  await expect(promptEdge).toBeVisible()
  await expect(mediaEdge).toBeVisible()
  for (const edge of [promptEdge, mediaEdge]) {
    await expect.poll(() => edgeScreenEnd(edge)).toEqual(expect.objectContaining({
      x: expect.closeTo(inputPoint!.x, 0),
      y: expect.closeTo(inputPoint!.y, 0),
    }))
  }
  expect(document.connections.filter((connection) => (
    connection.id === 'connection-shared-prompt' || connection.id === 'connection-shared-media'
  )).map((connection) => connection.target_port)).toEqual(['prompt', 'media'])
  await expect(page.locator('.canvas-node-surface[data-node-id="generation-cover"]')).toHaveCount(1)
  await expect(page.locator('.canvas-node-surface[data-node-id="result-existing"]')).toHaveCount(0)

  const captureLeft = Math.max(0, Math.floor(Math.min(firstSourceRect!.x, secondSourceRect!.x) - 80))
  const captureTop = Math.max(0, Math.floor(Math.min(firstSourceRect!.y, targetRect!.y) - 80))
  const captureRight = Math.min(1440, Math.ceil(targetRect!.x + targetRect!.width + 80))
  const captureBottom = Math.min(900, Math.ceil(Math.max(
    secondSourceRect!.y + secondSourceRect!.height,
    targetRect!.y + targetRect!.height,
  ) + 80))
  const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't6-003-shared-input')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.mouse.move(4, 4)
  const screenshotPath = resolve(evidenceDirectory, 'materialized-prompt-media-shared-input.png')
  await page.screenshot({
    path: screenshotPath,
    animations: 'disabled',
    clip: {
      x: captureLeft,
      y: captureTop,
      width: captureRight - captureLeft,
      height: captureBottom - captureTop,
    },
  })
  await testInfo.attach('materialized-shared-input', { path: screenshotPath, contentType: 'image/png' })
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('portrait metadata keeps the detached output control outside the current visible node boundary', async ({ page }) => {
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
  const image = page.locator('.canvas-node-surface[data-node-id="generation-cover"] img')
  const node = page.locator('.canvas-node-surface[data-node-id="generation-cover"]')
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
  const surface = await page.locator('.workspace-stage').boundingBox()
  if (!surface) throw new Error('Canvas surface geometry is unavailable')
  const statusOverlay = page.locator('.node-status-overlay')
  await expect(toolbar).toBeVisible()
  await expect(page.getByLabel('2 个生成结果版本')).toHaveCount(0)
  await expect(statusOverlay).toHaveCount(0)

  for (const percent of [17, 36, 100, 200]) {
    await setZoom(page, percent)
    const rect = await node.boundingBox()
    if (!rect) throw new Error('Portrait node geometry is unavailable')
    const [nodeVisual, inputPort, outputPort] = await Promise.all([
      rendererRect(page),
      portPoint(page, 'input'),
      portPoint(page, 'output'),
    ])
    expectRectWithin(nodeVisual, rect)
    expect(inputPort).not.toBeNull()
    expect(outputPort).not.toBeNull()
    expect(inputPort!.x).toBeCloseTo(rect.x, 0)
    expect(inputPort!.y).toBeCloseTo(rect.y + rect.height / 2, 0)
    expect(outputPort!.x).toBeCloseTo(rect.x + rect.width + 15 * percent / 100, 0)
    expect(outputPort!.y).toBeCloseTo(rect.y + rect.height / 2, 0)
    const toolbarRect = await toolbar.boundingBox()
    expect(toolbarRect).not.toBeNull()
    expectViewportStableToolbar(toolbarRect!, rect, surface)
    await expectHorizontalToolbarRhythm(toolbar)
  }

  await setZoom(page, 100)
  await toolbar.getByLabel('打开节点详情').click()
  await expect(page.getByRole('button', { name: '关闭节点详情' })).toBeVisible()
  await page.getByRole('button', { name: '关闭节点详情' }).click()
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

test('source-attached media toolbar clamps above a narrow top-clearance collision without covering its header or composer', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'generation-cover')!
  source.position_y = 133
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  const nodeRect = await rendererRect(page)
  const canvasRect = await page.locator('.canvas-surface').boundingBox()
  const surfaceRect = await page.locator('.workspace-stage').boundingBox()
  if (!nodeRect || !canvasRect || !surfaceRect) throw new Error('Media placement geometry is unavailable')
  await page.locator('.canvas-surface').click({
    force: true,
    position: { x: nodeRect.x - canvasRect.x + nodeRect.width / 2, y: nodeRect.y - canvasRect.y + nodeRect.height / 2 },
  })

  const toolbarRect = await page.getByRole('toolbar', { name: '媒体节点操作' }).boundingBox()
  const composerRect = await page.locator('.canvas-card-work-surface').boundingBox()
  const metadataRect = await page.locator('.canvas-node-media__metadata').boundingBox()
  expect(toolbarRect).not.toBeNull()
  expect(composerRect).not.toBeNull()
  expect(metadataRect).not.toBeNull()
  expect(toolbarRect!.y).toBeGreaterThanOrEqual(surfaceRect.y)
  expect(toolbarRect!.y + toolbarRect!.height).toBeLessThanOrEqual(metadataRect!.y - 2)
  const composerOverlapWidth = Math.max(
    0,
    Math.min(toolbarRect!.x + toolbarRect!.width, composerRect!.x + composerRect!.width) -
      Math.max(toolbarRect!.x, composerRect!.x),
  )
  const composerOverlapHeight = Math.max(
    0,
    Math.min(toolbarRect!.y + toolbarRect!.height, composerRect!.y + composerRect!.height) -
      Math.max(toolbarRect!.y, composerRect!.y),
  )
  expect(composerOverlapWidth * composerOverlapHeight).toBe(0)
  expectViewportStableToolbar(toolbarRect!, nodeRect, surfaceRect)
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('source-attached media toolbar moves after the composer when no above placement fits', async ({ page }) => {
  const state = createResourceMockState()
  const source = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'generation-cover')!
  source.position_y = 0
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  const nodeRect = await rendererRect(page)
  const canvasRect = await page.locator('.canvas-surface').boundingBox()
  const surfaceRect = await page.locator('.workspace-stage').boundingBox()
  if (!nodeRect || !canvasRect || !surfaceRect) throw new Error('Media placement geometry is unavailable')
  await page.locator('.canvas-surface').click({
    force: true,
    position: { x: nodeRect.x - canvasRect.x + nodeRect.width / 2, y: nodeRect.y - canvasRect.y + nodeRect.height / 2 },
  })

  const toolbarRect = await page.getByRole('toolbar', { name: '媒体节点操作' }).boundingBox()
  const composerRect = await page.locator('.canvas-card-work-surface').boundingBox()
  expect(toolbarRect).not.toBeNull()
  expect(composerRect).not.toBeNull()
  expect(toolbarRect!.y).toBeGreaterThanOrEqual(composerRect!.y + composerRect!.height + 8)
  expect(toolbarRect!.y + toolbarRect!.height).toBeLessThanOrEqual(surfaceRect.y + surfaceRect.height - 12)
  expectViewportStableToolbar(toolbarRect!, nodeRect, surfaceRect)
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('selected media toolbar recomputes its safe width during live viewport resize', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  const nodeRect = await rendererRect(page)
  if (!nodeRect) throw new Error('Media placement geometry is unavailable')
  await page.mouse.click(nodeRect.x + nodeRect.width / 2, nodeRect.y + nodeRect.height / 2)
  const toolbar = page.getByRole('toolbar', { name: '媒体节点操作' })
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBeCloseTo(900, 0)
  await expectHorizontalToolbarRhythm(toolbar)

  await page.setViewportSize({ width: 920, height: 900 })
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBeCloseTo(864, 0)
  const compactRect = await toolbar.boundingBox()
  expect(compactRect?.x).toBeCloseTo(28, 0)
  if (!compactRect) throw new Error('Compact toolbar geometry is unavailable')
  expect(compactRect.height).toBeGreaterThanOrEqual(48)
  expect(compactRect.height).toBeLessThanOrEqual(52)
  await expectHorizontalToolbarRhythm(toolbar)

  await page.setViewportSize({ width: 1440, height: 900 })
  await expect.poll(async () => (await toolbar.boundingBox())?.width ?? 0).toBeCloseTo(900, 0)
  await expectHorizontalToolbarRhythm(toolbar)
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})

test('source-attached composer flips above a bottom collision and stays inside the Canvas', async ({ page }) => {
  const state = createResourceMockState()
  const script = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === 'script-source')!
  script.position_y = 750
  await openResourceWorkspace(page, state, { width: 1440, height: 900 }, { enableCanvasInspection: true })
  const baselinePatches = documentPatches(state).length
  const nodeRect = await rendererRect(page, 'script-source')
  const surfaceRect = await page.locator('.canvas-surface').boundingBox()
  if (!nodeRect || !surfaceRect) throw new Error('Composer placement geometry is unavailable')
  await page.locator('.canvas-surface').click({
    force: true,
    position: { x: nodeRect.x - surfaceRect.x + nodeRect.width / 2, y: nodeRect.y - surfaceRect.y + nodeRect.height / 2 },
  })

  const composerRect = await page.locator('.canvas-node-surface.is-composer[data-node-id="script-source"]').boundingBox()
  expect(composerRect).not.toBeNull()
  expect(composerRect!.y + composerRect!.height).toBeLessThanOrEqual(nodeRect.y - 6)
  expect(composerRect!.y).toBeGreaterThanOrEqual(surfaceRect.y + 12)
  expect(documentPatches(state)).toHaveLength(baselinePatches)
})
