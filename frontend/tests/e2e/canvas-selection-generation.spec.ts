import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { resolveGenerationContext } from '../../src/modules/canvas/generation-context'
import { createSelectionGenerationCommand, moveSelectionGenerationInput, resolveSelectionGenerationIntent } from '../../src/modules/canvas/selection-generation'
import { projectSelectedNodes } from '../../src/store/canvas'
import type { CanvasNode } from '../../src/types/canvas'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-052-dense-composition-preflight')
const hullEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-064-composition-hull')
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
  expect(resolveSelectionGenerationIntent(sources)?.inputs).toEqual([
    { kind: 'text', nodeId: 'script-a', order: 1 },
    { kind: 'reference', nodeId: 'asset-a', order: 1 },
    { kind: 'text', nodeId: 'script-b', order: 2 },
    { kind: 'reference', nodeId: 'asset-b', order: 2 },
  ])

  expect(createSelectionGenerationCommand(sources.filter((node) => node.type === 'script'), 'image', () => crypto.randomUUID()))
    .toMatchObject({ nodes: [{ contentData: { subtype: 'image' } }], connections: [{ targetPort: 'prompt' }, { targetPort: 'prompt' }] })
  expect(createSelectionGenerationCommand(sources.filter((node) => node.type === 'asset'), 'video', () => crypto.randomUUID()))
    .toMatchObject({ nodes: [{ contentData: { subtype: 'video' } }], connections: [{ targetPort: 'media' }, { targetPort: 'media' }] })
})

test('pure composition places generation from canonical visible source bounds', () => {
  const sources: CanvasNode[] = [
    sourceNode('script-a', 'script', { text: 'Portrait study', x: 100, y: 80 }),
    {
      id: 'asset-a', type: 'asset', title: 'Portrait', x: 420, y: 180, width: 200, height: 160,
      contentData: {
        subtype: 'image', serialization_version: 1, asset_id: 'asset-a',
        url: '/uploads/portrait.png', aspect_ratio: 0.5,
      },
    },
  ]
  let id = 0

  const command = createSelectionGenerationCommand(sources, 'image', () => `visible-${id++}`)

  expect(command?.nodes[0]).toMatchObject({ x: 616, y: 120 })
})

test('selected node projection preserves explicit selection order before composition', () => {
  const documentNodes = [
    sourceNode('script-a', 'script'),
    sourceNode('asset-a', 'asset', { assetId: 'asset-a' }),
    sourceNode('script-b', 'script'),
    sourceNode('asset-b', 'asset', { assetId: 'asset-b' }),
  ]
  const selected = projectSelectedNodes(documentNodes, ['asset-b', 'script-b', 'asset-a', 'script-a', 'missing'])
  expect(selected.map((node) => node.id)).toEqual(['asset-b', 'script-b', 'asset-a', 'script-a'])
  expect(resolveSelectionGenerationIntent(selected)?.inputs).toEqual([
    { kind: 'reference', nodeId: 'asset-b', order: 1 },
    { kind: 'text', nodeId: 'script-b', order: 1 },
    { kind: 'reference', nodeId: 'asset-a', order: 2 },
    { kind: 'text', nodeId: 'script-a', order: 2 },
  ])
})

test('composition preflight reorders one input kind without disturbing the other', () => {
  const selected = [
    sourceNode('reference-a', 'asset', { assetId: 'asset-a' }),
    sourceNode('prompt-a', 'script'),
    sourceNode('reference-b', 'asset', { assetId: 'asset-b' }),
    sourceNode('prompt-b', 'script'),
  ]
  const referencesMoved = moveSelectionGenerationInput(selected, 'reference-b', 'up')
  expect(referencesMoved).toEqual(['reference-b', 'prompt-a', 'reference-a', 'prompt-b'])
  const reordered = projectSelectedNodes(selected, referencesMoved!)
  const finalIds = moveSelectionGenerationInput(reordered, 'prompt-a', 'down')
  expect(finalIds).toEqual([
    'reference-b', 'prompt-b', 'reference-a', 'prompt-a',
  ])
  const finalSelection = projectSelectedNodes(selected, finalIds!)
  for (const mediaType of ['image', 'video'] as const) {
    let sequence = 0
    const command = createSelectionGenerationCommand(finalSelection, mediaType, () => `reorder-${mediaType}-${sequence++}`)!
    expect(command.connections.map((edge) => [edge.from, edge.targetPort, edge.metadata?.input_order])).toEqual([
      ['reference-b', 'media', 1], ['prompt-b', 'prompt', 1], ['reference-a', 'media', 2], ['prompt-a', 'prompt', 2],
    ])
  }
  expect(moveSelectionGenerationInput(reordered, 'reference-b', 'up')).toBeNull()
  expect(moveSelectionGenerationInput(reordered, 'reference-a', 'down')).toBeNull()
  expect(moveSelectionGenerationInput(reordered, 'missing', 'up')).toBeNull()
  expect(moveSelectionGenerationInput([selected[0]], 'reference-a', 'up')).toBeNull()
})

