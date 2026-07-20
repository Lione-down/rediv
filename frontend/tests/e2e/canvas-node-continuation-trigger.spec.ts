import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { canvasNodeVisualSize } from '../../src/components/canvas/canvas-node-presentation'
import { resolveCanvasNodeContinuationTrigger } from '../../src/components/canvas/canvas-node-continuation-trigger'
import { resolveConnectionContinuationOptions } from '../../src/modules/canvas/connection-continuation'
import { mapCanvasNode } from '../../src/modules/canvas/mappers'
import { createRegistryNodeDraft, type CanonicalNodeType } from '../../src/modules/canvas/node-registry'
import type { CanvasNodeDto } from '../../src/modules/canvas/types'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-036-intent-safe-continuation')
const honestReferenceEvidence = resolve(process.cwd(), '..', 'output', 'playwright', 't5-070-honest-generation-reference')

function viewportPatches(state: ResourceMockState) {
  return state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith(`/canvases/${FIRST_CANVAS_ID}/viewport`)
  ))
}

function currentViewport(state: ResourceMockState) {
  const latest = viewportPatches(state).at(-1)?.body
  const canvas = state.canvases.find((item) => item.id === FIRST_CANVAS_ID)!
  return latest
    ? { x: Number(latest.x), y: Number(latest.y), zoom: Number(latest.zoom) }
    : { x: Number(canvas.viewport_x), y: Number(canvas.viewport_y), zoom: Number(canvas.viewport_zoom) }
}

function mappedNode(state: ResourceMockState, nodeId: string) {
  return mapCanvasNode(state.documents[FIRST_CANVAS_ID].nodes.find(
    (item) => item.id === nodeId,
  ) as unknown as CanvasNodeDto)
}

async function selectNode(page: Page, state: ResourceMockState, nodeId: string, modifiers: ('Control' | 'Shift')[] = []) {
  const record = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === nodeId)!
  const viewport = currentViewport(state)
  await page.locator('.canvas-surface').click({
    position: {
      x: (Number(record.position_x) + Number(record.width) / 2) * viewport.zoom + viewport.x,
      y: (Number(record.position_y) + Number(record.height) / 2) * viewport.zoom + viewport.y,
    },
    modifiers,
  })
}

test('selected script exposes canonical continuation and creates one foreground workflow', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await selectNode(page, state, 'script-source')

  const trigger = page.getByRole('button', { name: '继续此节点' })
  await expect(trigger).toBeVisible()
  await expect(trigger).toHaveAttribute('title', '继续此节点')
  const before = currentViewport(state)
  const viewportCount = viewportPatches(state).length
  await trigger.focus()
  await page.keyboard.press('Enter')

  const chooser = page.getByRole('dialog', { name: '继续连接' })
  await expect(chooser).toBeVisible()
  await expect(chooser.getByRole('menuitem')).toHaveCount(5)
  await expect(chooser.getByRole('menuitem', { name: /^文本/ })).toBeVisible()
  await expect(chooser.getByRole('menuitem', { name: /图片生成/ })).toBeVisible()
  await expect(chooser.getByRole('menuitem', { name: /视频生成/ })).toBeVisible()
  await expect(chooser.getByRole('menuitem', { name: /^音频/ })).toBeDisabled()
  await expect(chooser.getByRole('menuitem', { name: /^脚本/ })).toBeVisible()
  await chooser.getByRole('menuitem', { name: /图片生成/ }).click()

  await expect.poll(() => documentPatches(state).length).toBe(1)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    item.node_type === 'generation' && item.id !== 'generation-cover'
  ))!
  const edge = state.documents[FIRST_CANVAS_ID].connections.find((item) => item.target_node_id === generation.id)!
  const existingResult = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-existing')!
  expect(Number(generation.position_y)).toBeGreaterThanOrEqual(Number(existingResult.position_y) + Number(existingResult.height))
  expect(documentPatches(state)[0].body).toMatchObject({
    node_upserts: [expect.objectContaining({ id: generation.id, node_type: 'generation' })],
    connection_upserts: [expect.objectContaining({
      source_node_id: 'script-source', source_port: 'out', target_node_id: generation.id, target_port: 'prompt',
    })],
  })
  expect(edge).toMatchObject({ source_node_id: 'script-source', source_port: 'out', target_port: 'prompt' })
  await expect(page.locator('.generation-editor')).toBeVisible()
  await expect(page.getByRole('toolbar', { name: '1 个已选节点的操作' })).toBeVisible()
  await expect(page.getByRole('button', { name: '继续此节点' })).toHaveCount(0)
  expect(currentViewport(state).zoom).toBe(before.zoom)
  expect(viewportPatches(state).length).toBeGreaterThanOrEqual(viewportCount)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'foreground-continuation-1440x900.png'), fullPage: true })

  const afterCreateCount = viewportPatches(state).length
  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generation.id)).toBe(false)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generation.id)).toBe(true)
  expect(viewportPatches(state)).toHaveLength(afterCreateCount)
})

