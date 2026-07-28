import { expect, test, type Page } from '@playwright/test'
import {
  createVisualState,
  installMockApi,
  type MockState,
} from './authenticated-workflow-fixture'

const REPLACEMENT_URL =
  '/app/projects/project-e2e/canvases/canvas-first?canvas_runtime=replacement'

function addSelectableScripts(state: MockState) {
  const baseNode = state.canvasNodes[0]
  state.canvasConnections = []
  state.canvasNodes = []
  state.canvasNodes.push(
    {
      ...baseNode,
      id: 'node-hull-a',
      node_type: 'script',
      content: {
        title: '框选脚本 A',
        subtype: 'script',
        serialization_version: 1,
        text: '女孩在雨中发现信号。',
      },
      position_x: 520,
      position_y: 170,
      width: 260,
      height: 160,
    },
    {
      ...baseNode,
      id: 'node-hull-b',
      node_type: 'script',
      content: {
        title: '框选脚本 B',
        subtype: 'script',
        serialization_version: 1,
        text: '机器狗在旧车站等待。',
      },
      position_x: 860,
      position_y: 170,
      width: 260,
      height: 160,
    },
  )
}

async function openRuntime(page: Page, state: MockState) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await installMockApi(page, state)
  await page.addInitScript(() => {
    window.localStorage.setItem('revid_token', 'mock-session-token')
  })
  await page.goto(REPLACEMENT_URL)
  const runtime = page.locator('[data-canvas-runtime="replacement"]')
  await expect(runtime).toHaveAttribute('data-runtime-state', 'ready')
  return runtime
}

async function marqueeBoth(page: Page) {
  const first = page.locator('[data-runtime-node="node-hull-a"]')
  const second = page.locator('[data-runtime-node="node-hull-b"]')
  const firstBox = await first.boundingBox()
  const secondBox = await second.boundingBox()
  expect(firstBox).not.toBeNull()
  expect(secondBox).not.toBeNull()
  await page.mouse.move(secondBox!.x + secondBox!.width + 24, secondBox!.y + secondBox!.height + 24)
  await page.mouse.down()
  await page.mouse.move(firstBox!.x - 24, firstBox!.y - 24, { steps: 8 })
  await page.mouse.up()
}

test('persistent selection hull moves every framed node through one undoable command', async ({
  page,
}) => {
  const state = createVisualState()
  addSelectableScripts(state)
  const runtime = await openRuntime(page, state)
  await marqueeBoth(page)

  const hull = runtime.locator('[data-runtime-selection-hull]')
  await expect(hull, 'T6-013 RED [persistent-selection-hull-absent]').toBeVisible()
  await expect(hull).toHaveAttribute('data-selected-count', '2')
  await expect(runtime.locator('[data-node-composer]')).toHaveCount(0)
  const before = new Map(state.canvasNodes
    .filter((node) => node.id === 'node-hull-a' || node.id === 'node-hull-b')
    .map((node) => [node.id, { x: node.position_x, y: node.position_y }]))
  const hullBox = await hull.boundingBox()
  expect(hullBox).not.toBeNull()

  await page.mouse.move(hullBox!.x + hullBox!.width / 2, hullBox!.y + 8)
  await page.mouse.down()
  await page.mouse.move(hullBox!.x + hullBox!.width / 2 + 80, hullBox!.y + 48, { steps: 6 })
  await page.mouse.up()

  await expect.poll(() => state.canvasNodes
    .filter((node) => before.has(node.id))
    .every((node) => (
      Math.round(node.position_x - before.get(node.id)!.x) === 80 &&
      Math.round(node.position_y - before.get(node.id)!.y) === 40
    ))).toBe(true)
  await expect(runtime.locator('[data-runtime-selection-hull]')).toBeVisible()
  await page.screenshot({
    path: '../output/playwright/t6-013-persistent-selection-hull-moved-1440x900.png',
    fullPage: true,
  })

  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect.poll(() => state.canvasNodes
    .filter((node) => before.has(node.id))
    .every((node) => (
      node.position_x === before.get(node.id)!.x &&
      node.position_y === before.get(node.id)!.y
    ))).toBe(true)
})