test('multi-result composition preserves result order and avoids the occupied graph column', () => {
  const resultA: CanvasNode = {
    id: 'result-a', type: 'result', title: 'Result A', x: 80, y: 80, width: 320, height: 180,
    contentData: { subtype: 'image', serialization_version: 1, asset_id: 'result-asset-a' },
  }
  const resultB: CanvasNode = {
    ...resultA, id: 'result-b', title: 'Result B', x: 80, y: 320,
    contentData: { subtype: 'image', serialization_version: 1, asset_id: 'result-asset-b' },
  }
  const blocker: CanvasNode = {
    id: 'blocker', type: 'note', title: 'Occupied', x: 496, y: 190, width: 340, height: 220,
    contentData: { subtype: 'annotation', serialization_version: 1 },
  }
  let id = 0
  const command = createSelectionGenerationCommand(
    [resultA, resultB], 'video', () => `remix-${id++}`, [resultA, resultB, blocker],
  )!
  expect(command.nodes[0]).toMatchObject({ type: 'generation', x: 496, y: 424, contentData: { subtype: 'video' } })
  expect(command.connections.map((edge) => [edge.from, edge.targetPort, edge.metadata?.input_order])).toEqual([
    ['result-a', 'media', 1], ['result-b', 'media', 2],
  ])
})

test('pure composition rejects partial, excluded, protected, and unsupported selections', () => {
  const script = sourceNode('script', 'script')
  const image = sourceNode('image', 'asset', { assetId: 'asset-image' })
  const invalidResult = (id: string, contentData: CanvasNode['contentData']): CanvasNode => ({
    id, type: 'result', title: id, x: 0, y: 0, width: 320, height: 180, contentData,
  })
  const invalidCases: CanvasNode[][] = [
    [script],
    [sourceNode('locked', 'script', { isLocked: true }), image],
    [sourceNode('child', 'script', { parentNodeId: 'group' }), image],
    [sourceNode('empty', 'script', { text: '' }), image],
    [script, sourceNode('missing', 'asset')],
    [script, sourceNode('video', 'asset', { subtype: 'video', assetId: 'asset-video' })],
    [script, invalidResult('video-result', { subtype: 'video', serialization_version: 1, asset_id: 'asset-video-result' })],
    [script, invalidResult('missing-result', { subtype: 'image', serialization_version: 1 })],
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
  await surface.click({ position: { x: 560, y: 460 } })
  await surface.click({ position: { x: 180, y: 200 }, modifiers: ['Control'] })
  await surface.click({ position: { x: 560, y: 180 }, modifiers: ['Control'] })
  await surface.click({ position: { x: 180, y: 490 }, modifiers: ['Control'] })
  const toolbar = page.getByRole('toolbar', { name: '4 个已选节点的操作' })
  await expect(toolbar).toBeVisible()
  const inputRoles = page.locator('.selection-generation-intent span')
  await expect(inputRoles).toHaveText(['R1', 'T1', 'R2', 'T2'])
  expect(documentPatches(state)).toHaveLength(0)
  await toolbar.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  let composeMenu = page.getByRole('menu', { name: '选择生成任务类型' })
  await expect(composeMenu.getByRole('list', { name: '有序生成输入' }).getByRole('listitem')).toHaveText([
    'R1人物参考', 'T1场景约束', 'R2海岸参考', 'T2镜头约束',
  ])
  await expect(composeMenu.getByRole('button', { name: '上移 R1 人物参考' })).toBeDisabled()
  await expect(composeMenu.getByRole('button', { name: '下移 R2 海岸参考' })).toBeDisabled()
  const moveReferenceUp = composeMenu.getByRole('button', { name: '上移 R2 海岸参考' })
  await moveReferenceUp.focus()
  await page.keyboard.press('Enter')
  await expect(composeMenu.getByRole('list', { name: '有序生成输入' }).getByRole('listitem')).toHaveText([
    'R1海岸参考', 'T1场景约束', 'R2人物参考', 'T2镜头约束',
  ])
  await composeMenu.getByRole('button', { name: '下移 T1 场景约束' }).click()
  await expect(composeMenu.getByRole('list', { name: '有序生成输入' }).getByRole('listitem')).toHaveText([
    'R1海岸参考', 'T1镜头约束', 'R2人物参考', 'T2场景约束',
  ])
  await expect(inputRoles).toHaveText(['R1', 'T1', 'R2', 'T2'])
  expect(documentPatches(state)).toHaveLength(0)
  expect(state.canvases[0].graph_revision).toBe(0)
  await page.keyboard.press('Escape')
  await expect(composeMenu).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
  await toolbar.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  composeMenu = page.getByRole('menu', { name: '选择生成任务类型' })
  await expect(composeMenu.getByRole('list', { name: '有序生成输入' }).getByRole('listitem')).toHaveText([
    'R1海岸参考', 'T1镜头约束', 'R2人物参考', 'T2场景约束',
  ])
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'mixed-selection-compose-menu-1440x900.png'), fullPage: true })
  await composeMenu.getByRole('menuitem', { name: '视频生成' }).click()

  await expect.poll(() => documentPatches(state).length).toBe(1)
  await expect(page.locator('.selection-generation-intent')).toHaveCount(0)
  const firstPatch = documentPatches(state)[0].body!
  expect(firstPatch.node_upserts).toHaveLength(1)
  expect(firstPatch.connection_upserts).toHaveLength(4)
  expect(firstPatch.node_upserts[0]).toMatchObject({ node_type: 'generation', content: { subtype: 'video' } })
  const persistedInputs = firstPatch.connection_upserts
    .map((edge) => [edge.source_node_id, edge.target_port, edge.metadata?.input_order])
    .sort((left, right) => `${left[1]}-${left[2]}`.localeCompare(`${right[1]}-${right[2]}`))
  expect(persistedInputs).toEqual([
    ['asset-a', 'media', 1], ['asset-b', 'media', 2],
    ['script-b', 'prompt', 1], ['script-a', 'prompt', 2],
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
  await expect(page.getByText('提示词 1 · 镜头约束')).toBeVisible()
  await expect(page.getByText('提示词 2 · 场景约束')).toBeVisible()
  await expect(page.getByText('参考图 1 · 海岸参考')).toBeVisible()
  await expect(page.getByText('参考图 2 · 人物参考')).toBeVisible()
})

