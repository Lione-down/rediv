import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  captureCommandEvidence,
  captureUnitDEvidence,
  clickNode,
  connection,
  createState,
  node,
  openCommandCanvas,
} from './canvas-command-interactions-fixture'

test('modifier selection stays deterministic and dragging one selected node moves the full selection', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state)

  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  if (!surfaceBox) throw new Error('Canvas surface is unavailable')
  await page.mouse.move(surfaceBox.x + 120, surfaceBox.y + 210)
  await page.mouse.down()
  await page.mouse.move(surfaceBox.x + 800, surfaceBox.y + 430, { steps: 4 })
  await page.mouse.up()
  await expect(page.getByRole('toolbar', { name: '2 个已选节点的操作' })).toBeVisible()
  await expect(page.getByRole('button', { name: '定位到 镜头 A' })).toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: '定位到 镜头 B' })).toHaveClass(/selected/)
  await clickNode(page, 520, ['Control'])
  await expect(page.getByRole('toolbar', { name: '1 个已选节点的操作' })).toBeVisible()
  await clickNode(page, 520, ['Control'])

  const dragHandle = page.getByLabel('移动 镜头 A')
  const dragHandleBox = await dragHandle.boundingBox()
  if (!dragHandleBox) throw new Error('DOM card drag handle is unavailable')
  const dragStart = { x: dragHandleBox.x + 10, y: dragHandleBox.y + 21 }
  await dragHandle.hover({ position: { x: 10, y: 21 } })
  await page.mouse.down()
  await page.mouse.move(dragStart.x - 80, dragStart.y + 60, { steps: 4 })
  expect(state.requests.filter((request) => request.method === 'PUT')).toHaveLength(0)
  await page.mouse.up()

  await expect.poll(() => state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  )).length).toBe(1)
  const movePatch = state.requests.find((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  ))
  const moves = movePatch?.body?.node_upserts as Array<Record<string, unknown>>
  expect(moves).toEqual(expect.arrayContaining([
    expect.objectContaining({ position_x: 96, position_y: 312 }),
    expect.objectContaining({ position_x: 436, position_y: 312 }),
  ]))
  await expect(page.getByRole('toolbar', { name: '2 个已选节点的操作' })).toBeVisible()
  const desktopEvidence = await captureCommandEvidence(page, 'desktop-multi-selection-toolbar')
  await page.screenshot({ path: desktopEvidence })
  await testInfo.attach('desktop-multi-selection-toolbar', { path: desktopEvidence, contentType: 'image/png' })
})

