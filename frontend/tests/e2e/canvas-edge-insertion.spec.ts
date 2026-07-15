import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createEdgeInsertionCommand,
  isEdgeInsertionCommandValid,
  resolveEdgeInsertionOptions,
} from '../../src/modules/canvas/edge-insertion'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import {
  FIRST_CANVAS_ID,
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-021-edge-insertion')

function node(id: string, type: CanvasNode['type'], subtype: string): CanvasNode {
  return { id, type, title: id, x: 0, y: 0, width: 320, height: 200,
    contentData: { subtype, serialization_version: 1 } }
}

function edge(from: string, to: string, sourcePort: string, targetPort: string): CanvasConnection {
  return { id: 'edge-original', from, to, sourcePort, targetPort, status: 'active', active: true,
    metadata: { label: 'original' } }
}

test('two-sided compatibility exposes only canonical bridge subtypes', () => {
  const asset = node('asset', 'asset', 'image')
  const generation = node('generation', 'generation', 'image')
  const result = node('result', 'result', 'image')
  const script = node('script', 'script', 'script')

  expect(resolveEdgeInsertionOptions(
    asset, generation, edge('asset', 'generation', 'out', 'media'),
  )).toEqual([])
  expect(resolveEdgeInsertionOptions(
    generation, result, edge('generation', 'result', 'out', 'in'),
  ).map((option) => option.key)).toEqual([
    'result:image:in:out', 'result:video:in:out', 'result:text:in:out',
  ])
  expect(resolveEdgeInsertionOptions(
    script, generation, edge('script', 'generation', 'out', 'prompt'),
  )).toEqual([])
})

test('edge insertion preserves upstream identity and creates one downstream edge', () => {
  const source = node('generation', 'generation', 'image')
  const target = node('result', 'result', 'image')
  const original = edge('generation', 'result', 'out', 'in')
  const option = resolveEdgeInsertionOptions(source, target, original).at(-1)!
  const ids = ['node-inserted', 'edge-downstream']
  const command = createEdgeInsertionCommand(
    source, target, original, option, { x: 600, y: 360 }, () => ids.shift()!,
  )

  expect(command).toMatchObject({
    type: 'insert-node-into-connection', connectionId: 'edge-original',
    node: { id: 'node-inserted', type: 'result', x: 420, y: 220 },
    upstream: {
      id: 'edge-original', from: 'generation', to: 'node-inserted',
      sourcePort: 'out', targetPort: 'in', metadata: { label: 'original' },
    },
    downstream: {
      id: 'edge-downstream', from: 'node-inserted', to: 'result',
      sourcePort: 'out', targetPort: 'in',
    },
  })
  expect(isEdgeInsertionCommandValid(command, [source, target], [original])).toBe(true)
  expect(isEdgeInsertionCommandValid(
    { ...command, downstream: { ...command.downstream, targetPort: 'missing' } },
    [source, target], [original],
  )).toBe(false)
})

test('selected result edge inserts one bridge node through one undoable patch', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' }).click()
  await page.getByRole('button', { name: '在连线中插入节点' }).click()

  const chooser = page.getByRole('dialog', { name: '在线路中插入节点' })
  await expect(chooser).toBeVisible()
  await expect(chooser.getByRole('menuitem')).toHaveCount(3)
  expect(documentPatches(state)).toHaveLength(0)
  await chooser.getByRole('menuitem', { name: /图片结果/ }).click()

  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(4)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(2)
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const original = state.documents[FIRST_CANVAS_ID].connections.find(
    (connection) => connection.id === 'connection-existing-result',
  )!
  const insertedNode = state.documents[FIRST_CANVAS_ID].nodes.find(
    (item) => item.id === original.target_node_id,
  )!
  expect(insertedNode).toMatchObject({ node_type: 'result' })
  expect(original).toMatchObject({ source_node_id: 'generation-cover', source_port: 'out', target_port: 'in' })
  expect(state.documents[FIRST_CANVAS_ID].connections.find(
    (connection) => connection.id !== 'connection-existing-result',
  )).toMatchObject({ source_node_id: insertedNode.id, target_node_id: 'result-existing' })
  expect(documentPatches(state)[0].body).toMatchObject({
    node_upserts: [expect.objectContaining({ id: insertedNode.id, node_type: 'result' })],
    connection_upserts: expect.arrayContaining([
      expect.objectContaining({ id: 'connection-existing-result', target_node_id: insertedNode.id }),
      expect.objectContaining({ source_node_id: insertedNode.id, target_node_id: 'result-existing' }),
    ]),
    connection_deletes: [],
  })

  await page.getByRole('region', { name: /Revid 无限画布工作区/ }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(3)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(1)
  expect(state.documents[FIRST_CANVAS_ID].connections[0]).toMatchObject({
    id: 'connection-existing-result', source_node_id: 'generation-cover', target_node_id: 'result-existing',
  })
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.length).toBe(4)
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].connections.length).toBe(2)
})

test('incompatible text edge exposes no midpoint insertion action', async ({ page }) => {
  const state = createResourceMockState()
  state.documents[FIRST_CANVAS_ID].connections = [{
    id: 'text-edge', project_id: 'project-resource', canvas_id: FIRST_CANVAS_ID,
    source_node_id: 'script-source', source_port: 'out', target_node_id: 'generation-cover',
    target_port: 'prompt', status: 'active', metadata: {},
  }]
  await openResourceWorkspace(page, state)
  await page.getByRole('button', { name: '选择连线：镜头脚本 到 封面生成' }).click()
  await expect(page.getByRole('button', { name: '在连线中插入节点' })).toHaveCount(0)
})

test('edge insertion chooser stays quiet and clamped at compact desktop width', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' }).click()
  await page.getByRole('button', { name: '在连线中插入节点' }).click()
  const chooser = page.getByRole('dialog', { name: '在线路中插入节点' })
  const chooserBox = await chooser.boundingBox()
  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  expect(chooserBox?.x).toBeGreaterThanOrEqual(surfaceBox?.x ?? 0)
  expect((chooserBox?.x ?? 0) + (chooserBox?.width ?? 0)).toBeLessThanOrEqual((surfaceBox?.x ?? 0) + (surfaceBox?.width ?? 0))
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'edge-insertion-920x900.png'), fullPage: true })
})

test('Escape, outside dismissal, and readonly mode never mutate edge topology', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  const edgeButton = page.getByRole('button', { name: '选择连线：封面生成 到 历史图片生成结果' })
  await edgeButton.click()
  await page.getByRole('button', { name: '在连线中插入节点' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '在线路中插入节点' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)

  await page.getByRole('button', { name: '在连线中插入节点' }).click()
  await page.getByRole('button', { name: '打开修订历史' }).click()
  await expect(page.getByRole('dialog', { name: '在线路中插入节点' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('button', { name: '在连线中插入节点' })).toHaveCount(0)
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(3)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(1)
})