test('compact desktop keeps the compose menu in bounds and creates image generation from text', async ({ page }) => {
  const state = createResourceMockState()
  const sources = [
    sourceNode('script-left', 'script', { title: '主体描述', text: '雨夜街道中的人物', x: 90, y: 160 }),
    sourceNode('script-right', 'script', { title: '光线描述：霓虹反射与潮湿路面连续变化', text: '霓虹反射与潮湿路面', x: 470, y: 160 }),
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
  await expect(page.locator('.selection-generation-intent span')).toHaveText(['T1', 'T2'])
  const compactHull = page.locator('.selection-aggregate-hull')
  await expect(compactHull).toContainText('已选 2 个节点')
  const compactHullBox = await compactHull.boundingBox()
  expect(compactHullBox).not.toBeNull()
  expect(compactHullBox!.x).toBeGreaterThanOrEqual(surfaceBox!.x)
  expect(compactHullBox!.x + compactHullBox!.width).toBeLessThanOrEqual(surfaceBox!.x + surfaceBox!.width)
  await mkdir(hullEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(hullEvidenceDirectory, 'compose-ready-hull-920x900.png'), fullPage: true })
  const aggregateTrigger = compactHull.getByRole('button', { name: '从 2 个已选节点批量生成' })
  await aggregateTrigger.click()
  const menu = page.getByRole('menu', { name: '选择生成任务类型' })
  await expect(menu.getByText('2 个来源 · 2 提示词 · 0 参考图 · 0 结果引用')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(aggregateTrigger).toBeFocused()
  await aggregateTrigger.click()
  await page.locator('body').dispatchEvent('pointerdown')
  await expect(menu).toHaveCount(0)
  await aggregateTrigger.click()
  await expect(menu.getByRole('list', { name: '有序生成输入' }).getByRole('listitem')).toHaveText([
    'T1主体描述', 'T2光线描述：霓虹反射与潮湿路面连续变化',
  ])
  const box = await menu.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(920)
  expect(await menu.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(Math.ceil(box!.width))
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'text-selection-compose-menu-920x900.png'), fullPage: true })
  await menu.getByRole('menuitem', { name: '图片生成' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  expect(documentPatches(state)[0].body?.node_upserts[0]).toMatchObject({ content: { subtype: 'image' } })
  expect(documentPatches(state)[0].body?.connection_upserts).toHaveLength(2)
})

test('compose-ready sources share one neutral aggregate hull through zoom', async ({ page }) => {
  const state = createResourceMockState()
  const sources = [
    sourceNode('hull-script-left', 'script', { title: '主体描述', text: '雨夜街道中的人物', x: 100, y: 180 }),
    sourceNode('hull-script-right', 'script', { title: '光线描述', text: '霓虹反射与潮湿路面', x: 500, y: 220 }),
  ]
  state.documents[FIRST_CANVAS_ID] = { nodes: sources.map(persistedNode), connections: [] }
  await openResourceWorkspace(page, state)
  const surface = page.locator('.canvas-surface')
  await surface.click({ position: { x: 180, y: 260 } })
  await surface.click({ position: { x: 580, y: 300 }, modifiers: ['Control'] })

  const hull = page.locator('.selection-aggregate-hull')
  await expect(hull).toHaveCount(1)
  await expect(hull).toContainText('已选 2 个节点')
  await expect(hull).toHaveCSS('pointer-events', 'none')
  const assertContainment = async () => {
    const hullBox = await hull.boundingBox()
    const roleBoxes = await page.locator('.selection-generation-intent').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()))
    expect(hullBox).not.toBeNull()
    expect(roleBoxes).toHaveLength(2)
    for (const box of roleBoxes) {
      expect(box.x).toBeGreaterThan(hullBox!.x)
      expect(box.y).toBeGreaterThan(hullBox!.y)
      expect(box.x + box.width).toBeLessThan(hullBox!.x + hullBox!.width)
      expect(box.y + box.height).toBeLessThan(hullBox!.y + hullBox!.height)
    }
    return hullBox!
  }
  const initialBox = await assertContainment()
  const hullLabelBox = await hull.locator('.selection-aggregate-label').boundingBox()
  const roleLabelBoxes = await page.locator('.selection-generation-intent span').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().toJSON()))
  expect(hullLabelBox).not.toBeNull()
  for (const box of roleLabelBoxes) {
    const overlaps = hullLabelBox!.x < box.x + box.width && hullLabelBox!.x + hullLabelBox!.width > box.x &&
      hullLabelBox!.y < box.y + box.height && hullLabelBox!.y + hullLabelBox!.height > box.y
    expect(overlaps).toBe(false)
  }
  await page.locator('.workspace-stage').evaluate(() => new Promise<void>((resolveFrame) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()))
  }))
  await mkdir(hullEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(hullEvidenceDirectory, 'compose-ready-hull-1440x900.png'), fullPage: true })
  const zoom = page.getByLabel('缩放百分比')
  await zoom.fill('150')
  await zoom.press('Enter')
  await expect(zoom).toHaveValue('150')
  const zoomedBox = await assertContainment()
  expect(zoomedBox.width).toBeGreaterThan(initialBox.width * 1.4)
})