test('dragging a normal group previews and commits the parent and children as one exact unit', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+g')
  await expect.poll(() => state.nodes.filter((item) => item.node_type === 'group').length).toBe(1)

  const group = state.nodes.find((item) => item.node_type === 'group')!
  const movedIds = [String(group.id), 'node-a', 'node-b']
  const before = new Map(state.nodes.map((item) => [String(item.id), {
    x: Number(item.position_x), y: Number(item.position_y), parentId: item.parent_node_id,
  }]))
  const documentPatches = () => state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  ))
  const baselinePatchCount = documentPatches().length
  const externalEdge = page.getByRole('button', { name: '选择连线：镜头 B 到 镜头 C' })
  const originalPath = await externalEdge.getAttribute('d')
  const surfaceBox = await page.locator('.canvas-surface').boundingBox()
  if (!surfaceBox || !originalPath) throw new Error('Group drag browser geometry is unavailable')
  const start = {
    x: surfaceBox.x + Number(group.position_x) + 8,
    y: surfaceBox.y + Number(group.position_y) + 8,
  }

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 96, start.y + 64, { steps: 4 })
  await expect(externalEdge).not.toHaveAttribute('d', originalPath)
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })))
  await page.mouse.up()
  await expect(externalEdge).toHaveAttribute('d', originalPath)
  expect(documentPatches()).toHaveLength(baselinePatchCount)

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + 96, start.y + 64, { steps: 4 })
  await page.mouse.up()
  await expect.poll(() => documentPatches().length).toBe(baselinePatchCount + 1)
  const moveUpserts = documentPatches().at(-1)?.body?.node_upserts as Array<Record<string, unknown>>
  expect(moveUpserts.map((item) => item.id)).toEqual(movedIds)
  const delta = {
    x: Number(moveUpserts[0].position_x) - before.get(movedIds[0])!.x,
    y: Number(moveUpserts[0].position_y) - before.get(movedIds[0])!.y,
  }
  expect(delta).not.toEqual({ x: 0, y: 0 })
  for (const item of moveUpserts) {
    const origin = before.get(String(item.id))!
    expect({ x: Number(item.position_x) - origin.x, y: Number(item.position_y) - origin.y }).toEqual(delta)
  }
  expect(moveUpserts.some((item) => item.id === 'node-c')).toBe(false)
  const groupEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-080-group-drag')
  const groupEvidence = resolve(groupEvidenceDirectory, 'group-and-children-moved.png')
  await mkdir(groupEvidenceDirectory, { recursive: true })
  await expect(page.getByRole('button', { name: `定位到 ${String((group.content as Record<string, unknown>).title)}` })).toHaveClass(/selected/)
  await page.locator('.workspace-stage').evaluate(() => new Promise<void>((resolveFrame) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()))
  }))
  await page.screenshot({ path: groupEvidence, fullPage: true })
  await testInfo.attach('group-and-children-moved', { path: groupEvidence, contentType: 'image/png' })

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => movedIds.map((id) => {
    const item = state.nodes.find((node) => node.id === id)!
    return [item.position_x, item.position_y]
  })).toEqual(movedIds.map((id) => [before.get(id)!.x, before.get(id)!.y]))
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => movedIds.map((id) => {
    const item = state.nodes.find((node) => node.id === id)!
    return [Number(item.position_x) - before.get(id)!.x, Number(item.position_y) - before.get(id)!.y]
  })).toEqual(movedIds.map(() => [delta.x, delta.y]))

  await page.reload()
  await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toBeVisible()
  const reloadedGroup = state.nodes.find((item) => item.node_type === 'group')!
  await page.locator('.canvas-surface').click({ position: {
    x: Number(reloadedGroup.position_x) + 8,
    y: Number(reloadedGroup.position_y) + 8,
  } })
  await expect(page.getByRole('toolbar', { name: '1 个已选节点的操作' })).toBeVisible()
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+Shift+g')
  await expect.poll(() => state.nodes.filter((item) => item.node_type === 'group').length).toBe(0)
  for (const childId of ['node-a', 'node-b']) {
    const child = state.nodes.find((item) => item.id === childId)!
    expect(child.parent_node_id).toBeNull()
    expect([Number(child.position_x) - before.get(childId)!.x, Number(child.position_y) - before.get(childId)!.y]).toEqual([delta.x, delta.y])
  }
  expect(state.connections.map((item) => item.id)).toEqual(['connection-ab', 'connection-bc'])
})

test('keyboard duplicate and toolbar delete share one selected-subgraph command boundary', async ({ page }) => {
  const state = createState()
  await openCommandCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])

  await page.keyboard.press('Control+d')
  await expect.poll(() => state.nodes.length).toBe(5)
  await expect.poll(() => state.connections.length).toBe(3)
  const copiedNodes = state.nodes.filter((item) => !['node-a', 'node-b', 'node-c'].includes(String(item.id)))
  const copiedNodeA = copiedNodes.find((item) => (
    String((item.content as Record<string, unknown>).title).includes('A')
  ))
  const copiedNodeB = copiedNodes.find((item) => (
    String((item.content as Record<string, unknown>).title).includes('B')
  ))
  expect(state.connections.at(-1)).toEqual(expect.objectContaining({
    source_node_id: copiedNodeA?.id,
    target_node_id: copiedNodeB?.id,
  }))
  await expect(page.getByRole('button', { name: '定位到 镜头 A 副本' })).toHaveClass(/selected/)
  await expect(page.getByRole('button', { name: '定位到 镜头 B 副本' })).toHaveClass(/selected/)

  await page.getByRole('button', { name: '删除所选节点' }).click()
  await expect.poll(() => state.nodes.length).toBe(3)
  await expect.poll(() => state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  )).length).toBe(2)
  expect(state.nodes.map((item) => item.id)).toEqual(['node-a', 'node-b', 'node-c'])
  expect(state.connections.map((item) => item.id)).toEqual(['connection-ab', 'connection-bc'])
})

