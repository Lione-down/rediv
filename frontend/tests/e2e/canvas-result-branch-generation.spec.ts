import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-032-result-branch')
const bridgeEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-056-generation-input-lineage')
const multiOriginEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-057-multi-origin-navigation')

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
}

function addEarlierVariant(state: ResourceMockState) {
  const document = state.documents[FIRST_CANVAS_ID]
  const existingResult = document.nodes.find((item) => item.id === 'result-existing')!
  const existingResultEdge = document.connections.find((item) => item.target_node_id === existingResult.id)!
  document.nodes.push({
    ...existingResult,
    id: 'result-earlier-variant',
    content: {
      ...(existingResult.content as Record<string, unknown>),
      asset_id: 'asset-earlier-variant',
      title: '更早的封面版本',
      url: 'https://media.revid.test/earlier-variant.png',
    },
    position_x: existingResult.position_x,
    position_y: existingResult.position_y + 260,
  })
  document.connections.unshift({
    ...existingResultEdge,
    id: 'connection-earlier-variant',
    target_node_id: 'result-earlier-variant',
  })
}

function addTwoOriginMerge(state: ResourceMockState) {
  addEarlierVariant(state)
  const document = state.documents[FIRST_CANVAS_ID]
  const sourceGeneration = document.nodes.find((item) => item.id === 'generation-cover')!
  const sourceResult = document.nodes.find((item) => item.id === 'result-existing')!
  const sourceEdge = document.connections.find((item) => item.target_node_id === sourceResult.id)!
  document.nodes.push(
    {
      ...sourceGeneration,
      id: 'generation-second-origin',
      content: { subtype: 'image', serialization_version: 1, title: '第二镜头生成', text: '远景海岸。' },
      position_x: 540,
      position_y: 520,
    },
    {
      ...sourceResult,
      id: 'result-second-origin',
      content: {
        ...(sourceResult.content as Record<string, unknown>),
        asset_id: 'asset-second-origin', source_task_id: 'task-second-origin',
        title: '第二镜头结果', url: 'https://media.revid.test/second-origin.png',
      },
      position_x: 980,
      position_y: 520,
    },
    {
      ...sourceGeneration,
      id: 'generation-two-origin-merge',
      content: { subtype: 'image', serialization_version: 1, title: '双源合并生成', text: '融合两个海岸镜头。' },
      position_x: 1420,
      position_y: 300,
    },
  )
  document.connections.push(
    { ...sourceEdge, id: 'connection-second-origin-result', source_node_id: 'generation-second-origin', target_node_id: 'result-second-origin', metadata: { source_task_id: 'task-second-origin' } },
    { ...sourceEdge, id: 'connection-merge-first', source_node_id: 'result-existing', target_node_id: 'generation-two-origin-merge', target_port: 'media', metadata: { input_order: 1 } },
    { ...sourceEdge, id: 'connection-merge-second', source_node_id: 'result-second-origin', target_node_id: 'generation-two-origin-merge', target_port: 'media', metadata: { input_order: 2 } },
  )
  state.assets.push({
    ...state.assets.find((item) => item.id === 'asset-generated')!,
    id: 'asset-second-origin', canvas_node_id: 'generation-second-origin',
    url: 'https://media.revid.test/second-origin.png', source_task_id: 'task-second-origin',
  })
}