test('dense ten-node preflight keeps actions fixed while eight references scroll and reorder', async ({ page }) => {
  const state = createResourceMockState()
  state.canvases[0].viewport_zoom = 0.5
  const prompts = [
    sourceNode('dense-prompt-a', 'script', { title: '全局视觉约束', text: '低饱和电影质感', x: 80, y: 80 }),
    sourceNode('dense-prompt-b', 'script', { title: '镜头运动约束', text: '缓慢横移并保持主体连续', x: 440, y: 80 }),
  ]
  const references = Array.from({ length: 8 }, (_, index) => sourceNode(`dense-reference-${index + 1}`, 'asset', {
    title: `关键帧参考 ${index + 1}${index === 7 ? '：收束镜头中的人物与环境连续关系' : ''}`,
    assetId: `dense-asset-${index + 1}`,
    x: 80 + (index % 4) * 360,
    y: 380 + Math.floor(index / 4) * 280,
  }))
  const sources = [...prompts, ...references]
  state.documents[FIRST_CANVAS_ID] = { nodes: sources.map(persistedNode), connections: [] }
  state.assets.push(...references.map((node, index) => ({
    ...state.assets[0], id: `dense-asset-${index + 1}`, url: `https://media.revid.test/dense-${index + 1}.png`, content_text: node.title,
  })))
  for (const mediaType of ['image', 'video'] as const) {
    let sequence = 0
    const command = createSelectionGenerationCommand(sources, mediaType, () => `dense-${mediaType}-${sequence++}`)!
    const context = resolveGenerationContext(command.nodes[0], [...sources, ...command.nodes], command.connections)
    expect(context.imageIds).toEqual(Array.from({ length: 8 }, (_, index) => `dense-asset-${index + 1}`))
  }
  await openResourceWorkspace(page, state, { width: 1440, height: 760 })
  const surface = page.locator('.canvas-surface')
  for (const [index, node] of sources.entries()) {
    await surface.click({
      position: { x: node.x * 0.5 + 80, y: node.y * 0.5 + 60 },
      modifiers: index === 0 ? [] : ['Control'],
    })
  }
  await expect(page.getByRole('toolbar', { name: '10 个已选节点的操作' })).toBeVisible()
  await page.getByRole('button', { name: '合并所选节点为生成任务' }).click()
  const panel = page.getByRole('menu', { name: '选择生成任务类型' })
  const sourceList = panel.getByRole('list', { name: '有序生成输入' })
  await expect(sourceList.getByRole('listitem')).toHaveCount(10)
  const overflow = await panel.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight }))
  expect(overflow.scrollHeight).toBe(overflow.clientHeight)
  const listOverflow = await sourceList.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight }))
  expect(listOverflow.scrollHeight).toBeGreaterThan(listOverflow.clientHeight)
  const videoAction = panel.getByRole('menuitem', { name: '视频生成' })
  await expect(videoAction).toBeInViewport()
  await sourceList.evaluate((element) => { element.scrollTop = element.scrollHeight })
  const moveLastReferenceUp = panel.getByRole('button', { name: /上移 R8 关键帧参考 8/ })
  await moveLastReferenceUp.focus()
  await page.keyboard.press('Enter')
  await expect(sourceList.getByRole('listitem').nth(8)).toContainText('R7关键帧参考 8')
  await expect(sourceList.getByRole('listitem').nth(9)).toContainText('R8关键帧参考 7')
  expect(documentPatches(state)).toHaveLength(0)
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'dense-ten-source-preflight-1440x760.png'), fullPage: true })
  await page.setViewportSize({ width: 920, height: 760 })
  const compactBox = await panel.boundingBox()
  expect(compactBox).not.toBeNull()
  expect(compactBox!.x).toBeGreaterThanOrEqual(0)
  expect(compactBox!.x + compactBox!.width).toBeLessThanOrEqual(920)
  expect(await panel.evaluate((element) => element.scrollHeight)).toBe(await panel.evaluate((element) => element.clientHeight))
  expect(await sourceList.evaluate((element) => element.scrollHeight)).toBeGreaterThan(await sourceList.evaluate((element) => element.clientHeight))
  expect(await sourceList.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(await sourceList.evaluate((element) => element.clientWidth))
  await expect(videoAction).toBeInViewport()
  await page.screenshot({ path: resolve(evidenceDirectory, 'dense-ten-source-preflight-920x760.png'), fullPage: true })
  await videoAction.click()
  await expect.poll(() => documentPatches(state).length).toBe(1)
  const persistedMedia = documentPatches(state)[0].body!.connection_upserts
    .filter((edge) => edge.target_port === 'media')
    .sort((left, right) => Number(left.metadata?.input_order) - Number(right.metadata?.input_order))
  expect(persistedMedia.map((edge) => edge.source_node_id)).toEqual([
    'dense-reference-1', 'dense-reference-2', 'dense-reference-3', 'dense-reference-4',
    'dense-reference-5', 'dense-reference-6', 'dense-reference-8', 'dense-reference-7',
  ])
})

test('invalid desktop selection keeps a neutral hull without composition mutation and readonly mobile stays passive', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: '从 2 个已选节点批量生成' })).toHaveCount(0)
  await expect(page.locator('.selection-generation-intent')).toHaveCount(0)
  await expect(page.locator('.selection-aggregate-hull')).toContainText('已选 2 个节点')
  expect(documentPatches(state)).toHaveLength(0)

  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await expect(page.locator('.selection-toolbar')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '合并所选节点为生成任务' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '从 2 个已选节点批量生成' })).toHaveCount(0)
  await expect(page.locator('.selection-generation-intent')).toHaveCount(0)
  await expect(page.locator('.selection-aggregate-hull')).toHaveCount(0)
})