test('Canvas-focus undo and redo restore one exact command through atomic document patches', async ({ page }) => {
  const state = createState()
  await openCommandCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])

  await page.keyboard.press('Control+d')
  await expect.poll(() => state.nodes.length).toBe(5)
  await expect.poll(() => state.connections.length).toBe(3)
  const copiedNodeIds = state.nodes.slice(3).map((item) => item.id)
  const copiedConnectionId = state.connections.at(-1)?.id

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.nodes.map((item) => item.id)).toEqual(['node-a', 'node-b', 'node-c'])
  await expect.poll(() => state.connections.map((item) => item.id)).toEqual(['connection-ab', 'connection-bc'])

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.nodes.slice(3).map((item) => item.id)).toEqual(copiedNodeIds)
  await expect.poll(() => state.connections.at(-1)?.id).toBe(copiedConnectionId)

  const patchCount = state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  )).length
  await page.getByRole('link', { name: '返回项目首页' }).focus()
  await page.keyboard.press('Control+z')
  await page.waitForTimeout(650)
  expect(state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  ))).toHaveLength(patchCount)
  expect(state.nodes.slice(3).map((item) => item.id)).toEqual(copiedNodeIds)
})

test('mobile review mode never exposes or dispatches selection mutation commands', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state, 375)
  await clickNode(page, 180)
  await expect(page.getByRole('toolbar', { name: /已选节点的操作/ })).toHaveCount(0)
  await expect(page.getByRole('toolbar', { name: '画布视图控制' })).toBeVisible()
  await expect(page.getByRole('button', { name: '自动排列节点' })).toHaveCount(0)
  const mobileZoom = page.getByLabel('缩放百分比')
  await expect(mobileZoom).toBeVisible()
  const zoomBefore = Number(await mobileZoom.inputValue())
  await page.getByRole('button', { name: '放大画布' }).click()
  await expect.poll(async () => Number(await mobileZoom.inputValue())).toBeGreaterThan(zoomBefore)
  const mobileViewEvidence = await captureUnitDEvidence(page, 'mobile-review-view-dock')
  await page.screenshot({ path: mobileViewEvidence })
  await testInfo.attach('mobile-review-view-dock', { path: mobileViewEvidence, contentType: 'image/png' })
  await page.keyboard.press('Control+d')
  await page.keyboard.press('Delete')
  await page.keyboard.press('Backspace')
  await expect(page).toHaveURL(/\/app\/projects\/project-command\/canvases\/canvas-command\?canvas_runtime=legacy$/)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toBeVisible()
  await expect(page.getByRole('button', { name: /删除节点/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /删除连线/ })).toHaveCount(0)
  expect(state.requests.some((request) => ['POST', 'PUT', 'DELETE'].includes(request.method))).toBe(false)
  const mobileEvidence = await captureCommandEvidence(page, 'mobile-graph-access-panel')
  await page.screenshot({ path: mobileEvidence })
  await testInfo.attach('mobile-graph-access-panel', { path: mobileEvidence, contentType: 'image/png' })
})

test('view dock supports numeric zoom, fit, and independent grid edge minimap toggles', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state)
  const viewToolbar = page.getByRole('toolbar', { name: '画布视图控制' })
  await expect(viewToolbar).toBeVisible()
  const zoomInput = viewToolbar.getByLabel('缩放百分比')
  await zoomInput.fill('800')
  await zoomInput.press('Enter')
  await expect(zoomInput).toHaveValue('800')
  await expect.poll(() => state.requests.some((request) => (
    request.method === 'PATCH' && request.path.endsWith('/viewport') && request.body?.zoom === 8
  ))).toBe(true)

  await viewToolbar.getByLabel('打开视图选项').click()
  await viewToolbar.getByLabel('隐藏网格与吸附').click()
  await expect(page.locator('.canvas-surface')).toHaveClass(/is-grid-hidden/)
  await viewToolbar.getByLabel('隐藏连线').click()
  await expect(page.getByRole('group', { name: '画布连线' })).toBeHidden()
  await viewToolbar.getByLabel('隐藏小地图').click()
  await expect(page.locator('.minimap')).toHaveCount(0)

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+0')
  await expect(zoomInput).not.toHaveValue('800')
  await expect(page.getByRole('button', { name: '交互画布' })).toBeVisible()
  await expect(page.getByRole('button', { name: '画布已同步 · r0' })).toBeVisible()
  const evidence = await captureUnitDEvidence(page, 'desktop-view-dock')
  await page.screenshot({ path: evidence })
  await testInfo.attach('desktop-view-dock', { path: evidence, contentType: 'image/png' })
})