test('dragging a created group moves its container and stable children by one equal delta', async ({
  page,
}) => {
  const state = createVisualState()
  addSelectableScripts(state)
  const runtime = await openRuntime(page, state)
  await marqueeBoth(page)

  await runtime
    .locator('[data-runtime-selection-toolbar]')
    .getByRole('button', { name: '组合' })
    .click()
  await expect.poll(() => state.canvasNodes.filter((node) => node.node_type === 'group').length).toBe(1)
  const group = state.canvasNodes.find((node) => node.node_type === 'group')!
  const movedIds = [String(group.id), 'node-hull-a', 'node-hull-b']
  const before = new Map(state.canvasNodes
    .filter((node) => movedIds.includes(String(node.id)))
    .map((node) => [String(node.id), { x: node.position_x, y: node.position_y }]))
  expect(before.size).toBe(3)

  const groupHandle = runtime
    .locator(`[data-runtime-node="${String(group.id)}"] [data-node-drag-handle]`)
  await expect(groupHandle).toBeVisible()
  const groupHandleBox = await groupHandle.boundingBox()
  expect(groupHandleBox).not.toBeNull()
  const renderedBefore = new Map(await Promise.all(movedIds.map(async (nodeId) => {
    const box = await runtime.locator(`[data-runtime-node="${nodeId}"]`).boundingBox()
    expect(box).not.toBeNull()
    return [nodeId, { x: box!.x, y: box!.y }] as const
  })))
  await page.mouse.move(
    groupHandleBox!.x + groupHandleBox!.width / 2,
    groupHandleBox!.y + groupHandleBox!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    groupHandleBox!.x + groupHandleBox!.width / 2 + 84,
    groupHandleBox!.y + groupHandleBox!.height / 2 + 48,
    { steps: 6 },
  )
  await expect.poll(async () => Promise.all(movedIds.map(async (nodeId) => {
    const box = await runtime.locator(`[data-runtime-node="${nodeId}"]`).boundingBox()
    return {
      x: Math.round(box!.x - renderedBefore.get(nodeId)!.x),
      y: Math.round(box!.y - renderedBefore.get(nodeId)!.y),
    }
  })), 'T6-013 RED [replacement-group-drag-preview-leaves-children-behind]').toEqual(
    movedIds.map(() => ({ x: 84, y: 48 })),
  )
  await page.screenshot({
    path: '../output/playwright/t6-013-group-unit-live-preview-1440x900.png',
    fullPage: true,
  })
  await page.mouse.up()

  await expect.poll(() => {
    const currentGroup = state.canvasNodes.find((node) => String(node.id) === String(group.id))!
    return {
      x: Math.round(currentGroup.position_x - before.get(String(group.id))!.x),
      y: Math.round(currentGroup.position_y - before.get(String(group.id))!.y),
    }
  }).not.toEqual({ x: 0, y: 0 })
  const movedGroup = state.canvasNodes.find((node) => String(node.id) === String(group.id))!
  const groupDelta = {
    x: Math.round(movedGroup.position_x - before.get(String(group.id))!.x),
    y: Math.round(movedGroup.position_y - before.get(String(group.id))!.y),
  }
  await expect.poll(() => movedIds.map((nodeId) => {
    const node = state.canvasNodes.find((candidate) => String(candidate.id) === nodeId)!
    return {
      x: Math.round(node.position_x - before.get(nodeId)!.x),
      y: Math.round(node.position_y - before.get(nodeId)!.y),
    }
  }), 'T6-013 RED [replacement-group-drag-does-not-move-children]').toEqual(
    movedIds.map(() => groupDelta),
  )
  await page.screenshot({
    path: '../output/playwright/t6-013-group-unit-moved-1440x900.png',
    fullPage: true,
  })

  await runtime.getByRole('button', { name: '撤销' }).click()
  await expect.poll(() => movedIds.map((nodeId) => {
    const node = state.canvasNodes.find((candidate) => String(candidate.id) === nodeId)!
    return [node.position_x, node.position_y]
  })).toEqual(movedIds.map((nodeId) => [
    before.get(nodeId)!.x,
    before.get(nodeId)!.y,
  ]))
})

