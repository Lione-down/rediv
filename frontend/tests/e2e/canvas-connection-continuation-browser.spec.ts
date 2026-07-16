import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildConnectionPath, nodeInputAnchor, nodeOutputAnchor } from '../../src/components/canvas/canvas-geometry'
import { mapCanvasNode } from '../../src/modules/canvas/mappers'
import type { CanvasNodeDto } from '../../src/modules/canvas/types'
import {
  FIRST_CANVAS_ID,
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-018-connection-continuation')
const upstreamEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-019-reverse-port-drag')

function mappedNode(state: ResourceMockState, nodeId: string) {
  const dto = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === nodeId)
  if (!dto) throw new Error(`Missing fixture node: ${nodeId}`)
  return mapCanvasNode(dto as unknown as CanvasNodeDto)
}

async function surfacePoint(page: Page, point: { x: number; y: number }) {
  const box = await page.locator('.canvas-surface').boundingBox()
  if (!box) throw new Error('Canvas surface is unavailable')
  return { x: box.x + point.x, y: box.y + point.y }
}

async function dragFromOutput(page: Page, state: ResourceMockState, target: { x: number; y: number }) {
  const source = await surfacePoint(page, nodeOutputAnchor(mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out'))
  const destination = await surfacePoint(page, target)
  await page.mouse.move(source.x, source.y)
  await page.mouse.down()
  await page.mouse.move(destination.x, destination.y, { steps: 8 })
  await page.mouse.up()
}

async function dragFromOutputOffset(
  page: Page,
  state: ResourceMockState,
  startOffset: { x: number; y: number },
  target: { x: number; y: number },
) {
  const anchor = nodeOutputAnchor(mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out')
  const source = await surfacePoint(page, { x: anchor.x + startOffset.x, y: anchor.y + startOffset.y })
  const destination = await surfacePoint(page, target)
  await page.mouse.move(source.x, source.y)
  await page.mouse.down()
  await page.mouse.move(destination.x, destination.y, { steps: 8 })
  await page.mouse.up()
}

async function beginOutputDrag(page: Page, state: ResourceMockState, target: { x: number; y: number }) {
  const source = await surfacePoint(page, nodeOutputAnchor(mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out'))
  const destination = await surfacePoint(page, target)
  await page.mouse.move(source.x, source.y)
  await page.mouse.down()
  await page.mouse.move(destination.x, destination.y, { steps: 8 })
}

async function dragFromInput(
  page: Page,
  state: ResourceMockState,
  portId: 'prompt' | 'media',
  target: { x: number; y: number },
) {
  const origin = await surfacePoint(page, nodeInputAnchor(
    mappedNode(state, 'generation-cover'), { x: 0, y: 0, zoom: 1 }, portId,
  ))
  const destination = await surfacePoint(page, target)
  await page.mouse.move(origin.x, origin.y)
  await page.mouse.down()
  await page.mouse.move(destination.x, destination.y, { steps: 8 })
  await page.mouse.up()
}

test('empty release offers typed continuation and commits one undoable graph insertion', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await dragFromOutput(page, state, { x: 760, y: 620 })

  const chooser = page.getByRole('dialog', { name: '继续连接' })
  await expect(chooser).toBeVisible()
  await expect(chooser.getByRole('menuitem')).toHaveCount(2)
  await expect(chooser.getByRole('menuitem', { name: /图片生成/ })).toBeVisible()
  await expect(chooser.getByRole('menuitem', { name: /视频生成/ })).toBeVisible()
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(3)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)

  await page.getByRole('button', { name: '打开修订历史' }).click()
  await expect(chooser).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)

  await dragFromOutput(page, state, { x: 760, y: 620 })
  await page.keyboard.press('Escape')
  await expect(chooser).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)

  await dragFromOutput(page, state, { x: 760, y: 620 })
  await page.getByRole('menuitem', { name: /视频生成/ }).click()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(4)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(2)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  expect(documentPatches(state)[0].body).toMatchObject({
    node_upserts: [expect.objectContaining({ node_type: 'generation' })],
    connection_upserts: [expect.objectContaining({
      source_node_id: 'script-source', source_port: 'out', target_port: 'prompt',
    })],
  })

  await page.getByRole('region', { name: /Revid 无限画布工作区/ }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(3)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(1)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(4)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(2)
})

test('output drag starts inside the forgiving hit target but outside the visible dot', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)

  await dragFromOutputOffset(page, state, { x: 14, y: 0 }, { x: 760, y: 620 })

  await expect(page.getByRole('dialog', { name: '继续连接' })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(0)
})

test('output drag does not start just outside the forgiving hit target', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)

  await dragFromOutputOffset(page, state, { x: 26, y: 0 }, { x: 760, y: 620 })

  await expect(page.getByRole('dialog', { name: '继续连接' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)
})

test('non-primary port gestures retain pan and context-menu ownership', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const canvas = state.canvases.find((candidate) => candidate.id === FIRST_CANVAS_ID)!
  let source = await surfacePoint(page, nodeOutputAnchor(
    mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out',
  ))

  await page.mouse.move(source.x, source.y)
  await page.mouse.down({ button: 'middle' })
  await page.mouse.move(source.x + 80, source.y + 40, { steps: 4 })
  await page.mouse.up({ button: 'middle' })
  await expect.poll(() => [canvas.viewport_x, canvas.viewport_y]).toEqual([80, 40])

  source = await surfacePoint(page, nodeOutputAnchor(mappedNode(state, 'script-source'), {
    x: canvas.viewport_x, y: canvas.viewport_y, zoom: canvas.viewport_zoom,
  }, 'out'))
  await page.mouse.click(source.x, source.y, { button: 'right' })
  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog', { name: '继续连接' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)
})

