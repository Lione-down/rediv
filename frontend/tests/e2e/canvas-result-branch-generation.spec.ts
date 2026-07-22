import { expect, test } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  addEarlierVariant,
  addTwoOriginMerge,
  createResourceMockState,
  documentPatches,
  FIRST_CANVAS_ID,
  openResourceWorkspace,
  PROJECT_ID,
} from './canvas-resource-generation-fixture'

const evidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-032-result-branch')
const bridgeEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-056-generation-input-lineage')
const multiOriginEvidenceDirectory = resolve(process.cwd(), '..', 'output', 'playwright', 't5-057-multi-origin-navigation')

async function selectNode(page: import('@playwright/test').Page, title: string) {
  await page.getByRole('button', { name: '打开画布内容与快捷键' }).click()
  await page.getByRole('button', { name: `选择并定位 ${title}`, exact: true }).click()
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

test('two-origin generated keyframes create a durable playable video result', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginMerge(state)
  const document = state.documents[FIRST_CANVAS_ID]
  const generation = document.nodes.find((item) => item.id === 'generation-two-origin-merge')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    subtype: 'video', title: '双源关键帧视频', text: '从远景推进到人物海岸镜头。',
  }
  const initialQuota = state.quotas.video

  await openResourceWorkspace(page, state)
  await selectNode(page, '双源关键帧视频')
  const editor = page.locator('.generation-editor')
  await editor.getByRole('radio', { name: '关键帧' }).click()
  const context = editor.getByRole('region', { name: '已连接生成上下文' })
  await context.getByText('检查最终生成请求').click()
  const requestPreview = page.getByRole('region', { name: '有序媒体请求' })
  await expect(requestPreview.locator('li').nth(0)).toContainText('视频关键帧 R1')
  await expect(requestPreview.locator('li').nth(0)).toContainText('历史图片生成结果')
  await expect(requestPreview.locator('li').nth(1)).toContainText('视频关键帧 R2')
  await expect(requestPreview.locator('li').nth(1)).toContainText('第二镜头结果')

  await context.getByRole('button', { name: '下移参考图 历史图片生成结果' }).click()
  await expect(requestPreview.locator('li').nth(0)).toContainText('第二镜头结果')
  await expect(page.locator('.generation-source-provenance', { hasText: 'R1 · V1' })).toHaveCount(1)
  await expect(page.locator('.generation-source-provenance', { hasText: 'R2 · V2' })).toHaveCount(1)
  await editor.getByRole('textbox').fill('从远景海岸平滑推进到人物近景，保持低饱和电影感。')
  await editor.locator('.generate-button').click()

  await expect.poll(() => state.requests.filter((item) => item.path === '/api/video-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/video-generate')?.body).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    client_request_id: expect.any(String),
    canvas_node_id: 'generation-two-origin-merge',
    prompt: '从远景海岸平滑推进到人物近景，保持低饱和电影感。',
    image_ids: ['asset-second-origin', 'asset-generated'],
    reference_mode: 'keyframes',
    duration_seconds: 5,
  })
  expect(state.quotas.video).toBe(initialQuota - 1)

  await expect.poll(() => document.nodes.filter((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  )).length).toBe(1)
  const result = document.nodes.find((item) => (
    (item.content as Record<string, unknown>).source_task_id === 'task-success'
  ))!
  expect(result.content).toEqual(expect.objectContaining({
    subtype: 'video', url: 'https://media.revid.test/success.mp4', source_task_id: 'task-success',
  }))
  expect(document.connections).toContainEqual(expect.objectContaining({
    source_node_id: 'generation-two-origin-merge', target_node_id: result.id,
  }))

  await page.locator('.view-controls > button').first().click()
  const video = page.locator('.asset-card video[src$="success.mp4"]')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1)
  await mkdir(multiOriginEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-playable-video-1440x900.png'), fullPage: true })

  await page.reload()
  await selectNode(page, String((result.content as Record<string, unknown>).title))
  await expect(page.locator('.result-lineage-detail')).toContainText('task-success')
  await expect(page.locator('.result-lineage-detail')).toContainText('双源关键帧视频')
  const reloadedVideo = page.locator('video[aria-label="视频结果"]')
  await expect(reloadedVideo).toBeVisible()
  await expect.poll(() => reloadedVideo.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1)
  const playback = await reloadedVideo.evaluate(async (element: HTMLVideoElement) => {
    await element.play()
    return { duration: element.duration, paused: element.paused, width: element.videoWidth, height: element.videoHeight }
  })
  expect(playback.paused).toBe(false)
  expect(playback.duration).toBeGreaterThan(0)
  expect(playback.width).toBeGreaterThan(0)
  expect(playback.height).toBeGreaterThan(0)
  await reloadedVideo.evaluate((element: HTMLVideoElement) => element.pause())
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-playable-video-reload-1440x900.png'), fullPage: true })
})