test('two-origin merge exposes independent R V identity and origin navigation', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginMerge(state)
  await openResourceWorkspace(page, state)
  await selectNode(page, '双源合并生成')

  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V2' })).toHaveCount(1)
  await expect(page.locator('.generation-source-provenance', { hasText: 'R2 · V1' })).toHaveCount(1)
  const editor = page.locator('.generation-editor')
  await expect(editor.getByRole('button', { name: '定位到上游生成：封面生成 V2' })).toBeVisible()
  await expect(editor.getByRole('button', { name: '定位到上游生成：第二镜头生成 V1' })).toBeVisible()
  await mkdir(multiOriginEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-merge-1440x900.png'), fullPage: true })

  const context = editor.getByRole('region', { name: '已连接生成上下文' })
  await context.getByRole('button', { name: '下移参考图 历史图片生成结果' }).click()
  await expect(context.locator('li').filter({ hasText: '参考图 1 · 第二镜头结果' })).toContainText('来自 第二镜头生成 · V1')
  await expect(context.locator('li').filter({ hasText: '参考图 2 · 历史图片生成结果' })).toContainText('来自 封面生成 · V2')
  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V1' })).toHaveCount(1)
  await expect(page.locator('.generation-source-provenance', { hasText: 'R2 · V2' })).toHaveCount(1)
  await expect.poll(() => documentPatches(state).length).toBe(1)

  const stage = page.getByRole('region', { name: 'Revid 无限画布工作区' })
  await stage.focus()
  await page.keyboard.press('Control+z')
  await expect(context.locator('li').filter({ hasText: '参考图 1 · 历史图片生成结果' })).toContainText('来自 封面生成 · V2')
  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V2' })).toHaveCount(1)
  await expect.poll(() => documentPatches(state).length).toBe(2)
  await page.keyboard.press('Control+Shift+z')
  await expect(context.locator('li').filter({ hasText: '参考图 1 · 第二镜头结果' })).toContainText('来自 第二镜头生成 · V1')
  await expect(page.locator('.generation-source-provenance', { hasText: 'R2 · V2' })).toHaveCount(1)
  await expect.poll(() => documentPatches(state).length).toBe(3)
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-reordered-1440x900.png'), fullPage: true })

  await page.reload()
  await selectNode(page, '双源合并生成')
  const reloadedEditor = page.locator('.generation-editor')
  const reloadedContext = reloadedEditor.getByRole('region', { name: '已连接生成上下文' })
  await expect(reloadedContext.locator('li').filter({ hasText: '参考图 1 · 第二镜头结果' })).toContainText('来自 第二镜头生成 · V1')
  await expect(reloadedContext.locator('li').filter({ hasText: '参考图 2 · 历史图片生成结果' })).toContainText('来自 封面生成 · V2')
  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V1' })).toHaveCount(1)
  await expect(page.locator('.generation-source-provenance', { hasText: 'R2 · V2' })).toHaveCount(1)
  await expect(reloadedEditor.getByRole('button', { name: '定位到上游生成：封面生成 V2' })).toBeVisible()
  await expect(reloadedEditor.getByRole('button', { name: '定位到上游生成：第二镜头生成 V1' })).toBeVisible()

  await reloadedEditor.getByRole('textbox').fill('融合两个海岸镜头并保持低饱和。')
  await reloadedEditor.locator('.generate-button').click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/image-generate')?.body).toEqual(expect.objectContaining({
    image_ids: ['asset-second-origin', 'asset-generated'],
  }))

  await selectNode(page, '双源合并生成')
  await page.getByRole('button', { name: '定位到上游生成：第二镜头生成 V1' }).click()
  await expect(page.getByRole('complementary', { name: '节点详情 第二镜头生成' })).toBeVisible()
})

test('920px two-origin merge reorders inside the bounded drawer', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginMerge(state)
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '双源合并生成')

  const drawer = page.locator('.n-drawer:visible')
  const context = drawer.getByRole('region', { name: '已连接生成上下文' })
  await expect(drawer).toBeVisible()
  await expect(context.locator('li').filter({ hasText: '参考图 1 · 历史图片生成结果' })).toContainText('来自 封面生成 · V2')
  await context.getByRole('button', { name: '下移参考图 历史图片生成结果' }).click()
  await expect(context.locator('li').filter({ hasText: '参考图 1 · 第二镜头结果' })).toContainText('来自 第二镜头生成 · V1')
  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V1' })).toHaveCount(1)
  const drawerBox = await drawer.boundingBox()
  expect(drawerBox?.width).toBeLessThanOrEqual(360)
  await mkdir(multiOriginEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-reordered-compact-920x900.png'), fullPage: true })
})

