import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveGenerationContext } from '../../src/modules/canvas/generation-context'
import { createSelectionGenerationCommand } from '../../src/modules/canvas/selection-generation'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-029-selection-generation')
const now = '2026-07-15T10:00:00Z'

function sourceNode(id: string, type: 'script' | 'asset', options: Record<string, unknown> = {}): CanvasNode {
  const isScript = type === 'script'
  return {
    id, type, title: String(options.title ?? id), x: Number(options.x ?? 0), y: Number(options.y ?? 0),
    width: 320, height: isScript ? 200 : 240,
    content: isScript ? String(options.text ?? `${id} prompt`) : undefined,
    contentData: isScript
      ? { subtype: 'script', serialization_version: 1 }
      : { subtype: options.subtype ?? 'image', serialization_version: 1, asset_id: options.assetId },
    isLocked: Boolean(options.isLocked),
    parentNodeId: typeof options.parentNodeId === 'string' ? options.parentNodeId : null,
  }
}

function persistedNode(node: CanvasNode) {
  return {
    id: node.id, project_id: PROJECT_ID, canvas_id: FIRST_CANVAS_ID, node_type: node.type,
    content: { title: node.title, text: node.content, ...node.contentData },
    position_x: node.x, position_y: node.y, width: node.width, height: node.height,
    z_index: 0, parent_node_id: node.parentNodeId ?? null, is_locked: node.isLocked ?? false,
    is_collapsed: false, status: 'idle', created_at: now, updated_at: now,
  }
}

test('pure composition creates one ordered request-ready generation fragment', () => {
  const sources = [
    sourceNode('script-a', 'script', { text: '黄昏海岸', x: 80, y: 80 }),
    sourceNode('asset-a', 'asset', { assetId: 'asset-a', x: 460, y: 60 }),
    sourceNode('script-b', 'script', { text: '缓慢横移', x: 80, y: 360 }),
    sourceNode('asset-b', 'asset', { assetId: 'asset-b', x: 460, y: 340 }),
  ]
  let id = 0
  const command = createSelectionGenerationCommand(sources, 'video', () => `created-${id++}`)
  expect(command).not.toBeNull()
  expect(command!.nodes).toHaveLength(1)
  expect(command!.nodes[0]).toMatchObject({ id: 'created-0', type: 'generation', x: 876, contentData: { subtype: 'video' } })
  expect(command!.connections.map((edge) => [edge.from, edge.targetPort, edge.metadata?.input_order])).toEqual([
    ['script-a', 'prompt', 1], ['asset-a', 'media', 1], ['script-b', 'prompt', 2], ['asset-b', 'media', 2],
  ])
  const context = resolveGenerationContext(command!.nodes[0], [...sources, ...command!.nodes], command!.connections)
  expect(context.textSources.map((item) => item.nodeId)).toEqual(['script-a', 'script-b'])
  expect(context.mediaSources.map((item) => item.nodeId)).toEqual(['asset-a', 'asset-b'])
  expect(context.provenance.every((item) => item.isIncluded)).toBe(true)

  expect(createSelectionGenerationCommand(sources.filter((node) => node.type === 'script'), 'image', () => crypto.randomUUID()))
    .toMatchObject({ nodes: [{ contentData: { subtype: 'image' } }], connections: [{ targetPort: 'prompt' }, { targetPort: 'prompt' }] })
  expect(createSelectionGenerationCommand(sources.filter((node) => node.type === 'asset'), 'video', () => crypto.randomUUID()))
    .toMatchObject({ nodes: [{ contentData: { subtype: 'video' } }], connections: [{ targetPort: 'media' }, { targetPort: 'media' }] })
})

test('pure composition rejects partial, excluded, protected, and unsupported selections', () => {
  const script = sourceNode('script', 'script')
  const image = sourceNode('image', 'asset', { assetId: 'asset-image' })
  const invalidCases: CanvasNode[][] = [
    [script],
    [sourceNode('locked', 'script', { isLocked: true }), image],
    [sourceNode('child', 'script', { parentNodeId: 'group' }), image],
    [sourceNode('empty', 'script', { text: '' }), image],
    [script, sourceNode('missing', 'asset')],
    [script, sourceNode('video', 'asset', { subtype: 'video', assetId: 'asset-video' })],
    [sourceNode('duplicate-a', 'asset', { assetId: 'same' }), sourceNode('duplicate-b', 'asset', { assetId: 'same' })],
    Array.from({ length: 9 }, (_, index) => sourceNode(`image-${index}`, 'asset', { assetId: `asset-${index}` })),
    [script, { ...script, id: 'note', type: 'note', contentData: { subtype: 'annotation', serialization_version: 1 } }],
    [script, { ...script, id: 'group', type: 'group', contentData: { subtype: 'group', serialization_version: 1 } }],
    [script, { ...script, id: 'unknown', type: 'future-node' }],
  ]
  for (const selection of invalidCases) {
    expect(createSelectionGenerationCommand(selection, 'image', () => crypto.randomUUID())).toBeNull()
  }
})