test('selected video asset exposes no generation continuation affordance', async ({ page }) => {
  const state = createResourceMockState()
  const template = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-existing')!
  state.documents[FIRST_CANVAS_ID].nodes.push({
    ...template,
    id: 'video-reference',
    node_type: 'asset',
    content: {
      title: 'Video reference', subtype: 'video', serialization_version: 1,
      asset_id: 'asset-video-reference', url: 'https://media.revid.test/scenario.mp4', width: 320, height: 180,
    },
    position_x: 580,
    position_y: 480,
  })
  await openResourceWorkspace(page, state)
  const viewport = currentViewport(state)
  await page.locator('.canvas-surface').click({ position: {
    x: (580 + 12) * viewport.zoom + viewport.x,
    y: (480 + 12) * viewport.zoom + viewport.y,
  } })

  await expect(page.locator('.selection-toolbar')).toBeVisible()
  await expect(page.locator('.context-panel-shell button:has(.lucide-git-branch)')).toHaveCount(0)
  await expect(page.locator('.node-continuation-anchor')).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  await mkdir(honestReferenceEvidence, { recursive: true })
  await page.screenshot({ path: resolve(honestReferenceEvidence, 'video-asset-no-generation-continuation-1440x900.png'), fullPage: true })
})

test('trigger remains screen-sized and canonically attached through desktop zoom', async ({ page }) => {
  const state = createResourceMockState()
  const canvas = state.canvases.find((item) => item.id === FIRST_CANVAS_ID)!
  canvas.viewport_x = 50
  canvas.viewport_y = 40
  canvas.viewport_zoom = 0.5
  await openResourceWorkspace(page, state, { width: 1366, height: 768 })
  await selectNode(page, state, 'script-source')

  const trigger = page.getByRole('button', { name: '继续此节点' })
  const box = await trigger.boundingBox()
  expect(box?.width).toBe(36)
  expect(box?.height).toBe(36)
  expect(box?.x).toBeCloseTo(50 + (580 + 320) * 0.5 + 14, 0)
  expect(box?.y).toBeCloseTo(40 + (160 + canvasNodeVisualSize(mappedNode(state, 'script-source')).height / 2) * 0.5 - 18, 0)
  await trigger.click()
  const chooser = page.getByRole('dialog', { name: '继续连接' })
  await expect(chooser).toBeVisible()
  const chooserBox = await chooser.boundingBox()
  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  expect(chooserBox!.x + chooserBox!.width).toBeLessThanOrEqual(surfaceBox!.x + surfaceBox!.width)
  await page.screenshot({ path: resolve(evidenceDirectory, 'continuation-trigger-1366x768.png'), fullPage: true })
  await page.keyboard.press('Escape')
  expect(documentPatches(state)).toHaveLength(0)
})