test('typed align and lock commands persist once and locked nodes reject mutation', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])
  await clickNode(page, 860, ['Control'])
  const toolbar = page.getByRole('toolbar', { name: '3 个已选节点的操作' })
  await toolbar.getByRole('button', { name: '排列所选节点' }).click()
  await page.getByText('左对齐', { exact: true }).click()
  await expect.poll(() => state.nodes.every((item) => item.position_x === 180)).toBe(true)
  await toolbar.getByRole('button', { name: '锁定所选节点' }).click()
  await expect.poll(() => state.nodes.every((item) => item.is_locked === true)).toBe(true)
  const patchCount = state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  )).length
  await page.keyboard.press('Delete')
  await page.waitForTimeout(650)
  expect(state.nodes).toHaveLength(3)
  expect(state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  ))).toHaveLength(patchCount)

  await toolbar.getByRole('button', { name: '解锁所选节点' }).click()
  await expect.poll(() => state.nodes.every((item) => item.is_locked === false)).toBe(true)
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Alt+Shift+f')
  await expect.poll(() => new Set(state.nodes.map((item) => item.position_x)).size).toBe(3)
  const evidence = await captureUnitDEvidence(page, 'desktop-arrange-lock')
  await page.screenshot({ path: evidence })
  await testInfo.attach('desktop-arrange-lock', { path: evidence, contentType: 'image/png' })
})

test('graph access panel hides delete actions that cannot mutate the full affected graph', async ({ page }) => {
  const state = createState()
  state.nodes.push(
    {
      ...node('protected-group', '受保护组合', 1180),
      node_type: 'group',
      content: { title: '受保护组合', subtype: 'group', serialization_version: 1 },
      width: 480,
      height: 320,
    },
    {
      ...node('future-child', '未来节点', 1260),
      node_type: 'future-storyboard',
      content: { title: '未来节点', serialization_version: 7, future_payload: true },
      parent_node_id: 'protected-group',
    },
  )
  state.connections.push(connection('connection-future-a', 'future-child', 'node-a'))

  await openCommandCanvas(page, state)
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  const dialog = page.getByRole('dialog', { name: '画布内容与快捷键' })

  await expect(dialog.getByRole('button', { name: '删除节点 镜头 B' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '删除节点 镜头 A' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: '删除连线 镜头 A 到 镜头 B' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '删除节点 受保护组合' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: '删除节点 未来节点' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: '删除连线 未来节点 到 镜头 A' })).toHaveCount(0)
})

test('Canvas-focus shortcuts group, ungroup, connect, and expose synchronized DOM graph access', async ({ page }, testInfo) => {
  const state = createState()
  await openCommandCanvas(page, state)
  await clickNode(page, 180)
  await clickNode(page, 520, ['Control'])

  await page.getByRole('link', { name: '返回项目首页' }).focus()
  await page.keyboard.press('Control+g')
  expect(state.requests.filter((request) => (
    request.method === 'PATCH' && request.path.endsWith('/document')
  ))).toHaveLength(0)

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+g')
  await expect.poll(() => state.nodes.filter((item) => item.node_type === 'group').length).toBe(1)
  await expect.poll(() => state.nodes.filter((item) => item.parent_node_id).length).toBe(2)
  await expect(page.getByRole('toolbar', { name: '1 个已选节点的操作' })).toBeVisible()
  const groupEvidence = await captureCommandEvidence(page, 'desktop-group-selection')
  await page.screenshot({ path: groupEvidence })
  await testInfo.attach('desktop-group-selection', { path: groupEvidence, contentType: 'image/png' })

  await page.keyboard.press('Control+Shift+g')
  await expect.poll(() => state.nodes.filter((item) => item.node_type === 'group').length).toBe(0)
  await expect.poll(() => state.nodes.filter((item) => item.parent_node_id).length).toBe(0)

  await clickNode(page, 860)
  await clickNode(page, 180, ['Control'])
  await page.keyboard.press('Control+Enter')
  await expect.poll(() => state.connections.some((item) => item.source_node_id === 'node-a' && item.target_node_id === 'node-c')).toBe(true)

  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: '画布内容与快捷键' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Ctrl+Z', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Ctrl+Shift+Z', { exact: true })).toBeVisible()
  await expect(dialog.getByText('Ctrl+G')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '选择并定位 镜头 A' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '查看连线 镜头 A 到 镜头 C' })).toBeVisible()
  const desktopEvidence = await captureCommandEvidence(page, 'desktop-graph-access-panel')
  await page.screenshot({ path: desktopEvidence })
  await testInfo.attach('desktop-graph-access-panel', { path: desktopEvidence, contentType: 'image/png' })
  await dialog.getByRole('button', { name: '选择并定位 镜头 B' }).click()
  await expect(page.getByRole('button', { name: '定位到 镜头 B' })).toHaveClass(/selected/)
})
