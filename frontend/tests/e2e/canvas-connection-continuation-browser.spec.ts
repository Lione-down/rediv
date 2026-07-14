import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { nodeInputAnchor, nodeOutputAnchor } from '../../src/components/canvas/canvas-geometry'
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

async function beginOutputDrag(page: Page, state: ResourceMockState, target: { x: number; y: number }) {
  const source = await surfacePoint(page, nodeOutputAnchor(mappedNode(state, 'script-source'), { x: 0, y: 0, zoom: 1 }, 'out'))
  const destination = await surfacePoint(page, target)
  await page.mouse.move(source.x, source.y)
  await page.mouse.down()
  await page.mouse.move(destination.x, destination.y, { steps: 8 })
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