test('compact drawer hands continuation back to the unobscured Canvas chooser', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, state, 'script-source')
  await expect(page.locator('.node-continuation-anchor')).toHaveCount(0)
  const drawerAction = page.getByRole('button', { name: '继续此节点' })
  await expect(drawerAction).toBeVisible()
  await drawerAction.click()

  const chooser = page.getByRole('dialog', { name: '继续连接' })
  await expect(chooser).toBeVisible()
  const chooserBox = await chooser.boundingBox()
  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  expect(chooserBox!.x + chooserBox!.width).toBeLessThanOrEqual(surfaceBox!.x + surfaceBox!.width)
  await page.screenshot({ path: resolve(evidenceDirectory, 'continuation-drawer-handoff-920x900.png'), fullPage: true })
  await page.keyboard.press('Escape')
  expect(documentPatches(state)).toHaveLength(0)
})

test('locked, multi-selection, and readonly states expose no trigger', async ({ page }) => {
  const lockedState = createResourceMockState()
  lockedState.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'script-source')!.is_locked = true
  await openResourceWorkspace(page, lockedState)
  await selectNode(page, lockedState, 'script-source')
  await expect(page.getByRole('button', { name: '继续此节点' })).toHaveCount(0)

  const multiState = createResourceMockState()
  await openResourceWorkspace(page, multiState)
  await selectNode(page, multiState, 'script-source')
  await selectNode(page, multiState, 'generation-cover', ['Control'])
  await expect(page.getByRole('button', { name: '继续此节点' })).toHaveCount(0)

  const readonlyState = createResourceMockState()
  await openResourceWorkspace(page, readonlyState, { width: 375, height: 812 })
  await page.waitForTimeout(350)
  await expect(page.getByRole('button', { name: '继续此节点' })).toHaveCount(0)
  expect(documentPatches(readonlyState)).toHaveLength(0)
})

test('eligibility projection exposes authoring sources without advertising task or result creation', () => {
  const state = createResourceMockState()
  const script = mappedNode(state, 'script-source')
  expect(resolveCanvasNodeContinuationTrigger([script], [script.id], false)).toMatchObject({
    node: { id: 'script-source' }, portId: 'out',
  })
  const unsupported = { ...script, id: 'future-node', type: 'future-node' }
  expect(resolveCanvasNodeContinuationTrigger([unsupported], [unsupported.id], false)).toBeNull()
  expect(resolveCanvasNodeContinuationTrigger([script], [script.id], true)).toBeNull()
  expect(resolveCanvasNodeContinuationTrigger([script], [], false)).toBeNull()

  const canonicalNode = (type: CanonicalNodeType, subtype: string) => ({
    id: `${type}-${subtype}`,
    ...createRegistryNodeDraft(type, subtype, { x: 0, y: 0 }),
  })
  const imageAsset = canonicalNode('asset', 'image')
  const videoAsset = canonicalNode('asset', 'video')
  expect(resolveCanvasNodeContinuationTrigger([imageAsset], [imageAsset.id], false)).toMatchObject({ portId: 'out' })
  expect(resolveCanvasNodeContinuationTrigger([videoAsset], [videoAsset.id], false)).toBeNull()

  for (const node of [
    canonicalNode('generation', 'image'),
    canonicalNode('generation', 'video'),
    canonicalNode('result', 'image'),
    canonicalNode('result', 'video'),
    canonicalNode('note', 'annotation'),
    canonicalNode('group', 'group'),
  ]) {
    expect(resolveCanvasNodeContinuationTrigger([node], [node.id], false)).toBeNull()
  }

  const generation = canonicalNode('generation', 'image')
  const imageResult = canonicalNode('result', 'image')
  expect(resolveConnectionContinuationOptions(generation, 'out')).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'result', targetPort: 'in' }),
  ]))
  expect(resolveConnectionContinuationOptions(imageResult, 'out')).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'generation', targetPort: 'media' }),
  ]))
})