test('spatial group count follows individual nodes across the full-containment boundary', async ({
  page,
}) => {
  const state = createVisualState()
  addSelectableScripts(state)
  const runtime = await openRuntime(page, state)
  await marqueeBoth(page)
  await runtime
    .locator('[data-runtime-selection-toolbar]')
    .getByRole('button', { name: '组合' })
    .click()
  await expect.poll(() => state.canvasNodes.filter((node) => node.node_type === 'group').length).toBe(1)
  const group = state.canvasNodes.find((node) => node.node_type === 'group')!
  const groupNode = runtime.locator(`[data-runtime-node="${String(group.id)}"]`)
  await expect(
    groupNode,
    'T6-013 RED [spatial-group-member-count-absent]',
  ).toHaveAttribute('data-group-member-count', '2')
  await expect(groupNode.locator('[data-node-identity]')).toContainText('分组 2 个节点')

  const child = runtime.locator('[data-runtime-node="node-hull-a"]')
  const childHandle = child.locator('[data-node-drag-handle]')
  const handleBox = await childHandle.boundingBox()
  expect(handleBox).not.toBeNull()
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox!.x - 560, handleBox!.y + 20, { steps: 8 })
  await page.mouse.up()

  await expect.poll(() => state.canvasNodes.find((node) => node.id === 'node-hull-a')?.parent_node_id)
    .toBeNull()
  await expect(groupNode).toHaveAttribute('data-group-member-count', '1')
  await expect(groupNode.locator('[data-node-identity]')).toContainText('分组 1 个节点')

  const remainingChildHandle = runtime
    .locator('[data-runtime-node="node-hull-b"] [data-node-drag-handle]')
  const remainingHandleBox = await remainingChildHandle.boundingBox()
  expect(remainingHandleBox).not.toBeNull()
  await page.mouse.move(
    remainingHandleBox!.x + remainingHandleBox!.width / 2,
    remainingHandleBox!.y + remainingHandleBox!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(remainingHandleBox!.x + 480, remainingHandleBox!.y + 20, { steps: 8 })
  await page.mouse.up()

  await expect.poll(() => state.canvasNodes.find((node) => node.id === 'node-hull-b')?.parent_node_id)
    .toBeNull()
  await expect(groupNode).toHaveAttribute('data-group-member-count', '0')
  await expect(groupNode.locator('[data-node-identity]')).toContainText('分组 0 个节点')

  const outsideChild = runtime.locator('[data-runtime-node="node-hull-b"]')
  const outsideChildHandle = outsideChild.locator('[data-node-drag-handle]')
  const outsideChildBox = await outsideChild.boundingBox()
  const outsideHandleBox = await outsideChildHandle.boundingBox()
  const groupBox = await groupNode.boundingBox()
  expect(outsideChildBox).not.toBeNull()
  expect(outsideHandleBox).not.toBeNull()
  expect(groupBox).not.toBeNull()
  const desiredChildLeft = groupBox!.x + (groupBox!.width - outsideChildBox!.width) / 2
  const desiredChildTop = groupBox!.y + (groupBox!.height - outsideChildBox!.height) / 2
  await page.mouse.move(
    outsideHandleBox!.x + outsideHandleBox!.width / 2,
    outsideHandleBox!.y + outsideHandleBox!.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    outsideHandleBox!.x + outsideHandleBox!.width / 2
      + desiredChildLeft - outsideChildBox!.x,
    outsideHandleBox!.y + outsideHandleBox!.height / 2
      + desiredChildTop - outsideChildBox!.y,
    { steps: 8 },
  )
  await page.mouse.up()

  await expect.poll(() => state.canvasNodes.find((node) => node.id === 'node-hull-b')?.parent_node_id)
    .toBe(String(group.id))
  await expect(groupNode).toHaveAttribute('data-group-member-count', '1')
  await page.screenshot({
    path: '../output/playwright/t6-013-spatial-group-live-membership-1440x900.png',
    fullPage: true,
  })
})