test('375px readonly two-origin merge preserves both origins without mutation', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginMerge(state)
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '双源合并生成')

  const drawer = page.locator('.n-drawer:visible')
  const context = drawer.getByRole('region', { name: '已连接生成上下文' })
  await expect(context.getByRole('button', { name: /上移参考图|下移参考图/ })).toHaveCount(0)
  await expect(context.getByRole('button', { name: '定位到上游生成：封面生成 V2' })).toBeVisible()
  await expect(context.getByRole('button', { name: '定位到上游生成：第二镜头生成 V1' })).toBeVisible()
  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V2' })).toHaveCount(1)
  await expect(page.locator('.generation-source-provenance', { hasText: 'R2 · V1' })).toHaveCount(1)
  await mkdir(multiOriginEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-readonly-375x812.png'), fullPage: true })
  await context.getByRole('button', { name: '定位到上游生成：第二镜头生成 V1' }).click()
  await expect(page.locator('.n-drawer:visible')).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
})

test('image result branches into a request-ready video workflow and playable result', async ({ page }) => {
  const state = createResourceMockState()
  addEarlierVariant(state)
  const initialVideoQuota = state.quotas.video
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  const review = page.locator('.node-review')
  const branch = review.locator('.result-branch')
  await expect(branch).toBeVisible()
  await branch.locator('summary').click()
  await expect(branch).toContainText('作为参考图')
  await mkdir(evidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-branch-menu-1440x900.png'), fullPage: true })
  await branch.getByRole('button', { name: /视频生成/ }).click()

  await expect.poll(() => documentPatches(state).length).toBe(1)
  const generationNode = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    item.node_type === 'generation' && item.id !== 'generation-cover'
  ))!
  expect(generationNode).toBeTruthy()
  expect(state.documents[FIRST_CANVAS_ID].connections).toContainEqual(expect.objectContaining({
    source_node_id: 'result-existing', target_node_id: generationNode.id,
    source_port: 'out', target_port: 'media', metadata: { input_order: 1 },
  }))
  const editor = page.locator('.generation-editor')
  await expect(editor).toBeVisible()
  await expect(editor.locator('.connected-context')).toContainText('历史图片生成结果')
  await expect(editor.locator('.connected-context')).toContainText('来自 封面生成 · V2')
  await expect(page.locator('.generation-source-provenance')).toContainText('R1 · V2')
  await expect(editor.getByRole('button', { name: '定位到上游生成：封面生成 V2' })).toBeVisible()
  await mkdir(bridgeEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(bridgeEvidenceDirectory, 'chained-v2-to-r1-1440x900.png'), fullPage: true })

  await page.locator('.workspace-stage').focus()
  await page.keyboard.press('Control+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generationNode.id)).toBe(false)
  await page.keyboard.press('Control+Shift+z')
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generationNode.id)).toBe(true)
  await selectNode(page, '视频生成')

  const restoredEditor = page.locator('.generation-editor')
  await restoredEditor.getByRole('textbox').fill('Animate the coastal still with a slow push-in')
  await restoredEditor.locator('.generate-button').click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)
  const request = state.requests.find((item) => item.path === '/api/video-generate')!.body
  expect(request).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: generationNode.id,
    prompt: 'Animate the coastal still with a slow push-in',
    image_ids: ['asset-generated'],
  })
  await expect.poll(() => state.documents[FIRST_CANVAS_ID].nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)
  expect(state.quotas.video).toBe(initialVideoQuota - 1)
  const result = state.documents[FIRST_CANVAS_ID].nodes.find((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))!
  expect(result.content).toEqual(expect.objectContaining({ subtype: 'video', url: 'https://media.revid.test/success.mp4' }))
  expect(state.documents[FIRST_CANVAS_ID].connections).toContainEqual(expect.objectContaining({
    source_node_id: generationNode.id, target_node_id: result.id,
  }))

  await page.locator('.view-controls > button').first().click()
  const video = page.locator('.asset-card video[src$="success.mp4"]')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1)
  await page.screenshot({ path: resolve(evidenceDirectory, 'result-video-result-1440x900.png'), fullPage: true })

  await page.reload()
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === generationNode.id)).toBe(true)
  expect(state.documents[FIRST_CANVAS_ID].nodes.some((item) => item.id === result.id)).toBe(true)
  await selectNode(page, '视频生成')
  await expect(page.locator('.generation-editor .connected-context')).toContainText('来自 封面生成 · V2')
  await expect(page.locator('.generation-source-provenance')).toContainText('R1 · V2')
  await page.getByRole('button', { name: '定位到上游生成：封面生成 V2' }).click()
  await expect(page.getByRole('complementary', { name: '节点详情 封面生成' })).toBeVisible()
  await selectNode(page, '视频生成')
  await page.getByRole('button', {
    name: '定位到画布：历史图片生成结果，来自 封面生成 V2',
  }).click()
  await expect(page.locator('.result-lineage-detail')).toContainText('V2 / 2')
  await selectNode(page, String((result.content as Record<string, unknown>).title))
  await expect(page.locator('.result-lineage-detail')).toContainText('task-success')
})