test('Space plus primary port drag retains pan ownership', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const canvas = state.canvases.find((candidate) => candidate.id === FIRST_CANVAS_ID)!
  const source = await surfacePoint(page, nodeOutputAnchor(
    mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out',
  ))

  await page.getByRole('region', { name: /Revid/ }).focus()
  await page.keyboard.down('Space')
  await page.mouse.move(source.x, source.y)
  await page.mouse.down()
  await page.mouse.move(source.x + 60, source.y + 30, { steps: 4 })
  await page.mouse.up()
  await page.keyboard.up('Space')

  await expect.poll(() => [canvas.viewport_x, canvas.viewport_y]).toEqual([60, 30])
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)
})

test('Escape cancels an active port draft before release', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await beginOutputDrag(page, state, { x: 760, y: 620 })

  await page.keyboard.press('Escape')
  await page.mouse.up()

  await expect(page.getByRole('dialog', { name: '继续连接' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)
})

test('pointer cancellation never opens continuation or mutates the graph', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await beginOutputDrag(page, state, { x: 760, y: 620 })
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })))
  await page.mouse.up()

  await expect(page.getByRole('dialog', { name: '继续连接' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(3)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)
})

test('direct compatible port drop bypasses continuation chooser', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const target = nodeInputAnchor(mappedNode(state, 'generation-cover'), { x: 0, y: 0, zoom: 1 }, 'prompt')
  await dragFromOutput(page, state, target)

  await expect(page.getByRole('dialog', { name: '继续连接' })).toHaveCount(0)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(2)
  expect(state.documents[FIRST_CANVAS_ID].connections.at(-1)).toMatchObject({
    source_node_id: 'script-source', target_node_id: 'generation-cover',
    source_port: 'out', target_port: 'prompt',
  })
})

test('direct drop skips a nearer incompatible port for the exact compatible target', async ({ page }) => {
  const state = createResourceMockState()
  const document = state.documents[FIRST_CANVAS_ID]
  const generation = document.nodes.find((node) => node.id === 'generation-cover')!
  const result = document.nodes.find((node) => node.id === 'result-existing')!
  const generationAnchor = nodeInputAnchor(mappedNode(state, generation.id), { x: 0, y: 0, zoom: 1 }, 'prompt')
  const resultAnchor = nodeInputAnchor(mappedNode(state, result.id), { x: 0, y: 0, zoom: 1 }, 'in')
  result.position_x = generation.position_x - 12
  result.position_y += generationAnchor.y - resultAnchor.y
  await openResourceWorkspace(page, state)

  const nearestIncompatible = nodeInputAnchor(mappedNode(state, result.id), { x: 0, y: 0, zoom: 1 }, 'in')
  await beginOutputDrag(page, state, nearestIncompatible)
  await expect(page.locator('.connection-target-port[data-node-id="generation-cover"][data-port-id="prompt"]')).toBeVisible()
  await expect(page.locator('.connection-target-port[data-node-id="result-existing"][data-port-id="in"]')).toHaveCount(0)
  const sourceAnchor = nodeOutputAnchor(mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out')
  await expect(page.locator('.draft-layer .draft')).toHaveAttribute('d', buildConnectionPath(sourceAnchor, generationAnchor))
  await page.mouse.up()

  await expect(page.getByRole('dialog', { name: '继续连接' })).toHaveCount(0)
  await expect.poll(() => document.connections.length).toBe(2)
  expect(document.connections.at(-1)).toMatchObject({
    source_node_id: 'script-source', target_node_id: 'generation-cover',
    source_port: 'out', target_port: 'prompt',
  })
})

test('chooser stays inside compact workspace and retains a quiet reduced-motion surface', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await page.waitForTimeout(250)
  await dragFromOutput(page, state, { x: 500, y: 700 })
  const chooser = page.getByRole('dialog', { name: '继续连接' })
  await expect(chooser).toBeVisible()
  const box = await chooser.boundingBox()
  const surface = await page.locator('.canvas-surface').boundingBox()
  expect(box?.x).toBeGreaterThanOrEqual(surface?.x ?? 0)
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual((surface?.x ?? 0) + (surface?.width ?? 0))
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual((surface?.y ?? 0) + (surface?.height ?? 0))
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'continuation-920x900.png'), fullPage: true })
})

test('input drag connects backward to an existing compatible output in canonical orientation', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const source = nodeOutputAnchor(mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out')
  await dragFromInput(page, state, 'prompt', source)

  await expect(page.getByRole('dialog', { name: '继续连接' })).toHaveCount(0)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(2)
  expect(state.documents[FIRST_CANVAS_ID].connections.at(-1)).toMatchObject({
    source_node_id: 'script-source', target_node_id: 'generation-cover',
    source_port: 'out', target_port: 'prompt',
  })
})

test('empty input release creates one compatible upstream node and edge atomically', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await dragFromInput(page, state, 'prompt', { x: 360, y: 650 })

  const chooser = page.getByRole('dialog', { name: '继续连接' })
  await expect(chooser).toContainText('创建上游')
  await expect(chooser.getByRole('menuitem')).toHaveCount(2)
  await expect(chooser.getByRole('menuitem', { name: /提示词/ })).toBeVisible()
  expect(documentPatches(state)).toHaveLength(0)
  await mkdir(upstreamEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(upstreamEvidenceDirectory, 'upstream-continuation-1440x900.png'), fullPage: true })

  await chooser.getByRole('menuitem', { name: /提示词/ }).click()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(4)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(2)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  expect(documentPatches(state)[0].body).toMatchObject({
    node_upserts: [expect.objectContaining({ node_type: 'script' })],
    connection_upserts: [expect.objectContaining({
      target_node_id: 'generation-cover', source_port: 'out', target_port: 'prompt',
    })],
  })
})