test('selection hull plus fans out selected sources before opening compatible actions', async ({
  page,
}) => {
  const state = createVisualState()
  addSelectableScripts(state)
  const runtime = await openRuntime(page, state)
  await marqueeBoth(page)

  const continuation = runtime.locator('[data-selection-continuation]')
  await expect(continuation, 'T6-013 RED [multi-source-continuation-absent]').toBeVisible()
  const visibleHullPort = continuation.locator('[data-selection-visible-port]')
  await expect(
    visibleHullPort,
    'T6-013 RED [selection-hull-plus-does-not-reuse-node-port-presentation]',
  ).toBeVisible()
  const visibleNodePort = runtime.locator(
    '[data-runtime-node="node-hull-b"] [data-visible-port="output"]',
  )
  const [hullPortBox, nodePortBox, hullStyle, nodeStyle] = await Promise.all([
    visibleHullPort.boundingBox(),
    visibleNodePort.boundingBox(),
    visibleHullPort.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderTopColor: style.borderTopColor,
        borderTopWidth: style.borderTopWidth,
        boxShadow: style.boxShadow,
        color: style.color,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
      }
    }),
    visibleNodePort.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderTopColor: style.borderTopColor,
        borderTopWidth: style.borderTopWidth,
        boxShadow: style.boxShadow,
        color: style.color,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
      }
    }),
  ])
  expect(hullPortBox).not.toBeNull()
  expect(nodePortBox).not.toBeNull()
  expect(Math.abs(hullPortBox!.width - nodePortBox!.width)).toBeLessThanOrEqual(0.5)
  expect(Math.abs(hullPortBox!.height - nodePortBox!.height)).toBeLessThanOrEqual(0.5)
  expect(hullStyle).toEqual(nodeStyle)
  const plusBox = await continuation.boundingBox()
  expect(plusBox).not.toBeNull()
  expect(plusBox!.width).toBeGreaterThanOrEqual(hullPortBox!.width * 2)
  expect(plusBox!.height).toBeGreaterThanOrEqual(hullPortBox!.height * 2)
  await page.screenshot({
    path: '../output/playwright/t6-013-selection-hull-node-matched-plus-1440x900.png',
    fullPage: true,
  })
  await page.mouse.move(plusBox!.x + plusBox!.width / 2, plusBox!.y + plusBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(1240, 500, { steps: 6 })
  await expect(runtime.locator('[data-selection-preview-edge]')).toHaveCount(2)
  await page.screenshot({
    path: '../output/playwright/t6-013-multi-source-preview-1440x900.png',
    fullPage: true,
  })
  await page.mouse.up()

  const menu = runtime.locator('[data-runtime-continuation-menu]')
  await expect(menu).toBeVisible()
  await expect(menu).toContainText('引用选中的 2 个节点')
  await expect(menu.getByRole('button', { name: '创建文本' })).toBeVisible()
  await expect(menu.getByRole('button', { name: '创建脚本' })).toBeVisible()
  await expect(menu.getByRole('button', { name: '创建图片生成' })).toBeVisible()
  await expect(menu.getByRole('button', { name: '创建视频生成' })).toBeVisible()
  await expect(menu.getByRole('button', { name: '创建音频生成' })).toHaveCount(0)
  await page.screenshot({
    path: '../output/playwright/t6-013-multi-source-menu-1440x900.png',
    fullPage: true,
  })
  await menu.getByRole('button', { name: '创建图片生成' }).click()
  await expect.poll(() => state.canvasNodes.length).toBe(3)
  await expect.poll(() => state.canvasConnections.length).toBe(2)
  expect(new Set(state.canvasConnections.map((connection) => connection.target_node_id)).size).toBe(1)
})
