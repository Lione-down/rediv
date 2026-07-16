import { expect, test, type Page } from '@playwright/test'
import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import {
  FIRST_CANVAS_ID,
  documentPatches,
  openResourceWorkspace,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

function arrangeImageSelectionFixture(state: ResourceMockState) {
  const nodes = state.documents[FIRST_CANVAS_ID].nodes
  for (const node of nodes) {
    if (node.id === 'asset-landscape') Object.assign(node, { position_x: 160, position_y: 200 })
    else if (node.id === 'asset-portrait') Object.assign(node, { position_x: 540, position_y: 200 })
    else Object.assign(node, { position_y: Number(node.position_y) + 900 })
  }
}

async function clickCanvasNode(
  page: Page,
  position: { x: number; y: number },
  modifiers: Array<'Control' | 'Meta' | 'Shift'> = [],
) {
  await page.locator('.canvas-surface').click({
    position: { x: position.x + 80, y: position.y + 80 },
    modifiers,
  })
}

async function createStoryboardGroup(page: Page, state: ResourceMockState) {
  await clickCanvasNode(page, { x: 160, y: 200 })
  await expect(page.getByRole('button', { name: '创建分镜组' })).toHaveCount(0)
  await clickCanvasNode(page, { x: 540, y: 200 }, ['Control'])
  await page.getByRole('button', { name: '创建分镜组' }).click()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((node) => node.node_type === 'group').length).toBe(1)
  await expect.poll(() => documentPatches(state).length).toBeGreaterThan(0)
  return state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.node_type === 'group')!
}

async function selectNodeFromGraphAccess(page: Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

test('Workflow creates one durable storyboard group with exact history, reload, and whole-group movement compatibility', async ({ page }) => {
  const state = createMultiScenarioState()
  arrangeImageSelectionFixture(state)
  const originalPositions = new Map(state.documents[FIRST_CANVAS_ID].nodes
    .filter((node) => ['asset-landscape', 'asset-portrait'].includes(String(node.id)))
    .map((node) => [String(node.id), [node.position_x, node.position_y]]))
  await openResourceWorkspace(page, state)

  const group = await createStoryboardGroup(page, state)
  expect(group.content).toMatchObject({
    subtype: 'storyboard',
    serialization_version: 1,
    storyboard_schema_version: 1,
    aspect_ratio: '16:9',
    columns: 2,
    show_numbers: true,
    ordered_child_ids: ['asset-landscape', 'asset-portrait'],
  })
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => node.parent_node_id === group.id).map((node) => node.id)).toEqual([
    'asset-landscape', 'asset-portrait',
  ])
  await expect(page.locator('.storyboard-frame-number')).toHaveText(['1', '2'])
  expect(documentPatches(state)).toHaveLength(1)

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === group.id)).toBe(false)
  for (const nodeId of ['asset-landscape', 'asset-portrait']) {
    const node = state.documents[FIRST_CANVAS_ID].nodes.find((candidate) => candidate.id === nodeId)!
    expect(node.parent_node_id).toBeNull()
    expect([node.position_x, node.position_y]).toEqual(originalPositions.get(nodeId))
  }

  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === group.id)).toBe(true)
  await page.reload()
  await expect(page.getByRole('button', { name: '创建分镜组' })).toHaveCount(0)
  const reloaded = state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === group.id)!
  expect(reloaded.content).toEqual(group.content)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => node.parent_node_id === group.id)).toHaveLength(2)

  const movedIds = [String(group.id), 'asset-landscape', 'asset-portrait']
  const beforeMove = new Map(state.documents[FIRST_CANVAS_ID].nodes
    .filter((node) => movedIds.includes(String(node.id)))
    .map((node) => [String(node.id), [Number(node.position_x), Number(node.position_y)]]))
  const movePatchBaseline = documentPatches(state).length
  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  if (!surfaceBox) throw new Error('Storyboard group drag surface is unavailable')
  const start = {
    x: surfaceBox.x + Number(reloaded.position_x) + 12,
    y: surfaceBox.y + Number(reloaded.position_y) + 12,
  }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 64, start.y + 48, { steps: 4 })
  await page.mouse.up()
  await expect.poll(() => documentPatches(state).length).toBe(movePatchBaseline + 1)
  const moveUpserts = documentPatches(state).at(-1)?.body?.node_upserts as Array<Record<string, unknown>>
  expect(new Set(moveUpserts.map((node) => node.id))).toEqual(new Set(movedIds))
  const firstBefore = beforeMove.get(String(moveUpserts[0].id))!
  const delta = [Number(moveUpserts[0].position_x) - firstBefore[0], Number(moveUpserts[0].position_y) - firstBefore[1]]
  expect(delta).not.toEqual([0, 0])
  for (const node of moveUpserts) {
    const before = beforeMove.get(String(node.id))!
    expect([Number(node.position_x) - before[0], Number(node.position_y) - before[1]]).toEqual(delta)
  }
})

