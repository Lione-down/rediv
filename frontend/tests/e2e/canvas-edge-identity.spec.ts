import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveCanvasConnectionPresentation } from '../../src/components/canvas/canvas-connection-presentation'
import { canvasNodeVisualSize } from '../../src/components/canvas/canvas-node-presentation'
import { mapCanvasNode } from '../../src/modules/canvas/mappers'
import type { CanvasNodeDto } from '../../src/modules/canvas/types'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'
import {
  FIRST_CANVAS_ID,
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-053-selected-edge-identity')

function semanticNode(id: string, type: CanvasNode['type'], title: string): CanvasNode {
  return { id, type, title, x: 0, y: 0, width: 320, height: 200 }
}

test('connection presentation names prompt media result and generic data roles', () => {
  const script = semanticNode('script', 'script', '脚本')
  const asset = semanticNode('asset', 'asset', '参考图')
  const generation = semanticNode('generation', 'generation', '生成')
  const result = semanticNode('result', 'result', '结果')
  const note = semanticNode('note', 'note', '备注')
  const connection = (targetPort: string): CanvasConnection => ({
    id: targetPort, from: 'source', to: 'target', sourcePort: 'out', targetPort,
  })

  expect(resolveCanvasConnectionPresentation(connection('prompt'), script, generation).roleLabel).toBe('提示词输入')
  expect(resolveCanvasConnectionPresentation(connection('media'), asset, generation).roleLabel).toBe('参考图输入')
  expect(resolveCanvasConnectionPresentation(connection('in'), generation, result).roleLabel).toBe('生成结果')
  expect(resolveCanvasConnectionPresentation(connection('in'), note, script)).toMatchObject({
    roleLabel: '数据连接', accessibleLabel: '选中连线：数据连接，备注 到 脚本',
  })
})

function addInputEdges(state: ReturnType<typeof createResourceMockState>) {
  const document = state.documents[FIRST_CANVAS_ID]
  const script = document.nodes.find((node) => node.id === 'script-source')!
  script.content = { ...script.content as object, title: '镜头运动与人物关系的长中文约束' }
  const result = document.nodes.find((node) => node.id === 'result-existing')!
  result.content = { ...result.content as object, title: '历史图片生成结果与收束画面' }
  document.nodes.push({
    ...script,
    id: 'asset-reference-node',
    node_type: 'asset',
    position_x: 580,
    position_y: 500,
    content: {
      title: '海岸环境与人物造型连续性参考图',
      subtype: 'image',
      serialization_version: 1,
      asset_id: 'asset-reference',
      url: 'https://media.revid.test/reference.png',
      aspect_ratio: 16 / 9,
    },
  })
  document.connections.push(
    {
      ...document.connections[0],
      id: 'edge-prompt',
      source_node_id: 'script-source',
      target_node_id: 'generation-cover',
      source_port: 'out',
      target_port: 'prompt',
    },
    {
      ...document.connections[0],
      id: 'edge-media',
      source_node_id: 'asset-reference-node',
      target_node_id: 'generation-cover',
      source_port: 'out',
      target_port: 'media',
    },
  )
}

test('selected prompt media and result edges expose one contextual semantic identity', async ({ page }) => {
  const state = createResourceMockState()
  addInputEdges(state)
  await openResourceWorkspace(page, state)

  const identity = page.getByRole('group', { name: /^选中连线：/ })
  await expect(identity).toHaveCount(0)

  const promptEdge = page.getByRole('button', {
    name: '选择连线：镜头运动与人物关系的长中文约束 到 封面生成',
  })
  await promptEdge.focus()
  await promptEdge.press('Enter')
  await expect(identity).toHaveAccessibleName(
    '选中连线：提示词输入，镜头运动与人物关系的长中文约束 到 封面生成',
  )
  await expect(identity.getByText('提示词输入')).toBeVisible()
  await expect(identity.getByText('镜头运动与人物关系的长中文约束')).toBeVisible()
  await expect(identity.getByText('封面生成')).toBeVisible()
  await expect(identity.getByRole('button', { name: '在连线中插入节点' })).toHaveCount(0)

  await page.getByRole('button', {
    name: '选择连线：海岸环境与人物造型连续性参考图 到 封面生成',
  }).click()
  await expect(identity).toHaveAccessibleName(
    '选中连线：参考图输入，海岸环境与人物造型连续性参考图 到 封面生成',
  )

  await page.getByRole('button', {
    name: '选择连线：封面生成 到 历史图片生成结果与收束画面',
  }).click()
  await expect(identity).toHaveAccessibleName(
    '选中连线：生成结果，封面生成 到 历史图片生成结果与收束画面',
  )
  await expect(identity.getByRole('button', { name: '在连线中插入节点' })).toBeVisible()
  await expect(page.locator('.selected-edge-identity')).toHaveCount(1)
  const identityBox = await identity.boundingBox()
  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  expect(identityBox).not.toBeNull()
  expect(surfaceBox).not.toBeNull()
  for (const persisted of state.documents[FIRST_CANVAS_ID].nodes) {
    const node = mapCanvasNode(persisted as unknown as CanvasNodeDto)
    const size = canvasNodeVisualSize(node)
    const nodeBox = {
      x: surfaceBox!.x + node.x,
      y: surfaceBox!.y + node.y,
      width: size.width,
      height: size.height,
    }
    const overlaps = identityBox!.x < nodeBox.x + nodeBox.width
      && identityBox!.x + identityBox!.width > nodeBox.x
      && identityBox!.y < nodeBox.y + nodeBox.height
      && identityBox!.y + identityBox!.height > nodeBox.y
    expect(overlaps, `selected edge identity overlaps node ${node.id}`).toBe(false)
  }
  expect(documentPatches(state)).toHaveLength(0)

  await mkdir(evidenceDirectory, { recursive: true })
  await page.waitForTimeout(250)
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-result-edge-1440x900.png'), fullPage: true })

  await page.locator('.canvas-surface').click({ position: { x: 1120, y: 700 } })
  await expect(identity).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
})

test('selected edge identity stays bounded at compact width and passive in readonly', async ({ page }) => {
  const state = createResourceMockState()
  addInputEdges(state)
  await openResourceWorkspace(page, state, { width: 920, height: 760 })

  await page.getByRole('button', {
    name: '选择连线：海岸环境与人物造型连续性参考图 到 封面生成',
  }).click()
  const identity = page.getByRole('group', {
    name: '选中连线：参考图输入，海岸环境与人物造型连续性参考图 到 封面生成',
  })
  const surface = await page.locator('.canvas-surface').boundingBox()
  const compactBox = await identity.boundingBox()
  expect(surface).not.toBeNull()
  expect(compactBox).not.toBeNull()
  expect(compactBox!.x).toBeGreaterThanOrEqual(surface!.x)
  expect(compactBox!.x + compactBox!.width).toBeLessThanOrEqual(surface!.x + surface!.width)
  expect(await identity.evaluate((element) => getComputedStyle(element).overflowX)).toBe('hidden')
  await expect(identity.locator('[title="海岸环境与人物造型连续性参考图"]')).toHaveCount(1)
  await expect(identity.locator('[title="封面生成"]')).toHaveCount(1)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-media-edge-920x760.png'), fullPage: true })

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(identity).toBeVisible()
  await expect(identity.getByRole('button')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '改接连线来源' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  await page.screenshot({ path: resolve(evidenceDirectory, 'selected-media-edge-readonly-375x812.png'), fullPage: true })
})