test('two-origin video keyframes stay bounded in compact and passive in readonly', async ({ page }) => {
  const state = createResourceMockState()
  addTwoOriginMerge(state)
  const generation = state.documents[FIRST_CANVAS_ID].nodes.find((item) => item.id === 'generation-two-origin-merge')!
  generation.content = {
    ...(generation.content as Record<string, unknown>),
    subtype: 'video', title: '双源关键帧视频', text: '从远景推进到人物海岸镜头。',
  }

  await openResourceWorkspace(page, state, { width: 920, height: 900 })
  await selectNode(page, '双源关键帧视频')
  const compactDrawer = page.locator('.n-drawer:visible')
  const compactContext = compactDrawer.getByRole('region', { name: '已连接生成上下文' })
  await compactContext.getByText('检查最终生成请求').click()
  await expect(page.getByRole('region', { name: '有序媒体请求' })).toContainText('视频关键帧 R1')
  await expect(page.getByRole('region', { name: '有序媒体请求' })).toContainText('视频关键帧 R2')
  await expect(compactDrawer.getByRole('button', { name: '开始视频生成' })).toBeVisible()
  const compactBox = await compactDrawer.boundingBox()
  expect(compactBox?.width).toBeLessThanOrEqual(360)
  await mkdir(multiOriginEvidenceDirectory, { recursive: true })
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-video-keyframes-compact-920x900.png'), fullPage: true })

  await openResourceWorkspace(page, state, { width: 375, height: 812 })
  await selectNode(page, '双源关键帧视频')
  const readonlyDrawer = page.locator('.n-drawer:visible')
  const readonlyContext = readonlyDrawer.getByRole('region', { name: '已连接生成上下文' })
  await expect(readonlyContext).toContainText('来自 封面生成 · V2')
  await expect(readonlyContext).toContainText('来自 第二镜头生成 · V1')
  await expect(readonlyContext.getByRole('button', { name: /上移参考图|下移参考图/ })).toHaveCount(0)
  await expect(readonlyDrawer.getByRole('button', { name: '开始视频生成' })).toHaveCount(0)
  await expect.poll(async () => {
    const box = await readonlyDrawer.boundingBox()
    return box ? Math.round(box.x + box.width) : Number.POSITIVE_INFINITY
  }).toBeLessThanOrEqual(375)
  const readonlyBox = await readonlyDrawer.boundingBox()
  expect(readonlyBox?.x).toBeGreaterThanOrEqual(0)
  await page.screenshot({ path: resolve(multiOriginEvidenceDirectory, 'two-origin-video-readonly-375x812.png'), fullPage: true })
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
    client_request_id: expect.any(String),
    canvas_node_id: generationNode.id,
    prompt: 'Animate the coastal still with a slow push-in',
    image_ids: ['asset-generated'],
    reference_mode: 'image-to-video',
    duration_seconds: 5,
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
  await page.getByRole('button', { name: '关闭节点详情' }).click()
  await expect(page.locator('.n-drawer:visible')).toHaveCount(0)
  await page.getByRole('textbox', { name: '卡片生成提示词' }).fill('保留海岸构图，增强远处雾气层次。')
  await page.getByRole('button', { name: '在当前卡片生成' }).click()
  await expect.poll(() => state.requests.filter((item) => item.path === '/api/image-generate').length).toBe(1)
  expect(state.requests.find((item) => item.path === '/api/image-generate')?.body).toEqual({
    project_id: PROJECT_ID,
    origin_canvas_id: FIRST_CANVAS_ID,
    client_request_id: expect.any(String),
    canvas_node_id: expect.any(String),
    prompt: '保留海岸构图，增强远处雾气层次。',
    image_ids: ['asset-generated'],
    aspect_ratio: '4:3',
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