test('Storyboard order and Workflow settings share one metadata sequence while convert and ungroup preserve graph identity', async ({ page }) => {
  const state = createMultiScenarioState()
  arrangeImageSelectionFixture(state)
  await openResourceWorkspace(page, state)
  const group = await createStoryboardGroup(page, state)
  const currentGroup = () => state.documents[FIRST_CANVAS_ID].nodes.find((node) => node.id === group.id)!
  const edgeSnapshot = structuredClone(state.documents[FIRST_CANVAS_ID].connections)

  await page.getByRole('tab', { name: '故事板' }).click()
  const reorderPatchBaseline = documentPatches(state).length
  await page.getByRole('button', { name: '后移分镜 海岸环境参考' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(reorderPatchBaseline + 1)
  expect((currentGroup().content as Record<string, unknown>).ordered_child_ids).toEqual(['asset-portrait', 'asset-landscape'])
  expect(state.documents[FIRST_CANVAS_ID].connections).toEqual(edgeSnapshot)

  await page.getByRole('tab', { name: '工作流' }).click()
  await selectNodeFromGraphAccess(page, '分镜组 1')
  const settingsPatchBaseline = documentPatches(state).length
  await page.getByLabel('分镜列数').selectOption('1')
  await expect.poll(() => documentPatches(state).length).toBe(settingsPatchBaseline + 1)
  expect((currentGroup().content as Record<string, unknown>).columns).toBe(1)
  await page.getByRole('button', { name: '隐藏分镜编号' }).click()
  await expect.poll(() => documentPatches(state).length).toBe(settingsPatchBaseline + 2)
  expect((currentGroup().content as Record<string, unknown>).show_numbers).toBe(false)
  await expect(page.locator('.storyboard-frame-number')).toHaveCount(0)

  const childPositions = state.documents[FIRST_CANVAS_ID].nodes
    .filter((node) => node.parent_node_id === group.id)
    .map((node) => [node.id, node.position_x, node.position_y])
  await page.getByRole('button', { name: '转为普通组合' }).click()
  await expect.poll(() => (currentGroup().content as Record<string, unknown>).subtype).toBe('group')
  expect(currentGroup().content).toEqual({ title: '分镜组 1', subtype: 'group', serialization_version: 1 })
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => node.parent_node_id === group.id).map((node) => [node.id, node.position_x, node.position_y])).toEqual(childPositions)
  expect(state.documents[FIRST_CANVAS_ID].connections).toEqual(edgeSnapshot)

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => (currentGroup().content as Record<string, unknown>).subtype).toBe('storyboard')
  await page.keyboard.press('Control+Shift+g')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((node) => node.id === group.id)).toBe(false)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((node) => ['asset-landscape', 'asset-portrait'].includes(String(node.id))).map((node) => [node.id, node.position_x, node.position_y])).toEqual(childPositions)
  expect(state.documents[FIRST_CANVAS_ID].connections).toEqual(edgeSnapshot)
})