test('video, missing-asset, and readonly image results expose no branch mutation', async ({ page }) => {
  const state = createResourceMockState()
  const result = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'result-existing')!
  ;(result.content as Record<string, unknown>).subtype = 'video'
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  await expect(page.locator('.result-branch')).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)

  ;(result.content as Record<string, unknown>).subtype = 'image'
  delete (result.content as Record<string, unknown>).asset_id
  await openResourceWorkspace(page, state)
  await selectNode(page, '历史图片生成结果')
  await expect(page.locator('.result-branch')).toHaveCount(0)

  ;(result.content as Record<string, unknown>).asset_id = 'asset-generated'
  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '历史图片生成结果')
  await expect(page.locator('.result-branch')).toHaveCount(0)
})

test('920px result branch disclosure and generation drawer stay in bounds', async ({ page }) => {
  const state = createResourceMockState()
  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '历史图片生成结果')
  const branch = page.locator('.result-branch')
  await branch.locator('summary').click()
  const box = await branch.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(920)
  await branch.getByRole('button', { name: /图片生成/ }).click()
  await expect(page.locator('.generation-editor')).toBeVisible()
  await expect(page.locator('.generation-source-provenance')).toContainText('R1 · V1')
  const drawerBox = await page.locator('.n-drawer:visible').boundingBox()
  expect(drawerBox?.width).toBeLessThanOrEqual(360)
  await mkdir(bridgeEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(bridgeEvidenceDirectory, 'compact-v1-to-r1-920x900.png'), fullPage: true })
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'origin-link-compact-920x900.png'), fullPage: true })
  await page.getByRole('textbox', { name: '生成提示词' }).fill('保留海岸构图，增强远处雾气层次。')
  await page.getByRole('button', { name: '开始图片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/image-generate')?.body).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    canvas_node_id: expect.any(String),
    prompt: '保留海岸构图，增强远处雾气层次。',
    image_ids: ['asset-generated'],
  })
})

test('375px readonly downstream generation preserves the V2 to R1 bridge without mutation', async ({ page }) => {
  const state = createResourceMockState()
  addEarlierVariant(state)
  const document = state.documents[FIRST_CANVAS_ID]
  const sourceGeneration = document.nodes.find((item) => item.id === 'generation-cover')!
  document.nodes.push({
    ...sourceGeneration,
    id: 'generation-downstream',
    content: {
      subtype: 'video', serialization_version: 1, title: '续写动态镜头', text: '保持海岸雾气并缓慢推进。',
    },
    position_x: 1380,
    position_y: 240,
  })
  const resultEdge = document.connections.find((item) => item.target_node_id === 'result-existing')!
  document.connections.push({
    ...resultEdge,
    id: 'connection-downstream-result',
    source_node_id: 'result-existing',
    target_node_id: 'generation-downstream',
    target_port: 'media',
    metadata: { input_order: 1 },
  })

  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '续写动态镜头')
  await expect(page.locator('.generation-source-provenance')).toContainText('R1 · V2')
  await expect(page.locator('.generation-editor .connected-context')).toContainText('来自 封面生成 · V2')
  await mkdir(bridgeEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(bridgeEvidenceDirectory, 'readonly-v2-to-r1-375x812.png'), fullPage: true })
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'origin-link-readonly-375x812.png'), fullPage: true })
  await page.getByRole('button', { name: '定位到上游生成：封面生成 V2' }).click()
  await expect(page.locator('.n-drawer:visible')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '开始视频生成' })).toHaveCount(0)
  expect(documentPatches(state)).toHaveLength(0)
})
