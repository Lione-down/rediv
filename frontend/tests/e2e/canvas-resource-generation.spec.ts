import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import {
  FIRST_CANVAS_ID,
  PROJECT_ID,
  SECOND_CANVAS_ID,
  createResourceMockState,
  documentPatches,
  openResourceWorkspace,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

async function openResources(page: Page) {
  const trigger = page.getByRole('button', { name: '打开项目资源' })
  await expect(trigger).toBeVisible()
  await trigger.click()
  return trigger
}

async function selectGenerationNode(page: Page) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: '选择并定位 封面生成' }).click()
  await expect(page.getByRole('dialog', { name: '画布内容与快捷键' })).toHaveCount(0)
}

async function expectNoSeriousAxeFindings(page: Page) {
  const result = await new AxeBuilder({ page }).include('.canvas-workspace').analyze()
  expect(result.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([])
}

function generationPosts(state: ResourceMockState) {
  return state.requests.filter((item) => item.method === 'POST' && item.path === '/api/image-generate')
}

test('project resources stay visible across Canvas switches and asset insertion keeps project ownership', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await openResources(page)

  const resources = page.getByRole('complementary', { name: '项目资源' })
  await expect(resources).toBeVisible()
  await expect(resources.getByRole('tablist', { name: '项目资源分类' })).toBeVisible()
  await expect(resources.getByText('海边参考图')).toBeVisible()
  const preview = resources.getByRole('img', { name: '海边参考图' })
  await expect(preview).toBeVisible()
  expect(await preview.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
  await expect(resources.getByLabel('视频素材 片场走位预览不可用')).toBeVisible()
  await expect(resources.getByLabel('音频素材 海浪环境声预览不可用')).toBeVisible()
  await resources.getByRole('tab', { name: '生成记录' }).click()
  await expect(resources.getByText('task-existing-success', { exact: true })).toBeVisible()
  await expect(resources.getByText('task-existing-failure', { exact: true })).toBeVisible()
  await resources.getByRole('tab', { name: '项目资产' }).click()

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}$`))
  await expect(resources.getByText('海边参考图')).toBeVisible()
  expect(state.requests.filter((item) => item.path === '/assets').every((item) => item.query.includes(`project_id=${PROJECT_ID}`) && !item.query.includes('origin_canvas_id'))).toBe(true)

  const assetCount = state.assets.length
  await resources.getByRole('button', { name: '插入资产 海边参考图到当前画布' }).click()
  await expect.poll(() => documentPatches(state, SECOND_CANVAS_ID).length).toBe(1)
  const insertedNode = state.documents[SECOND_CANVAS_ID].nodes.find((item) => (
    item.node_type === 'asset' && (item.content as Record<string, unknown>).asset_id === 'asset-reference'
  ))
  expect(insertedNode?.content).toEqual(expect.objectContaining({ subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/reference.png' }))
  expect(state.assets).toHaveLength(assetCount)

  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[SECOND_CANVAS_ID].nodes.some((item) => item.id === insertedNode?.id)).toBe(false)
})

test('a foreign project asset returned by the resource API cannot enter the active Canvas', async ({ page }) => {
  const state = createResourceMockState()
  state.assets.unshift({
    ...state.assets[0],
    id: 'asset-foreign',
    project_id: 'project-foreign',
    content_text: '外部项目素材',
  })
  await openResourceWorkspace(page, state)
  await openResources(page)
  const resources = page.getByRole('complementary', { name: '项目资源' })
  const patchesBefore = documentPatches(state).length

  await expect(resources.getByText('外部项目素材')).toHaveCount(0)
  await expect(resources.getByRole('button', { name: '插入资产 外部项目素材到当前画布' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(patchesBefore)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => (
    (item.content as Record<string, unknown>).asset_id === 'asset-foreign'
  ))).toBe(false)
})

test('template insertion uses the atomic target-Canvas endpoint and adopts the returned revision', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await openResources(page)
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await resources.getByRole('tab', { name: '画布模板' }).click()
  await resources.getByRole('button', { name: '将模板 分镜起步流程插入当前画布' }).click()

  await expect.poll(() => state.requests.filter((item) => item.path.endsWith('/templates/template-storyboard/instantiate')).length).toBe(1)
  const request = state.requests.find((item) => item.path.endsWith('/templates/template-storyboard/instantiate'))!
  expect(request.path).toBe(`/api/projects/${PROJECT_ID}/canvases/${FIRST_CANVAS_ID}/templates/template-storyboard/instantiate`)
  expect(request.body?.base_revision).toBe(0)
  const mutationId = String(request.body?.client_mutation_id ?? '')
  expect(mutationId.length).toBeGreaterThan(0)
  expect(mutationId.length).toBeLessThanOrEqual(64)
  expect(Boolean(request.body?.anchor_x) === Boolean(request.body?.anchor_y)).toBe(true)
  expect(documentPatches(state)).toHaveLength(0)
  await expect(page.getByText(/Canvas document.*r1/)).toBeVisible()

  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('button', { name: '选择并定位 模板脚本' })).toBeVisible()
})

test('template commit, Canvas switch, and double-click creation share one ordered mutation boundary', async ({ page }) => {
  const state = createResourceMockState()
  let releaseTemplate!: () => void
  state.templateInstantiationGate = new Promise<void>((resolvePromise) => {
    releaseTemplate = resolvePromise
  })
  await openResourceWorkspace(page, state)
  await openResources(page)
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await resources.getByRole('tab', { name: '画布模板' }).click()
  await resources.getByRole('button', { name: '将模板 分镜起步流程插入当前画布' }).click()
  await expect.poll(() => state.requests.some((item) => item.path.endsWith('/instantiate'))).toBe(true)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${FIRST_CANVAS_ID}$`))
  expect(state.events.includes(`document-loaded:${SECOND_CANVAS_ID}`)).toBe(false)
  releaseTemplate()
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}$`))
  await expect.poll(() => state.events.includes(`document-loaded:${SECOND_CANVAS_ID}`)).toBe(true)
  const surface = page.locator('.canvas-surface')
  const surfaceBox = await surface.boundingBox()
  expect(surfaceBox).not.toBeNull()
  await surface.dblclick({ position: { x: Math.min(620, (surfaceBox?.width ?? 700) - 80), y: 520 } })
  await expect.poll(() => state.documents[SECOND_CANVAS_ID].nodes.length).toBe(2)

  const templateCommittedIndex = state.events.indexOf(`template-committed:${FIRST_CANVAS_ID}`)
  const secondCanvasLoadedIndex = state.events.indexOf(`document-loaded:${SECOND_CANVAS_ID}`)
  expect(templateCommittedIndex).toBeGreaterThanOrEqual(0)
  expect(secondCanvasLoadedIndex).toBeGreaterThanOrEqual(0)
  expect(templateCommittedIndex).toBeLessThan(secondCanvasLoadedIndex)
  expect(state.documents[FIRST_CANVAS_ID].nodes.filter((item) => String(item.id).startsWith('template-'))).toHaveLength(2)
  expect(state.documents[SECOND_CANVAS_ID].nodes.some((item) => item.node_type === 'script' && item.id !== 'note-second')).toBe(true)
  await expect(resources.getByRole('alert')).toHaveCount(0)
})

test('canonical generation editor persists prompt and creates one linked result from mock success', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state)
  await selectGenerationNode(page)

  const editor = page.getByRole('region', { name: '生成任务编辑器' })
  await expect(editor).toBeVisible()
  await editor.getByRole('textbox', { name: '生成提示词' }).fill('新的电影感海边封面')
  await editor.getByRole('button', { name: '开始图片生成' }).click()
  await expect(editor.getByRole('status', { name: '生成状态' })).toContainText('已完成')

  expect(generationPosts(state)).toHaveLength(1)
  expect(generationPosts(state)[0].body).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    client_request_id: expect.any(String),
    canvas_node_id: 'generation-cover',
    prompt: '新的电影感海边封面',
    aspect_ratio: '4:3',
  })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)
  const resultNode = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))!
  expect(resultNode.content).toEqual(expect.objectContaining({ asset_id: 'asset-success', source_task_id: 'task-success', subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/success.png' }))
  expect(state.documents[FIRST_CANVAS_ID].connections).toContainEqual(expect.objectContaining({ source_node_id: 'generation-cover', target_node_id: resultNode.id, source_port: 'out', target_port: 'in' }))

  await openResources(page)
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await resources.getByRole('tab', { name: '生成记录' }).click()
  const taskRow = resources.getByRole('listitem').filter({ hasText: 'task-success' })
  await expect(taskRow.getByText('task-success', { exact: true })).toBeVisible()
  await expect(taskRow).toContainText('已完成')

  await page.reload()
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await expect(page.getByRole('button', { name: '选择并定位 图片生成结果' })).toBeVisible()
})

test('generation may finish after a Canvas switch and reconciles exactly once on the origin Canvas', async ({ page }) => {
  const state = createResourceMockState()
  let releaseGeneration!: () => void
  state.generationGate = new Promise<void>((resolvePromise) => {
    releaseGeneration = resolvePromise
  })
  await openResourceWorkspace(page, state)
  await selectGenerationNode(page)
  const editor = page.getByRole('region', { name: '生成任务编辑器' })
  await editor.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => generationPosts(state).length).toBe(1)

  await page.getByRole('button', { name: '画布 1' }).click()
  await page.getByRole('option', { name: /分镜/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${SECOND_CANVAS_ID}$`))
  await expect.poll(() => state.events.includes(`document-loaded:${SECOND_CANVAS_ID}`)).toBe(true)
  releaseGeneration()
  await expect.poll(() => state.tasks.some((item) => item.id === 'task-success')).toBe(true)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))).toBe(false)

  await page.getByRole('button', { name: '分镜', exact: true }).click()
  await page.getByRole('option', { name: /画布 1/ }).click()
  await expect(page).toHaveURL(new RegExp(`/canvases/${FIRST_CANVAS_ID}$`))
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')
      ?.content as Record<string, unknown>
  ).generation_status).toBe('succeeded')
  const reconciliationPatches = documentPatches(state).filter((request) => {
    const nodeUpserts = (request.body?.node_upserts ?? []) as Array<Record<string, unknown>>
    const connectionUpserts = (request.body?.connection_upserts ?? []) as Array<Record<string, unknown>>
    const sourceNode = nodeUpserts.find((item) => item.id === 'generation-cover')
    const sourceContent = sourceNode?.content as Record<string, unknown> | undefined
    const resultNode = nodeUpserts.find((item) => (
      (item.content as Record<string, unknown> | undefined)?.source_task_id === 'task-success'
    ))
    return sourceContent?.generation_task_id === 'task-success' &&
      sourceContent.result_materialized_task_id === 'task-success' &&
      Boolean(resultNode) && connectionUpserts.some((item) => (
        item.source_node_id === 'generation-cover' && item.target_node_id === resultNode?.id
      ))
  })
  expect(reconciliationPatches).toHaveLength(1)
  await page.getByRole('region', { name: 'Revid 无限画布工作区' }).focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(0)
  expect((
    state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')
      ?.content as Record<string, unknown>
  ).result_materialized_task_id).toBe('task-success')
  await page.waitForTimeout(700)
  await page.reload()
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(0)
})