test('toolbar composes four mixed sources atomically and preserves undo redo and reload', async ({ page }) => {
  const state = createResourceMockState()
  const sources = [
    sourceNode('script-a', 'script', { title: '场景约束', text: '黄昏海岸，低饱和电影质感', x: 80, y: 100 }),
    sourceNode('asset-a', 'asset', { title: '海岸参考', assetId: 'asset-reference', x: 460, y: 80 }),
    sourceNode('script-b', 'script', { title: '镜头约束', text: '镜头缓慢向右横移', x: 80, y: 390 }),
    sourceNode('asset-b', 'asset', { title: '人物参考', assetId: 'asset-character', x: 460, y: 360 }),
  ]
  state.documents[FIRST_CANVAS_ID] = { nodes: sources.map(persistedNode), connections: [] }
  state.assets.push({ ...state.assets[0], id: 'asset-character', url: 'https://media.revid.test/character.png' })
  await openResourceWorkspace(page, state)

  const surface = page.locator('.canvas-surface')
  await surface.click({ position: { x: 180, y: 200 } })
  await surface.click({ position: { x: 560, y: 180 }, modifiers: ['Control'] })
  await surface.click({ position: { x: 180, y: 490 }, modifiers: ['Control'] })
  await surface.click({ position: { x: 560, y: 460 }, modifiers: ['Control'] })
  const toolbar = page.getByRole('toolbar', { name: '4 个已选节点的操作' })
  await expect(toolbar).toBeVisible()
  await toolbar.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  const composeMenu = page.getByRole('menu', { name: '选择生成任务类型' })
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'mixed-selection-compose-menu-1440x900.png'), fullPage: true })
  await composeMenu.getByRole('menuitem', { name: '视频生成' }).click()

  await expect.poll(() => documentPatches(state).length).toBe(1)
  const firstPatch = documentPatches(state)[0].body!
  expect(firstPatch.node_upserts).toHaveLength(1)
  expect(firstPatch.connection_upserts).toHaveLength(4)
  expect(firstPatch.node_upserts[0]).toMatchObject({ node_type: 'generation', content: { subtype: 'video' } })
  const persistedInputs = firstPatch.connection_upserts
    .map((edge) => [edge.source_node_id, edge.target_port, edge.metadata?.input_order])
    .sort((left, right) => `${left[1]}-${left[2]}`.localeCompare(`${right[1]}-${right[2]}`))
  expect(persistedInputs).toEqual([
    ['asset-a', 'media', 1], ['asset-b', 'media', 2],
    ['script-a', 'prompt', 1], ['script-b', 'prompt', 2],
  ])
  await expect(page.getByRole('complementary', { name: '节点详情 视频生成' })).toBeVisible()
  await expect(page.getByText('已连接上下文')).toBeVisible()

  await page.screenshot({ path: resolve(evidenceDirectory, 'mixed-selection-video-generation-1440x900.png'), fullPage: true })

  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => documentPatches(state).length).toBe(2)
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(4)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(0)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => documentPatches(state).length).toBe(3)
  expect(state.documents[FIRST_CANVAS_ID].nodes).toHaveLength(5)
  expect(state.documents[FIRST_CANVAS_ID].connections).toHaveLength(4)

  await page.reload()
  await expect(page.getByRole('button', { name: '定位到 视频生成' })).toBeVisible()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 视频生成' }).click()
  await expect(page.getByText('提示词 1 · 场景约束')).toBeVisible()
  await expect(page.getByText('提示词 2 · 镜头约束')).toBeVisible()
  await expect(page.getByText('参考图 1 · 海岸参考')).toBeVisible()
  await expect(page.getByText('参考图 2 · 人物参考')).toBeVisible()
})

test('compact desktop keeps the compose menu in bounds and creates image generation from text', async ({ page }) => {
  const state = createResourceMockState()
  const sources = [
    sourceNode('script-left', 'script', { title: '主体描述', text: '雨夜街道中的人物', x: 90, y: 160 }),
    sourceNode('script-right', 'script', { title: '光线描述', text: '霓虹反射与潮湿路面', x: 470, y: 160 }),
  ]
  state.documents[FIRST_CANVAS_ID] = { nodes: sources.map(persistedNode), connections: [] }
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  const surface = page.locator('.canvas-surface')
  const surfaceBox = await surface.boundingBox()
  expect(surfaceBox).not.toBeNull()
  await page.mouse.move(surfaceBox!.x + 40, surfaceBox!.y + 130)
  await page.mouse.down()
  await page.mouse.move(surfaceBox!.x + 830, surfaceBox!.y + 390, { steps: 4 })
  await page.mouse.up()
  await expect(page.getByRole('toolbar', { name: '2 个已选节点的操作' })).toBeVisible()
  await page.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  const menu = page.getByRole('menu', { name: '选择生成任务类型' })
  const box = await menu.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(920)
  await menu.getByRole('menuitem', { name: '图片生成' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  expect(documentPatches(state)[0].body?.node_upserts[0]).toMatchObject({ content: { subtype: 'image' } })
  expect(documentPatches(state)[0].body?.connection_upserts).toHaveLength(2)
})

test('invalid desktop and readonly mobile selections expose no composition mutation', async ({ page }) => {
  const state = createResourceMockState()
  const sources = [
    sourceNode('script-valid', 'script', { title: '有效脚本', text: '海岸镜头', x: 80, y: 100 }),
    sourceNode('asset-video', 'asset', { title: '视频素材', subtype: 'video', assetId: 'asset-video', x: 460, y: 80 }),
  ]
  state.documents[FIRST_CANVAS_ID] = { nodes: sources.map(persistedNode), connections: [] }
  await openResourceWorkspace(page, state)
  const surface = page.locator('.canvas-surface')
  await surface.click({ position: { x: 180, y: 200 } })
  await surface.click({ position: { x: 560, y: 180 }, modifiers: ['Control'] })
  await expect(page.getByRole('button', { name: '合并所选节点为生成任务' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)

  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '合并所选节点为生成任务' })).toHaveCount(0)
})
