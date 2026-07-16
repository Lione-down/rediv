import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveGenerationResultVariants, resolveResultLineage } from '../../src/modules/canvas/generation-lineage'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { documentPatches, FIRST_CANVAS_ID, openResourceWorkspace } from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-038-generation-output-variants')
const generationComparisonEvidence = resolve(process.cwd(), '..', 'output', 'playwright', 't5-067-generation-output-comparison')
const comparisonRevealEvidence = resolve(process.cwd(), '..', 'output', 'playwright', 't5-068-comparison-reveal')

function node(id: string, type: CanvasNode['type'], subtype: string): CanvasNode {
  return { id, type, title: id, x: 0, y: 0, width: 320, height: 200, contentData: { subtype, serialization_version: 1 } }
}

function edge(id: string, from: string, to: string, metadata: Record<string, unknown> = {}): CanvasConnection {
  return { id, from, to, sourcePort: 'out', targetPort: 'in', active: true, status: 'active', metadata }
}

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}` }).click()
}

test('pure lineage requires one active typed canonical generation parent and keeps sibling order', () => {
  const generation = node('generation', 'generation', 'image')
  const first = node('first', 'result', 'image')
  const second = { ...node('second', 'result', 'video'), contentData: { subtype: 'video', serialization_version: 1, source_task_id: 'task-2', source_model: 'agnes-video' } }
  const connections = [edge('variant-1', 'generation', 'first'), edge('variant-2', 'generation', 'second', { source_task_id: 'task-2' })]
  const lineage = resolveResultLineage(second, [generation, first, second], connections)

  expect(lineage).toMatchObject({
    generationNodeId: 'generation',
    model: 'agnes-video',
    selectedVariantOrder: 2,
    taskId: 'task-2',
  })
  expect(lineage?.variants.map((variant) => [variant.connectionId, variant.order, variant.isSelected])).toEqual([
    ['variant-1', 1, false], ['variant-2', 2, true],
  ])
  expect(resolveGenerationResultVariants(generation, [generation, first, second], connections)).toEqual([
    expect.objectContaining({ connectionId: 'variant-1', nodeId: 'first', order: 1, isSelected: false }),
    expect.objectContaining({ connectionId: 'variant-2', nodeId: 'second', order: 2, isSelected: false }),
  ])
  expect(resolveGenerationResultVariants(generation, [generation, first, second], [
    connections[0],
    { ...connections[1], active: false, status: 'inactive' },
    { ...connections[1], id: 'untyped', targetPort: 'media' },
  ])).toEqual([expect.objectContaining({ connectionId: 'variant-1', order: 1 })])
  expect(resolveGenerationResultVariants(first, [generation, first, second], connections)).toEqual([])

  expect(resolveResultLineage(second, [generation, first, second], [
    ...connections,
    edge('ambiguous', 'generation', 'second'),
  ])).toBeNull()
  expect(resolveResultLineage(second, [generation, first, second], [
    connections[0], edge('mismatch', 'generation', 'second', { source_task_id: 'other-task' }),
  ])).toBeNull()
  expect(resolveResultLineage(second, [generation, first, second], [
    connections[0], { ...connections[1], active: false, status: 'inactive' },
  ])).toBeNull()
})

test('selected image result traces four inputs, origin generation, and six variants', async ({ page }) => {
  const state = createMultiScenarioState()
  const selected = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-landscape')!
  Object.assign(selected.content, { source_task_id: 'task-landscape', source_model: 'agnes-image-v2' })
  const selectedEdge = state.documents[FIRST_CANVAS_ID].connections.find((item) => item.id === 'edge-result-landscape')!
  selectedEdge.metadata = { source_task_id: 'task-landscape' }

  await openResourceWorkspace(page, state)
  await selectNode(page, '宽银幕主镜头')

  await expect(page.locator('.generation-source-provenance')).toHaveCount(4)
  await expect(page.locator('.result-lineage-node')).toHaveCount(7)
  await expect(page.locator('.result-lineage-node').filter({ hasText: 'G' })).toHaveCount(1)
  for (let index = 1; index <= 6; index += 1) {
    await expect(page.locator('.result-lineage-node').filter({ hasText: `V${index}` })).toHaveCount(1)
  }
  await expect(page.locator('.connection-line.provenance')).toHaveCount(10)
  await expect(page.locator('.connection-line.provenance-result')).toHaveCount(6)
  await expect(page.locator('.connection-line.provenance-selected-result')).toHaveCount(1)
  await expect(page.getByRole('button', {
    name: '选择连线：合并四路上下文生成 到 宽银幕主镜头，结果变体 1，生成结果',
  })).toHaveCount(1)

  const detail = page.getByRole('region', { name: '生成结果谱系' })
  await expect(detail).toContainText('V1 / 6')
  await expect(detail).toContainText('合并四路上下文生成')
  await expect(detail).toContainText('task-landscape')
  await expect(detail).toContainText('agnes-image-v2')
  await expect(detail).toContainText('4 项')
  const image = page.getByRole('img', { name: '图片结果' }).first()
  await expect(image).toBeVisible()
  expect(await image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight])).toEqual([320, 180])

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'image-lineage-1440x900.png'), fullPage: true })

  await selectNode(page, '合并四路上下文生成')
  await expect(page.locator('.result-lineage-node')).toHaveCount(6)
  await expect(page.locator('.result-lineage-node').filter({ hasText: 'G' })).toHaveCount(0)
  for (let index = 1; index <= 6; index += 1) {
    await expect(page.locator('.result-lineage-node').filter({ hasText: `V${index}` })).toHaveCount(1)
  }
  await expect(page.locator('.generation-source-provenance')).toHaveCount(4)
  expect(documentPatches(state)).toHaveLength(0)
  const viewportPatchCount = state.requests.filter((request) => request.path.endsWith('/viewport')).length
  await page.screenshot({ path: resolve(evidenceDirectory, 'generation-output-map-1440x900.png'), fullPage: true })
  expect(state.requests.filter((request) => request.path.endsWith('/viewport'))).toHaveLength(viewportPatchCount)
})

test('video, unavailable, and broken sibling results keep honest media states and lineage', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState())
  await selectNode(page, '动态镜头结果')
  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('V4 / 6')
  const video = page.locator('video[aria-label="视频结果"]')
  await expect(video).toBeVisible()
  const playback = await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = true
    await element.play()
    await new Promise((resolvePlay) => setTimeout(resolvePlay, 100))
    return { duration: element.duration, paused: element.paused, width: element.videoWidth, height: element.videoHeight }
  })
  expect(playback.duration).toBeGreaterThan(0)
  expect(playback.paused).toBe(false)
  expect(playback.width / playback.height).toBeCloseTo(16 / 9, 1)

  await selectNode(page, '上游返回空结果')
  await expect(page.getByText('图片结果暂未提供预览')).toBeVisible()
  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('V5 / 6')

  await selectNode(page, '损坏媒体结果')
  await expect(page.getByRole('alert').filter({ hasText: '媒体不可用' })).toBeVisible()
  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('V6 / 6')
})

test('readonly compact review preserves lineage without mutation controls', async ({ page }) => {
  await openResourceWorkspace(page, createMultiScenarioState(), { width: 375, height: 812 })
  await selectNode(page, '方形社交版本')

  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('V2 / 6')
  await expect(page.locator('.result-lineage-node')).toHaveCount(7)
  await expect(page.locator('.generation-source-provenance')).toHaveCount(4)
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /删除/ })).toHaveCount(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-lineage-readonly-375x812.png'), fullPage: true })

  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await selectNode(page, '合并四路上下文生成')
  await expect(page.locator('.result-lineage-node')).toHaveCount(6)
  await expect(page.locator('.result-lineage-node').filter({ hasText: 'V6' })).toHaveCount(1)
  await page.screenshot({ path: resolve(evidenceDirectory, 'generation-output-map-readonly-375x812.png'), fullPage: true })
})

test('comparison tray renders six canonical mixed-media variants without mutation', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '宽银幕主镜头')

  await page.getByRole('button', { name: '比较 6 个同源结果' }).click()
  const tray = page.getByRole('region', { name: '结果变体比较' })
  await expect(tray).toBeVisible()
  await expect(tray.locator('li')).toHaveCount(6)
  for (let index = 1; index <= 6; index += 1) await expect(tray.getByText(`V${index}`, { exact: true })).toBeVisible()
  await expect(tray.locator('li.is-selected')).toContainText('V1')
  await expect(tray.locator('img')).toHaveCount(4)
  await expect(tray.locator('video')).toHaveCount(1)
  await expect(tray.getByText('图片结果暂未提供预览')).toBeVisible()
  await expect(tray.getByRole('alert')).toContainText('媒体不可用')
  expect(documentPatches(state)).toHaveLength(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-comparison-1440x900.png'), fullPage: true })

  await tray.getByRole('button', { name: '选择变体 V4' }).click()
  await expect(tray).toHaveCount(0)
  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('V4 / 6')
  expect(documentPatches(state)).toHaveLength(0)
})

test('generation owner opens the exact mixed-media variant family without an arbitrary current result', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state)
  await selectNode(page, '合并四路上下文生成')

  await page.getByRole('button', { name: '比较 6 个生成结果' }).click()
  const tray = page.getByRole('region', { name: '结果变体比较' })
  await expect(tray).toBeVisible()
  await expect(tray.locator('li')).toHaveCount(6)
  await expect(tray.locator('li.is-selected')).toHaveCount(0)
  for (let index = 1; index <= 6; index += 1) await expect(tray.getByText(`V${index}`, { exact: true })).toBeVisible()
  await expect(tray.locator('img')).toHaveCount(4)
  await expect(tray.locator('video')).toHaveCount(1)
  await expect(tray.getByText('图片结果暂未提供预览')).toBeVisible()
  expect(documentPatches(state)).toHaveLength(0)
  await mkdir(generationComparisonEvidence, { recursive: true })
  await page.screenshot({ path: resolve(generationComparisonEvidence, 'generation-output-family-1440x900.png'), fullPage: true })

  await tray.getByRole('button', { name: '选择变体 V4' }).click()
  await expect(tray).toHaveCount(0)
  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('V4 / 6')
  expect(documentPatches(state)).toHaveLength(0)
})

test('comparison selection reveals a distant variant once without mutating the graph', async ({ page }) => {
  const state = createMultiScenarioState()
  const distantResult = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-broken')!
  distantResult.position_x = 3200
  distantResult.position_y = 1200
  await openResourceWorkspace(page, state)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-compose')!
  await selectNode(page, String(generation.content.title))
  await page.waitForTimeout(650)

  const viewportPatches = () => state.requests.filter((request) => request.method === 'PATCH' && request.path.endsWith('/viewport'))
  const viewportPatchesBefore = viewportPatches().length
  const initialZoom = state.canvases[0].viewport_zoom
  await page.locator('.compare-results-button').click()
  const tray = page.locator('.result-compare-tray')
  await tray.locator('li').nth(5).locator('button').click()

  await expect(tray).toHaveCount(0)
  await expect(page.locator('.result-lineage-detail')).toContainText('V6 / 6')
  await expect.poll(() => viewportPatches().length).toBe(viewportPatchesBefore + 1)
  const viewportBody = viewportPatches().at(-1)!.body
  const viewport = { x: Number(viewportBody.x), y: Number(viewportBody.y), zoom: Number(viewportBody.zoom) }
  expect(viewport.zoom).toBe(initialZoom)
  const screenLeft = distantResult.position_x * viewport.zoom + viewport.x
  const screenTop = distantResult.position_y * viewport.zoom + viewport.y
  expect(screenLeft).toBeGreaterThanOrEqual(40)
  expect(screenLeft + distantResult.width * viewport.zoom).toBeLessThanOrEqual(1048)
  expect(screenTop).toBeGreaterThanOrEqual(120)
  expect(screenTop + distantResult.height * viewport.zoom).toBeLessThanOrEqual(800)
  expect(documentPatches(state)).toHaveLength(0)
  await mkdir(comparisonRevealEvidence, { recursive: true })
  await page.screenshot({ path: resolve(comparisonRevealEvidence, 'distant-v6-revealed-1440x900.png'), fullPage: true })
})

test('comparison selection leaves an already-visible variant and zoom unchanged', async ({ page }) => {
  const state = createMultiScenarioState()
  const visibleResult = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-square')!
  visibleResult.position_x = 820
  visibleResult.position_y = 240
  await openResourceWorkspace(page, state)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-compose')!
  await selectNode(page, String(generation.content.title))
  await page.waitForTimeout(650)
  const viewportPatches = () => state.requests.filter((request) => request.method === 'PATCH' && request.path.endsWith('/viewport'))
  const viewportPatchesBefore = viewportPatches().length
  const zoomBefore = state.canvases[0].viewport_zoom

  await page.locator('.compare-results-button').click()
  const tray = page.locator('.result-compare-tray')
  await tray.locator('li').nth(1).locator('button').click()
  await expect(page.locator('.result-lineage-detail')).toContainText('V2 / 6')
  await page.waitForTimeout(650)

  expect(viewportPatches()).toHaveLength(viewportPatchesBefore)
  expect(state.canvases[0].viewport_zoom).toBe(zoomBefore)
  expect(documentPatches(state)).toHaveLength(0)
})

test('generation comparison hands compact selection to the exact result after drawer ownership ends', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '合并四路上下文生成')
  await page.getByRole('button', { name: '比较 6 个生成结果' }).click()

  const tray = page.getByRole('region', { name: '结果变体比较' })
  await expect(tray).toBeVisible()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  const bounds = await tray.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(920)
  await mkdir(generationComparisonEvidence, { recursive: true })
  await page.screenshot({ path: resolve(generationComparisonEvidence, 'generation-output-family-920x900.png'), fullPage: true })

  await tray.getByRole('button', { name: '选择变体 V2' }).click()
  await expect(tray).toHaveCount(0)
  await expect(page.getByRole('region', { name: '生成结果谱系' })).toContainText('V2 / 6')
  expect(documentPatches(state)).toHaveLength(0)
})

test('generation comparison stays review-only at 375px and one-output owners fail closed', async ({ page }) => {
  const readonlyState = createMultiScenarioState()
  await openResourceWorkspace(page, readonlyState, { width: 375, height: 812 })
  await selectNode(page, '合并四路上下文生成')
  await page.getByRole('button', { name: '比较 6 个生成结果' }).click()
  const tray = page.getByRole('region', { name: '结果变体比较' })
  await expect(tray).toBeVisible()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  await expect(tray.locator('li.is-selected')).toHaveCount(0)
  const bounds = await tray.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375)
  await mkdir(generationComparisonEvidence, { recursive: true })
  await page.screenshot({ path: resolve(generationComparisonEvidence, 'generation-output-family-readonly-375x812.png'), fullPage: true })
  await page.keyboard.press('Escape')
  await expect(tray).toHaveCount(0)
  expect(documentPatches(readonlyState)).toHaveLength(0)

  const oneOutputState = createMultiScenarioState()
  const document = oneOutputState.documents[FIRST_CANVAS_ID]
  document.connections = document.connections.filter((connection) => (
    connection.source_node_id !== 'generation-compose' || connection.id === 'edge-result-landscape'
  ))
  await openResourceWorkspace(page, oneOutputState)
  await selectNode(page, '合并四路上下文生成')
  await expect(page.getByRole('button', { name: /比较 \d+ 个生成结果/ })).toHaveCount(0)
  expect(documentPatches(oneOutputState)).toHaveLength(0)
})

test('readonly mobile comparison dismisses the drawer, stays in bounds, and closes on Escape', async ({ page }) => {
  const state = createMultiScenarioState()
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '方形社交版本')
  await page.getByRole('button', { name: '比较 6 个同源结果' }).click()

  const tray = page.getByRole('region', { name: '结果变体比较' })
  await expect(tray).toBeVisible()
  await expect(page.locator('.n-drawer')).toHaveCount(0)
  const bounds = await tray.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375)
  expect(documentPatches(state)).toHaveLength(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-comparison-readonly-375x812.png'), fullPage: true })
  await page.keyboard.press('Escape')
  await expect(tray).toHaveCount(0)
  await expect(page.locator('.result-lineage-node').filter({ hasText: 'V2' })).toHaveCount(1)
})