test('mock provider failure remains durable, no-charge, no-result, and never auto-retries', async ({ page }) => {
  const state = createResourceMockState()
  state.generationOutcome = 'failure'
  const initialQuotas = { ...state.quotas }
  const initialRevision = state.quotaRevision
  await openResourceWorkspace(page, state)
  await selectGenerationNode(page)

  const editor = page.getByRole('region', { name: '生成任务编辑器' })
  await editor.getByRole('button', { name: '开始图片生成' }).click()
  await expect(editor.getByRole('alert')).toContainText('mock provider unavailable')
  await page.waitForTimeout(700)
  expect(generationPosts(state)).toHaveLength(1)
  expect(state.quotas).toEqual(initialQuotas)
  expect(state.quotaRevision).toBe(initialRevision)
  expect(state.assets.some((item) => item.id === 'asset-success')).toBe(false)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-failure'
  ))).toBe(false)

  await openResources(page)
  const resources = page.getByRole('complementary', { name: '项目资源' })
  await resources.getByRole('tab', { name: '生成记录' }).click()
  await expect(resources.getByText('task-failure')).toBeVisible()
  await expect(resources.getByText('mock provider unavailable', { exact: true })).toBeVisible()
  await expect.poll(() => (
    state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')
      ?.content as Record<string, unknown>
  ).generation_status).toBe('failed')
  await page.reload()
  expect((
    state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-cover')
      ?.content as Record<string, unknown>
  ).generation_task_id).toBe('task-failure')
})

