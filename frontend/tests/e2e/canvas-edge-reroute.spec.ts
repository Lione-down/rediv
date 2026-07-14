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

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-020-edge-reroute')

function addRerouteTargets(state: ResourceMockState) {
  const document = state.documents[FIRST_CANVAS_ID]
  const generation = document.nodes.find((node) => node.id === 'generation-cover')!
  const result = document.nodes.find((node) => node.id === 'result-existing')!
  document.nodes.push(
    { ...generation, id: 'generation-alt', position_x: 180, position_y: 520, content: {
      ...generation.content as object, title: '备用生成', subtype: 'video', generation_status: undefined,
    } },
    { ...result, id: 'result-alt', position_x: 980, position_y: 520, content: {
      ...result.content as object, title: '备用结果', asset_id: undefined, url: undefined,
    } },
  )
}

function mappedNode(state: ResourceMockState, nodeId: string) {
  const dto = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === nodeId)
  if (!dto) throw new Error(`Missing fixture node: ${nodeId}`)
  return mapCanvasNode(dto as unknown as CanvasNodeDto)
}

async function clientPoint(page: Page, surfacePoint: { x: number; y: number }) {
  const box = await page.locator('.canvas-surface').boundingBox()
  if (!box) throw new Error('Canvas surface is unavailable')
  return { x: box.x + surfacePoint.x, y: box.y + surfacePoint.y }
}

async function dragHandle(page: Page, name: string, target: { x: number; y: number }) {
  const handle = page.getByRole('button', { name })
  const box = await handle.boundingBox()
  if (!box) throw new Error(`Missing edge handle: ${name}`)
  const destination = await clientPoint(page, target)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(destination.x, destination.y, { steps: 8 })
  await page.mouse.up()
}

test('Canvas edge selection stays quiet until selected and supports keyboard deletion', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)

  const hit = page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' })
  await expect(hit).toBeVisible()
  await expect(page.getByRole('button', { name: '改接连线来源' })).toHaveCount(0)
  await hit.click()
  await expect(page.getByRole('button', { name: '改接连线来源' })).toBeVisible()
  await expect(page.getByRole('button', { name: '改接连线目标' })).toBeVisible()
  await expect(page.locator('.connection-line.selected')).toHaveCount(1)

  await page.getByRole('region', { name: /Revid 无限画布工作区/ }).press('Delete')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(0)
})

test('target endpoint reroute preserves edge identity, autosave boundary, and undo redo', async ({ page }) => {
  const state = createResourceMockState()
  addRerouteTargets(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' }).click()
  const target = nodeInputAnchor(mappedNode(state, 'result-alt'), { x: 0, y: 0, zoom: 1 }, 'in')
  await dragHandle(page, '改接连线目标', target)

  await expect.poll(() => documentPatches(state).length).toBe(1)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)
  expect(state.documents[FIRST_CANVAS_ID].connections[0]).toMatchObject({
    id: 'connection-existing-result', source_node_id: 'generation-cover',
    target_node_id: 'result-alt', source_port: 'out', target_port: 'in',
  })
  expect(documentPatches(state)[0].body).toMatchObject({
    connection_upserts: [expect.objectContaining({
      id: 'connection-existing-result', target_node_id: 'result-alt',
    })],
    connection_deletes: [],
  })

  await page.getByRole('region', { name: /Revid 无限画布工作区/ }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections[0].target_node_id).toBe('result-existing')
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections[0].target_node_id).toBe('result-alt')
})

test('source endpoint reroute and cancelled empty release keep typed graph deterministic', async ({ page }) => {
  const state = createResourceMockState()
  addRerouteTargets(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' }).click()
  const source = nodeOutputAnchor(mappedNode(state, 'generation-alt'), { x: 0, y: 0, zoom: 1 }, 'out')
  await dragHandle(page, '改接连线来源', source)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections[0].source_node_id).toBe('generation-alt')

  await page.getByRole('button', { name: '选择连线：备用生成 到 历史图片生成结果' }).click()
  await dragHandle(page, '改接连线目标', { x: 700, y: 700 })
  await page.waitForTimeout(350)
  expect(state.documents[FIRST_CANVAS_ID].connections[0]).toMatchObject({
    source_node_id: 'generation-alt', target_node_id: 'result-existing',
  })
  expect(documentPatches(state)).toHaveLength(1)
})

test('selected edge handles remain restrained at compact desktop width', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' }).click()
  await expect(page.locator('.connection-line.selected')).toBeVisible()
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-edge-920x900.png'), fullPage: true })
})

test('readonly and pointer cancellation never reroute a selected edge', async ({ page }) => {
  const state = createResourceMockState()
  addRerouteTargets(state)
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' }).click()
  const handle = page.getByRole('button', { name: '改接连线目标' })
  const box = await handle.boundingBox()
  if (!box) throw new Error('Missing target handle')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })))
  await page.mouse.up()
  expect(documentPatches(state)).toHaveLength(0)

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('button', { name: '改接连线目标' })).toHaveCount(0)
  expect(state.documents[FIRST_CANVAS_ID].connections[0]).toMatchObject({
    source_node_id: 'generation-cover', target_node_id: 'result-existing',
  })
})