test('resource and generation drawers are keyboard complete at desktop and 920px', async ({ page }) => {
  const desktopState = createResourceMockState()
  await openResourceWorkspace(page, desktopState)
  await openResources(page)
  const panel = page.getByRole('complementary', { name: '项目资源' })
  const panelBox = await panel.boundingBox()
  expect(panelBox?.width).toBeGreaterThanOrEqual(280)
  expect(panelBox?.width).toBeLessThanOrEqual(420)
  const separator = page.getByRole('separator', { name: '调整项目资源面板宽度' })
  await expect(separator).toHaveAttribute('aria-valuemin', '280')
  await expect(separator).toHaveAttribute('aria-valuemax', '420')
  const separatorBox = await separator.boundingBox()
  expect(separatorBox?.width).toBeGreaterThanOrEqual(40)
  expect(separatorBox?.x).toBeGreaterThanOrEqual((panelBox?.x ?? 0) + (panelBox?.width ?? 0) - 1)
  const widthBefore = Number(await separator.getAttribute('aria-valuenow'))
  await separator.focus()
  await page.keyboard.press('ArrowRight')
  expect(Number(await separator.getAttribute('aria-valuenow'))).toBeGreaterThan(widthBefore)
  const dragStart = separatorBox?.x ?? 0
  const separatorHandle = await separator.elementHandle()
  expect(separatorHandle).not.toBeNull()
  await separatorHandle!.dispatchEvent('pointerdown', {
    button: 0, clientX: dragStart, isPrimary: true, pointerId: 41,
  })
  await page.evaluate((clientX) => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX, pointerId: 41 }))
  }, dragStart + 24)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  const widthAfterCancel = Number(await separator.getAttribute('aria-valuenow'))
  await page.evaluate((clientX) => {
    window.dispatchEvent(new PointerEvent('pointermove', { clientX, pointerId: 41 }))
  }, dragStart + 64)
  expect(Number(await separator.getAttribute('aria-valuenow'))).toBe(widthAfterCancel)
  await expectNoSeriousAxeFindings(page)

  const narrowState = createResourceMockState()
  await page.unrouteAll({ behavior: 'wait' })
  await openResourceWorkspace(page, narrowState, { width: 920, height: 900 })
  const trigger = await openResources(page)
  const drawer = page.getByRole('dialog', { name: '项目资源' })
  await expect(drawer).toHaveAttribute('aria-modal', 'true')
  await expect(drawer.getByRole('tab', { name: '项目资产' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(drawer.getByRole('tab', { name: '画布模板' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
  await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})

test('four viewport matrix preserves editable desktop and narrow layouts plus 375px review-only resources', async ({ page }, testInfo) => {
  const viewports = [
    { name: 'desktop', width: 1440, height: 900, editable: true, drawer: false },
    { name: 'compact', width: 1366, height: 768, editable: true, drawer: false },
    { name: 'narrow', width: 920, height: 900, editable: true, drawer: true },
    { name: 'mobile', width: 375, height: 812, editable: false, drawer: true },
  ]
  for (const viewport of viewports) {
    const state = createResourceMockState()
    await openResourceWorkspace(page, state, viewport)
    await openResources(page)
    const resources = page.getByRole(viewport.drawer ? 'dialog' : 'complementary', { name: '项目资源' })
    await expect(resources).toBeVisible()
    await expect(resources.getByText('海边参考图')).toBeVisible()
    if (viewport.editable) {
      await expect(resources.getByRole('button', { name: '上传项目资产' })).toBeVisible()
      await expect(resources.getByRole('button', { name: '插入资产 海边参考图到当前画布' })).toBeVisible()
    } else {
      await expect(page.getByRole('region', { name: 'Revid 无限画布工作区' })).toHaveAttribute('aria-description', '只读审阅模式')
      await expect(resources.getByRole('button', { name: '上传项目资产' })).toHaveCount(0)
      await expect(resources.getByRole('button', { name: /插入资产 .*到当前画布/ })).toHaveCount(0)
      await resources.getByRole('tab', { name: '画布模板' }).click()
      await expect(resources.getByRole('button', { name: /将模板 .*插入当前画布/ })).toHaveCount(0)
      await resources.getByRole('tab', { name: '生成记录' }).click()
      await expect(resources.getByRole('button', { name: /重试.*生成/ })).toHaveCount(0)
      const mutationsBefore = state.requests.filter((item) => ['POST', 'PATCH', 'DELETE'].includes(item.method)).length
      await page.keyboard.press('Control+d')
      await page.keyboard.press('Delete')
      await page.keyboard.press('Control+g')
      await page.keyboard.press('Control+l')
      await page.waitForTimeout(250)
      expect(state.requests.filter((item) => ['POST', 'PATCH', 'DELETE'].includes(item.method))).toHaveLength(mutationsBefore)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await expectNoSeriousAxeFindings(page)
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}.png`), fullPage: true })
    await page.unrouteAll({ behavior: 'wait' })
  }
})
